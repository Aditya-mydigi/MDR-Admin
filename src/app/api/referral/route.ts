import { NextRequest, NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

// GET - Fetch all referral codes with pagination
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const region = searchParams.get("region") || "india"; // Default to India
        const offset = (page - 1) * limit;

        // Handle each Prisma client separately to avoid union type issues
        let total;
        let referralCodes;

        if (region.toLowerCase() === "usa") {
            total = await prismaUSA.referral_codes.count();
            referralCodes = await prismaUSA.referral_codes.findMany({
                skip: offset,
                take: limit,
                orderBy: {
                    created_at: "desc",
                },
            });
        } else {
            total = await prismaIndia.referral_codes.count();
            referralCodes = await prismaIndia.referral_codes.findMany({
                skip: offset,
                take: limit,
                orderBy: {
                    created_at: "desc",
                },
            });
        }

        return NextResponse.json({
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: referralCodes,
        });
    } catch (error) {
        console.error(" Error fetching referral codes:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST - Create a new referral code
export async function POST(req: NextRequest) {
    try {
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

        // Validation
        if (!referral_code || typeof referral_code !== "string" || !referral_code.trim()) {
            return NextResponse.json(
                { success: false, error: "referral_code is required and must be a non-empty string" },
                { status: 400 }
            );
        }

        // Validate free_trial_days if provided
        let freeTrialDays = 0;
        if (free_trial_days !== undefined && free_trial_days !== null) {
            freeTrialDays = parseInt(free_trial_days, 10);
            if (isNaN(freeTrialDays) || freeTrialDays < 0 || !Number.isInteger(freeTrialDays)) {
                return NextResponse.json(
                    { success: false, error: "free_trial_days must be a non-negative integer" },
                    { status: 400 }
                );
            }
        }

        // Validate COUNT if provided
        let count = 0;
        if (COUNT !== undefined && COUNT !== null) {
            count = parseInt(COUNT, 10);
            if (isNaN(count) || count < 0 || !Number.isInteger(count)) {
                return NextResponse.json(
                    { success: false, error: "COUNT must be a non-negative integer" },
                    { status: 400 }
                );
            }
        }

        // Validate MAX if provided
        let max = 0;
        if (MAX !== undefined && MAX !== null) {
            max = parseInt(MAX, 10);
            if (isNaN(max) || max < 0 || !Number.isInteger(max)) {
                return NextResponse.json(
                    { success: false, error: "MAX must be a non-negative integer" },
                    { status: 400 }
                );
            }
        }

        // Handle each Prisma client separately to avoid union type issues
        let existingReferral;
        let newReferralCode;

        if (region.toLowerCase() === "usa") {
            // Check if referral_code already exists
            existingReferral = await prismaUSA.referral_codes.findFirst({
                where: { referral_code: referral_code.trim() },
            });

            if (existingReferral) {
                return NextResponse.json(
                    { success: false, error: "Referral code already exists" },
                    { status: 400 }
                );
            }

            // Create new referral code
            newReferralCode = await prismaUSA.referral_codes.create({
                data: {
                    referral_code: referral_code.trim(),
                    free_trial_days: freeTrialDays,
                    SmartVitals: SmartVitals !== undefined ? SmartVitals : false,
                    Medication: Medication !== undefined ? Medication : false,
                    Vaccines: Vaccines !== undefined ? Vaccines : false,
                    HealthSnapShot: HealthSnapShot !== undefined ? HealthSnapShot : false,
                    Records: Records !== undefined ? Records : false,
                    Prenatal: Prenatal !== undefined ? Prenatal : false,
                    HealthHub: HealthHub !== undefined ? HealthHub : false,
                    Members: Members !== undefined ? Members : false,
                    ABHA: ABHA !== undefined ? ABHA : false,
                    COUNT: count,
                    MAX: max,
                },
            });
        } else {
            // Check if referral_code already exists
            existingReferral = await prismaIndia.referral_codes.findFirst({
                where: { referral_code: referral_code.trim() },
            });

            if (existingReferral) {
                return NextResponse.json(
                    { success: false, error: "Referral code already exists" },
                    { status: 400 }
                );
            }

            // Create new referral code
            newReferralCode = await prismaIndia.referral_codes.create({
                data: {
                    referral_code: referral_code.trim(),
                    free_trial_days: freeTrialDays,
                    SmartVitals: SmartVitals !== undefined ? SmartVitals : false,
                    Medication: Medication !== undefined ? Medication : false,
                    Vaccines: Vaccines !== undefined ? Vaccines : false,
                    HealthSnapShot: HealthSnapShot !== undefined ? HealthSnapShot : false,
                    Records: Records !== undefined ? Records : false,
                    Prenatal: Prenatal !== undefined ? Prenatal : false,
                    HealthHub: HealthHub !== undefined ? HealthHub : false,
                    Members: Members !== undefined ? Members : false,
                    ABHA: ABHA !== undefined ? ABHA : false,
                    COUNT: count,
                    MAX: max,
                },
            });
        }

        console.log(` Referral code created successfully: ${referral_code.trim()}`);

        return NextResponse.json(
            {
                success: true,
                message: "Referral code created successfully",
                data: newReferralCode,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error(" Error creating referral code:", error);

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
