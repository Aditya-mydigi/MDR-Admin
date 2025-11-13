import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("📊 Calculating total revenue for India and USA...");

    // Run both queries in parallel
    const [indiaRevenueResult, usaRevenueResult] = await Promise.all([
      prismaIndia.payment_records.aggregate({
        _sum: {
          final_amount: true,
        },
        where: {
          payment_status: "SUCCESS", // ✅ optional filter if you track status
        },
      }),
      prismaUSA.payment_records.aggregate({
        _sum: {
          final_amount: true,
        },
        where: {
          payment_status: "SUCCESS", // ✅ same filter
        },
      }),
    ]);

    // Extract sums safely
    const indiaRevenue = Number(indiaRevenueResult._sum.final_amount || 0);
    const usaRevenue = Number(usaRevenueResult._sum.final_amount || 0);
    const totalRevenue = indiaRevenue + usaRevenue;

    console.log(`✅ India: ₹${indiaRevenue}, USA: $${usaRevenue}`);

    return NextResponse.json({
      success: true,
      indiaRevenue,
      usaRevenue,
      totalRevenue,
    });
  } catch (error) {
    console.error("❌ Error calculating revenue:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate revenue" },
      { status: 500 }
    );
  }
}
