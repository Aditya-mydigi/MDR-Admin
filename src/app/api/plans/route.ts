import { NextRequest, NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

// GET - Fetch all plans with pagination
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const region = searchParams.get("region") || "india";
        const visibility = searchParams.get("visibility");
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause: any = {};
        if (visibility !== undefined && visibility !== null) {
            whereClause.visibility = visibility === "true" || visibility === "1";
        }

        // Handle each Prisma client separately to avoid union type issues
        let total;
        let plans;

        if (region.toLowerCase() === "usa") {
            total = await prismaUSA.plans.count({ where: whereClause });
            plans = await prismaUSA.plans.findMany({
                where: whereClause,
                skip: offset,
                take: limit,
                orderBy: {
                    plan_id: "asc",
                },
            });
        } else {
            total = await prismaIndia.plans.count({ where: whereClause });
            plans = await prismaIndia.plans.findMany({
                where: whereClause,
                skip: offset,
                take: limit,
                orderBy: {
                    plan_id: "asc",
                },
            });
        }

        return NextResponse.json({
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: plans,
        });
    } catch (error) {
        console.error("❌ Error fetching plans:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST - Create a new plan
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            plan_id,
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

        // Validation
        if (!plan_id || amount === undefined || validity_in_days === undefined) {
            return NextResponse.json(
                { success: false, error: "plan_id, amount, and validity_in_days are required" },
                { status: 400 }
            );
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum < 0) {
            return NextResponse.json(
                { success: false, error: "amount must be a non-negative number" },
                { status: 400 }
            );
        }

        // Validate validity_in_days
        const validityInDaysNum = parseInt(validity_in_days, 10);
        if (isNaN(validityInDaysNum) || validityInDaysNum < 0) {
            return NextResponse.json(
                { success: false, error: "validity_in_days must be a non-negative integer" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let existingPlan;
        let newPlan;

        if (region.toLowerCase() === "usa") {
            // Check if plan_id already exists
            existingPlan = await prismaUSA.plans.findUnique({
                where: { plan_id },
            });

            if (existingPlan) {
                return NextResponse.json(
                    { success: false, error: "Plan ID already exists" },
                    { status: 400 }
                );
            }

            // Create new plan
            newPlan = await prismaUSA.plans.create({
                data: {
                    plan_id,
                    amount: amountNum,
                    validity: validity || null,
                    validity_in_days: validityInDaysNum,
                    visibility: visibility !== undefined ? visibility : true,
                    description_line1: description_line1 || null,
                    description_line2: description_line2 || null,
                    SmartVitals: SmartVitals !== undefined ? SmartVitals : true,
                    Medication: Medication !== undefined ? Medication : true,
                    Vaccines: Vaccines !== undefined ? Vaccines : true,
                    HealthSnapShot: HealthSnapShot !== undefined ? HealthSnapShot : true,
                    Records: Records !== undefined ? Records : true,
                    Prenatal: Prenatal !== undefined ? Prenatal : true,
                    HealthHub: HealthHub !== undefined ? HealthHub : true,
                    Members: Members !== undefined ? Members : true,
                    ABHA: ABHA !== undefined ? ABHA : true,
                },
            });
        } else {
            // Check if plan_id already exists
            existingPlan = await prismaIndia.plans.findUnique({
                where: { plan_id },
            });

            if (existingPlan) {
                return NextResponse.json(
                    { success: false, error: "Plan ID already exists" },
                    { status: 400 }
                );
            }

            // Create new plan
            newPlan = await prismaIndia.plans.create({
                data: {
                    plan_id,
                    amount: amountNum,
                    validity: validity || null,
                    validity_in_days: validityInDaysNum,
                    visibility: visibility !== undefined ? visibility : true,
                    description_line1: description_line1 || null,
                    description_line2: description_line2 || null,
                    SmartVitals: SmartVitals !== undefined ? SmartVitals : true,
                    Medication: Medication !== undefined ? Medication : true,
                    Vaccines: Vaccines !== undefined ? Vaccines : true,
                    HealthSnapShot: HealthSnapShot !== undefined ? HealthSnapShot : true,
                    Records: Records !== undefined ? Records : true,
                    Prenatal: Prenatal !== undefined ? Prenatal : true,
                    HealthHub: HealthHub !== undefined ? HealthHub : true,
                    Members: Members !== undefined ? Members : true,
                    ABHA: ABHA !== undefined ? ABHA : true,
                },
            });
        }

        console.log(`✅ Plan created successfully: ${plan_id}`);

        return NextResponse.json(
            {
                success: true,
                message: "Plan created successfully",
                data: newPlan,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("❌ Error creating plan:", error);

        // Handle unique constraint violation
        if (error.code === "P2002") {
            return NextResponse.json(
                { success: false, error: "Plan ID already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
