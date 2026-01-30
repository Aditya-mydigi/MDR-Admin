import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const region = searchParams.get("region")?.toLowerCase();
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "100");
        const skip = (page - 1) * limit;

        // If region is specified, we return a flat list for that region (for PlansTab)
        if (region === "india" || region === "usa") {
            const prisma = region === "india" ? prismaIndia : prismaUSA;

            const [plans, total] = await Promise.all([
                (prisma as any).plans.findMany({
                    skip,
                    take: limit,
                    orderBy: { amount: "asc" },
                }),
                (prisma as any).plans.count(),
            ]);

            return NextResponse.json({
                success: true,
                data: plans,
                total,
                totalPages: Math.ceil(total / limit),
            });
        }

        // Otherwise return both (for User Management Dialog)
        const [indiaPlans, usaPlans] = await Promise.all([
            prismaIndia.plans.findMany({ where: { visibility: true } }),
            prismaUSA.plans.findMany({ where: { visibility: true } }),
        ]);

        return NextResponse.json({
            success: true,
            plans: {
                india: indiaPlans,
                usa: usaPlans,
            },
        });
    } catch (error) {
        console.error("❌ Error fetching plans:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch plans" },
            { status: 500 }
        );
    }
}
