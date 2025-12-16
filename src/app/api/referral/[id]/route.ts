import { NextRequest, NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

// GET - Fetch a specific referral code by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const region = searchParams.get("region") || "india";

        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let referralCode;
        if (region.toLowerCase() === "usa") {
            referralCode = await prismaUSA.referral_codes.findUnique({
                where: { id },
            });
        } else {
            referralCode = await prismaIndia.referral_codes.findUnique({
                where: { id },
            });
        }

        if (!referralCode) {
            return NextResponse.json(
                { success: false, error: "Referral code not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: referralCode,
        });
    } catch (error) {
        console.error(" Error fetching referral code:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// PUT - Update a referral code
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            referral_code,
            free_trial_days,
            SmartVitals,
            Medication,
            Vaccines,
            HealthSnapShot,
            Records,
            Prenatal,
            HealthHub,
            Members,
            ABHA,
            COUNT,
            MAX,
            region = "india",
        } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let existingReferral;
        if (region.toLowerCase() === "usa") {
            existingReferral = await prismaUSA.referral_codes.findUnique({
                where: { id },
            });
        } else {
            existingReferral = await prismaIndia.referral_codes.findUnique({
                where: { id },
            });
        }

        if (!existingReferral) {
            return NextResponse.json(
                { success: false, error: "Referral code not found" },
                { status: 404 }
            );
        }

        // If referral_code is being updated, check for duplicates
        if (referral_code !== undefined) {
            if (typeof referral_code !== "string" || !referral_code.trim()) {
                return NextResponse.json(
                    { success: false, error: "referral_code must be a non-empty string" },
                    { status: 400 }
                );
            }

            let duplicateCheck;
            if (region.toLowerCase() === "usa") {
                duplicateCheck = await prismaUSA.referral_codes.findFirst({
                    where: {
                        referral_code: referral_code.trim(),
                        id: { not: id },
                    },
                });
            } else {
                duplicateCheck = await prismaIndia.referral_codes.findFirst({
                    where: {
                        referral_code: referral_code.trim(),
                        id: { not: id },
                    },
                });
            }

            if (duplicateCheck) {
                return NextResponse.json(
                    { success: false, error: "Referral code already exists" },
                    { status: 400 }
                );
            }
        }

        // Validate free_trial_days if provided
        if (free_trial_days !== undefined && free_trial_days !== null) {
            const freeTrialDays = parseInt(free_trial_days, 10);
            if (isNaN(freeTrialDays) || freeTrialDays < 0 || !Number.isInteger(freeTrialDays)) {
                return NextResponse.json(
                    { success: false, error: "free_trial_days must be a non-negative integer" },
                    { status: 400 }
                );
            }
        }

        // Validate COUNT if provided
        if (COUNT !== undefined && COUNT !== null) {
            const count = parseInt(COUNT, 10);
            if (isNaN(count) || count < 0 || !Number.isInteger(count)) {
                return NextResponse.json(
                    { success: false, error: "COUNT must be a non-negative integer" },
                    { status: 400 }
                );
            }
        }

        // Validate MAX if provided
        if (MAX !== undefined && MAX !== null) {
            const max = parseInt(MAX, 10);
            if (isNaN(max) || max < 0 || !Number.isInteger(max)) {
                return NextResponse.json(
                    { success: false, error: "MAX must be a non-negative integer" },
                    { status: 400 }
                );
            }
        }

        // Build update data object
        const updateData: any = {};

        if (referral_code !== undefined) updateData.referral_code = referral_code.trim();
        if (free_trial_days !== undefined) updateData.free_trial_days = parseInt(free_trial_days, 10) || 0;
        if (SmartVitals !== undefined) updateData.SmartVitals = SmartVitals;
        if (Medication !== undefined) updateData.Medication = Medication;
        if (Vaccines !== undefined) updateData.Vaccines = Vaccines;
        if (HealthSnapShot !== undefined) updateData.HealthSnapShot = HealthSnapShot;
        if (Records !== undefined) updateData.Records = Records;
        if (Prenatal !== undefined) updateData.Prenatal = Prenatal;
        if (HealthHub !== undefined) updateData.HealthHub = HealthHub;
        if (Members !== undefined) updateData.Members = Members;
        if (ABHA !== undefined) updateData.ABHA = ABHA;
        if (COUNT !== undefined) updateData.COUNT = parseInt(COUNT, 10) || 0;
        if (MAX !== undefined) updateData.MAX = parseInt(MAX, 10) || 0;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: "No fields to update" },
                { status: 400 }
            );
        }

        // Always update updated_at
        updateData.updated_at = new Date();

        // Update the referral code
        let updatedReferralCode;
        if (region.toLowerCase() === "usa") {
            updatedReferralCode = await prismaUSA.referral_codes.update({
                where: { id },
                data: updateData,
            });
        } else {
            updatedReferralCode = await prismaIndia.referral_codes.update({
                where: { id },
                data: updateData,
            });
        }

        console.log(` Referral code updated successfully: ${id}`);

        return NextResponse.json({
            success: true,
            message: "Referral code updated successfully",
            data: updatedReferralCode,
        });
    } catch (error: any) {
        console.error(" Error updating referral code:", error);

        // Handle unique constraint violation
        if (error.code === "P2002") {
            return NextResponse.json(
                { success: false, error: "Referral code already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a referral code
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const region = searchParams.get("region") || "india";

        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let existingReferral;
        if (region.toLowerCase() === "usa") {
            existingReferral = await prismaUSA.referral_codes.findUnique({
                where: { id },
            });
        } else {
            existingReferral = await prismaIndia.referral_codes.findUnique({
                where: { id },
            });
        }

        if (!existingReferral) {
            return NextResponse.json(
                { success: false, error: "Referral code not found" },
                { status: 404 }
            );
        }

        // Delete the referral code
        if (region.toLowerCase() === "usa") {
            await prismaUSA.referral_codes.delete({
                where: { id },
            });
        } else {
            await prismaIndia.referral_codes.delete({
                where: { id },
            });
        }

        console.log(` Referral code deleted successfully: ${id}`);

        return NextResponse.json({
            success: true,
            message: "Referral code deleted successfully",
        });
    } catch (error) {
        console.error(" Error deleting referral code:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
