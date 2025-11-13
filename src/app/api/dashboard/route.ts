import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma"; // ✅ both clients

export async function GET() {
  try {
    // 🗓️ Current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // ✅ Run queries for both DBs in parallel
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

    // 🧮 Combine results from both DBs
    const totalUsers = indiaUsers + usaUsers;
    const activeUsers = indiaActive + usaActive;
    const newSignupsThisMonth = indiaNewSignups + usaNewSignups;

    const totalRevenue =
      Number(indiaRevenue._sum.final_amount || 0) +
      Number(usaRevenue._sum.final_amount || 0);

    const monthlyRevenue =
      Number(indiaRevenueMonth._sum.final_amount || 0) +
      Number(usaRevenueMonth._sum.final_amount || 0);

    // 📊 Structure response
    const stats = {
      totalUsers,
      activeUsers,
      newSignupsThisMonth,
      revenue: {
        total: totalRevenue,
        thisMonth: monthlyRevenue,
      },
      breakdown: {
        india: {
          users: indiaUsers,
          active: indiaActive,
          newSignups: indiaNewSignups,
          totalRevenue: indiaRevenue._sum.final_amount || 0,
          monthlyRevenue: indiaRevenueMonth._sum.final_amount || 0,
        },
        usa: {
          users: usaUsers,
          active: usaActive,
          newSignups: usaNewSignups,
          totalRevenue: usaRevenue._sum.final_amount || 0,
          monthlyRevenue: usaRevenueMonth._sum.final_amount || 0,
        },
      },
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("❌ Dashboard fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
