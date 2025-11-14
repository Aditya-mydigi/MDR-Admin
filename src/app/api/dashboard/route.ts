import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

export async function GET() {
  try {
    // Dates of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Parallel DB calls
    const [
      indiaUsers,
      indiaActive,
      indiaNewSignups,
      indiaRevenue,
      indiaRevenueMonth,
      usaUsers,
      usaActive,
      usaNewSignups,
      usaRevenue,
      usaRevenueMonth,
    ] = await Promise.all([
      // 🇮🇳 India
      prismaIndia.users.count(),
      prismaIndia.users.count({
        where: {
          user_plan_active: true,
          expiry_date: { gte: new Date() },
        },
      }),
      prismaIndia.users.count({
        where: {
          created_at: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prismaIndia.payment_records.aggregate({
        _sum: { final_amount: true },
      }),
      prismaIndia.payment_records.aggregate({
        _sum: { final_amount: true },
        where: { datetime: { gte: startOfMonth, lte: endOfMonth } },
      }),

      // 🇺🇸 USA
      prismaUSA.users.count(),
      prismaUSA.users.count({
        where: {
          user_plan_active: true,
          expiry_date: { gte: new Date() },
        },
      }),
      prismaUSA.users.count({
        where: {
          created_at: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prismaUSA.payment_records.aggregate({
        _sum: { final_amount: true },
      }),
      prismaUSA.payment_records.aggregate({
        _sum: { final_amount: true },
        where: { datetime: { gte: startOfMonth, lte: endOfMonth } },
      }),
    ]);

    // Currency conversion rate
    const USD_TO_INR = 88;

    // India revenue (INR)
    const indiaTotalRev = Number(indiaRevenue._sum.final_amount || 0);
    const indiaMonthlyRev = Number(indiaRevenueMonth._sum.final_amount || 0);

    // USA revenue (USD)
    const usaTotalRevUSD = Number(usaRevenue._sum.final_amount || 0);
    const usaMonthlyRevUSD = Number(usaRevenueMonth._sum.final_amount || 0);

    // Convert only total to INR
    const totalRevenueINR = indiaTotalRev + usaTotalRevUSD * USD_TO_INR;
    const monthlyRevenueINR = indiaMonthlyRev + usaMonthlyRevUSD * USD_TO_INR;

    const stats = {
      totalUsers: indiaUsers + usaUsers,
      activeUsers: indiaActive + usaActive,
      newSignupsThisMonth: indiaNewSignups + usaNewSignups,

      // ALWAYS INR
      revenue: {
        total: totalRevenueINR,
        thisMonth: monthlyRevenueINR,
      },

      breakdown: {
        india: {
          users: indiaUsers,
          active: indiaActive,
          newSignups: indiaNewSignups,
          totalRevenue: indiaTotalRev, // INR
          monthlyRevenue: indiaMonthlyRev, // INR
        },
        usa: {
          users: usaUsers,
          active: usaActive,
          newSignups: usaNewSignups,
          totalRevenue: usaTotalRevUSD, // USD
          monthlyRevenue: usaMonthlyRevUSD, // USD
        },
      },
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load data" },
      { status: 500 }
    );
  }
}
