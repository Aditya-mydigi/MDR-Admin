import { NextRequest, NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

// GET - Fetch a specific plan by plan_id
export async function GET(
    req: NextRequest,
    { params }: { params: { plan_id: string } }
) {
    try {
        const { plan_id } = params;
        const { searchParams } = new URL(req.url);
        const region = searchParams.get("region") || "india";

        if (!plan_id) {
            return NextResponse.json(
                { success: false, error: "plan_id is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let plan;
        if (region.toLowerCase() === "usa") {
            plan = await prismaUSA.plans.findUnique({
                where: { plan_id },
            });
        } else {
            plan = await prismaIndia.plans.findUnique({
                where: { plan_id },
            });
        }

        if (!plan) {
            return NextResponse.json(
                { success: false, error: "Plan not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: plan,
        });
    } catch (error) {
        console.error("❌ Error fetching plan:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// PUT - Update a plan
export async function PUT(
    req: NextRequest,
    { params }: { params: { plan_id: string } }
) {
    try {
        const { plan_id } = params;
        const body = await req.json();
        const {
            amount,
            validity,
            validity_in_days,
            visibility,
            description_line1,
            description_line2,
            SmartVitals,
            Medication,
            Vaccines,
            HealthSnapShot,
            Records,
            Prenatal,
            HealthHub,
            Members,
            ABHA,
            region = "india",
        } = body;

        if (!plan_id) {
            return NextResponse.json(
                { success: false, error: "plan_id is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let existingPlan;
        if (region.toLowerCase() === "usa") {
            existingPlan = await prismaUSA.plans.findUnique({
                where: { plan_id },
            });
        } else {
            existingPlan = await prismaIndia.plans.findUnique({
                where: { plan_id },
            });
        }

        if (!existingPlan) {
            return NextResponse.json(
                { success: false, error: "Plan not found" },
                { status: 404 }
            );
        }

        // Validate amount if provided
        if (amount !== undefined) {
            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum < 0) {
                return NextResponse.json(
                    { success: false, error: "amount must be a non-negative number" },
                    { status: 400 }
                );
            }
        }

        // Validate validity_in_days if provided
        if (validity_in_days !== undefined) {
            const validityInDaysNum = parseInt(validity_in_days, 10);
            if (isNaN(validityInDaysNum) || validityInDaysNum < 0) {
                return NextResponse.json(
                    { success: false, error: "validity_in_days must be a non-negative integer" },
                    { status: 400 }
                );
            }
        }

        // Build update data object
        const updateData: any = {};

        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (validity !== undefined) updateData.validity = validity || null;
        if (validity_in_days !== undefined) updateData.validity_in_days = parseInt(validity_in_days, 10);
        if (visibility !== undefined) updateData.visibility = visibility;
        if (description_line1 !== undefined) updateData.description_line1 = description_line1 || null;
        if (description_line2 !== undefined) updateData.description_line2 = description_line2 || null;
        if (SmartVitals !== undefined) updateData.SmartVitals = SmartVitals;
        if (Medication !== undefined) updateData.Medication = Medication;
        if (Vaccines !== undefined) updateData.Vaccines = Vaccines;
        if (HealthSnapShot !== undefined) updateData.HealthSnapShot = HealthSnapShot;
        if (Records !== undefined) updateData.Records = Records;
        if (Prenatal !== undefined) updateData.Prenatal = Prenatal;
        if (HealthHub !== undefined) updateData.HealthHub = HealthHub;
        if (Members !== undefined) updateData.Members = Members;
        if (ABHA !== undefined) updateData.ABHA = ABHA;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: "No fields to update" },
                { status: 400 }
            );
        }

        // Update the plan
        let updatedPlan;
        if (region.toLowerCase() === "usa") {
            updatedPlan = await prismaUSA.plans.update({
                where: { plan_id },
                data: updateData,
            });
        } else {
            updatedPlan = await prismaIndia.plans.update({
                where: { plan_id },
                data: updateData,
            });
        }

        console.log(`✅ Plan updated successfully: ${plan_id}`);

        return NextResponse.json({
            success: true,
            message: "Plan updated successfully",
            data: updatedPlan,
        });
    } catch (error: any) {
        console.error("❌ Error updating plan:", error);

        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a plan
export async function DELETE(
    req: NextRequest,
    { params }: { params: { plan_id: string } }
) {
    try {
        const { plan_id } = params;
        const { searchParams } = new URL(req.url);
        const region = searchParams.get("region") || "india";

        if (!plan_id) {
            return NextResponse.json(
                { success: false, error: "plan_id is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let existingPlan;
        if (region.toLowerCase() === "usa") {
            existingPlan = await prismaUSA.plans.findUnique({
                where: { plan_id },
            });
        } else {
            existingPlan = await prismaIndia.plans.findUnique({
                where: { plan_id },
            });
        }

        if (!existingPlan) {
            return NextResponse.json(
                { success: false, error: "Plan not found" },
                { status: 404 }
            );
        }

        // Delete the plan
        if (region.toLowerCase() === "usa") {
            await prismaUSA.plans.delete({
                where: { plan_id },
            });
        } else {
            await prismaIndia.plans.delete({
                where: { plan_id },
            });
        }

        console.log(`✅ Plan deleted successfully: ${plan_id}`);

        return NextResponse.json({
            success: true,
            message: "Plan deleted successfully",
        });
    } catch (error) {
        console.error("❌ Error deleting plan:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
