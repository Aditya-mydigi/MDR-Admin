import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { region, active, plan_id, expiry_date } = body;

        const isIndia = region?.toLowerCase() === "india";
        const prisma = isIndia ? prismaIndia : prismaUSA;

        let updateData: any = {
            user_plan_active: active,
        };

        if (active) {
            const today = new Date();
            let finalExpiryDate: Date;

            if (expiry_date) {
                finalExpiryDate = new Date(expiry_date);
            } else {
                // Calculate expiry date (default to 1 year = 365 days if plan not found)
                let validityDays = 365;
                const targetPlanId = plan_id || "1";

                try {
                    const plan = await (prisma as any).plans.findUnique({
                        where: { plan_id: targetPlanId },
                    });
                    if (plan && plan.validity_in_days) {
                        validityDays = plan.validity_in_days;
                    }
                } catch (err) {
                    console.error("Plan lookup failed, using default 365 days", err);
                }

                finalExpiryDate = new Date(today);
                finalExpiryDate.setDate(finalExpiryDate.getDate() + validityDays);
            }

            updateData = {
                ...updateData,
                plan_id: plan_id || "1",
                payment_date: today,
                expiry_date: finalExpiryDate,
            };

            if (isIndia) {
                updateData.credit = 999;
            }
        } else {
            updateData = {
                ...updateData,
                plan_id: null,
                payment_date: null,
                expiry_date: null,
            };

            if (isIndia) {
                updateData.credit = 5;
            }
        }

        const updatedUser = await (prisma as any).users.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: `User subscription ${active ? "activated" : "deactivated"}`,
            user: updatedUser,
        });
    } catch (error: any) {
        console.error("❌ Subscription update error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to update subscription" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await params; // Await params even if id is not used to comply with Next.js 15
        const body = await request.json();
        const { region, mdr_id } = body;

        if (!mdr_id) {
            return NextResponse.json(
                { error: "mdr_id is required." },
                { status: 400 }
            );
        }

        const isIndia = region?.toLowerCase() === "india";
        const prisma = isIndia ? prismaIndia : prismaUSA;

        console.log(
            `🗑️ Deleting user with mdr_id=${mdr_id} in region=${region}`
        );

        await (prisma as any).$transaction(
            async (tx: any) => {
                /* 1️⃣ Get user ID safely (same as Express code) */
                const users = await tx.$queryRaw<
                    { id: string }[]
                >`SELECT id FROM public.users WHERE mdr_id = ${mdr_id}`;

                if (!users.length) {
                    throw new Error("User not found");
                }

                const userId = users[0].id;

                /* 2️⃣ Immunization tables */
                await tx.$executeRawUnsafe(`
        DELETE FROM immunizations.vaccination_details
        WHERE record_id IN (
          SELECT id
          FROM immunizations.user_immunizations_records
          WHERE mdr_id = $1
        )
      `, mdr_id);

                await tx.$executeRawUnsafe(`
        DELETE FROM immunizations.user_immunizations_records
        WHERE mdr_id = $1
      `, mdr_id);

                /* 3️⃣ Auth / referrals / coupons */
                await tx.$executeRawUnsafe(
                    "DELETE FROM auth.user_tokens_session WHERE mdr_id = $1",
                    mdr_id
                );

                await tx.$executeRawUnsafe(
                    "DELETE FROM public.referrals WHERE user_mdr_id = $1",
                    mdr_id
                );

                await tx.$executeRawUnsafe(
                    "DELETE FROM public.user_coupon_log WHERE userid = $1::uuid",
                    userId
                );

                /* 4️⃣ Medication */
                await tx.$executeRawUnsafe(
                    "DELETE FROM medication.medications WHERE user_id = $1::uuid",
                    userId
                );

                await tx.$executeRawUnsafe(
                    "DELETE FROM medication.past_medications WHERE user_id = $1::uuid",
                    userId
                );

                /* 5️⃣ Prenatal */
                await tx.$executeRawUnsafe(
                    "DELETE FROM prenatal.prenatal_appointments WHERE users_id = $1::uuid",
                    userId
                );

                await tx.$executeRawUnsafe(
                    "DELETE FROM prenatal.prenatal_journals WHERE users_id = $1::uuid",
                    userId
                );

                await tx.$executeRawUnsafe(
                    "DELETE FROM prenatal.prenatal_user_data WHERE users_id = $1::uuid",
                    userId
                );

                await tx.$executeRawUnsafe(
                    "DELETE FROM prenatal.user_data WHERE user_id = $1::uuid",
                    userId
                );

                /* 6️⃣ Vitals */
                await tx.$executeRawUnsafe(
                    "DELETE FROM vitals.user_measurements WHERE user_id = $1::uuid",
                    userId
                );

                /* 7️⃣ Finally delete user */
                await tx.$executeRawUnsafe(
                    "DELETE FROM public.users WHERE id = $1::uuid",
                    userId
                );
            }, {
            timeout: 30000
        });

        return NextResponse.json({
            success: true,
            message: "User profile and related data deleted successfully.",
        });
    } catch (error: any) {
        console.error("❌ Delete user profile error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to delete user and related data.",
            },
            { status: 500 }
        );
    }
}

