import { NextRequest, NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

// POST - Get plans for users based on referral code
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { mdr_id, region = "india" } = body;

        if (!mdr_id) {
            return NextResponse.json(
                { success: false, error: "mdr_id is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let plans;

        if (region.toLowerCase() === "usa") {
            // Get all visible plans for the user
            plans = await prismaUSA.plans.findMany({
                where: {
                    visibility: true,
                },
                orderBy: {
                    plan_id: "asc",
                },
            });
        } else {
            // Get all visible plans for the user
            plans = await prismaIndia.plans.findMany({
                where: {
                    visibility: true,
                },
                orderBy: {
                    plan_id: "asc",
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: plans,
        });
    } catch (error) {
        console.error("❌ Error fetching plans for users:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
