import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

export async function GET() {
  try {
    // Current month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    console.log("Current Month Range:", {
      start: currentMonthStart.toISOString(),
      end: currentMonthEnd.toISOString(),
    });

    // Previous month dates
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    console.log("Previous Month Range:", {
      start: previousMonthStart.toISOString(),
      end: previousMonthEnd.toISOString(),
    });

    // Parallel DB calls
    const [
      // Current Month - India
      indiaUsersCurrent,
      indiaActiveCurrent,
      indiaNewSignupsCurrent,
      indiaRevenueCurrent,
      indiaRevenueMonthCurrent,
      // Previous Month - India
      indiaUsersPrev,
      indiaActivePrev,
      indiaNewSignupsPrev,
      indiaRevenuePrev,
      indiaRevenueMonthPrev,
      // Current Month - USA
      usaUsersCurrent,
      usaActiveCurrent,
      usaNewSignupsCurrent,
      usaRevenueCurrent,
      usaRevenueMonthCurrent,
      // Previous Month - USA
      usaUsersPrev,
      usaActivePrev,
      usaNewSignupsPrev,
      usaRevenuePrev,
      usaRevenueMonthPrev,
    ] = await Promise.all([
      // 🇮🇳 India - Current Month
      prismaIndia.users.count(),
      prismaIndia.users.count({
        where: {
          user_plan_active: true,
          expiry_date: { gte: new Date() },
        },
      }),
      prismaIndia.users.count({
        where: {
          created_at: { gte: currentMonthStart, lte: currentMonthEnd },
        },
      }),
      prismaIndia.payment_records.aggregate({
        _sum: { final_amount: true },
      }),
      prismaIndia.payment_records.aggregate({
        _sum: { final_amount: true },
        where: { datetime: { gte: currentMonthStart, lte: currentMonthEnd } },
      }),
      // 🇮🇳 India - Previous Month
      prismaIndia.users.count({
        where: {
          created_at: { gte: previousMonthStart, lte: previousMonthEnd },
        },
      }),
      prismaIndia.users.count({
        where: {
          user_plan_active: true,
          expiry_date: { gte: previousMonthStart, lte: previousMonthEnd },
        },
      }),
      prismaIndia.users.count({
        where: {
          created_at: { gte: previousMonthStart, lte: previousMonthEnd },
        },
      }),
      prismaIndia.payment_records.aggregate({
        _sum: { final_amount: true },
        where: { datetime: { gte: previousMonthStart, lte: previousMonthEnd } },
      }),
      prismaIndia.payment_records.aggregate({
        _sum: { final_amount: true },
        where: { datetime: { gte: previousMonthStart, lte: previousMonthEnd } },
      }),
      // 🇺🇸 USA - Current Month
      prismaUSA.users.count(),
      prismaUSA.users.count({
        where: {
          user_plan_active: true,
          expiry_date: { gte: new Date() },
        },
      }),
      prismaUSA.users.count({
        where: {
          created_at: { gte: currentMonthStart, lte: currentMonthEnd },
        },
      }),
      prismaUSA.payment_records.aggregate({
        _sum: { final_amount: true },
      }),
      prismaUSA.payment_records.aggregate({
        _sum: { final_amount: true },
        where: { datetime: { gte: currentMonthStart, lte: currentMonthEnd } },
      }),
      // 🇺🇸 USA - Previous Month
      prismaUSA.users.count({
        where: {
          created_at: { gte: previousMonthStart, lte: previousMonthEnd },
        },
      }),
      prismaUSA.users.count({
        where: {
          user_plan_active: true,
          expiry_date: { gte: previousMonthStart, lte: previousMonthEnd },
        },
      }),
      prismaUSA.users.count({
        where: {
          created_at: { gte: previousMonthStart, lte: previousMonthEnd },
        },
      }),
      prismaUSA.payment_records.aggregate({
        _sum: { final_amount: true },
        where: { datetime: { gte: previousMonthStart, lte: previousMonthEnd } },
      }),
      prismaUSA.payment_records.aggregate({
        _sum: { final_amount: true },
        where: { datetime: { gte: previousMonthStart, lte: previousMonthEnd } },
      }),
    ]);

    

    // Currency conversion rate
    const USD_TO_INR = 88;

    // India revenue (INR)
    const indiaTotalRevCurrent = Number(indiaRevenueCurrent._sum.final_amount || 0);
    const indiaMonthlyRevCurrent = Number(indiaRevenueMonthCurrent._sum.final_amount || 0);
    const indiaTotalRevPrev = Number(indiaRevenuePrev._sum.final_amount || 0);
    const indiaMonthlyRevPrev = Number(indiaRevenueMonthPrev._sum.final_amount || 0);

    // USA revenue (USD)
    const usaTotalRevUSDCurrent = Number(usaRevenueCurrent._sum.final_amount || 0);
    const usaMonthlyRevUSDCurrent = Number(usaRevenueMonthCurrent._sum.final_amount || 0);
    const usaTotalRevUSDPrev = Number(usaRevenuePrev._sum.final_amount || 0);
    const usaMonthlyRevUSDPrev = Number(usaRevenueMonthPrev._sum.final_amount || 0);

    // Convert only total to INR
    const totalRevenueINRCurrent = indiaTotalRevCurrent + usaTotalRevUSDCurrent * USD_TO_INR;
    const totalRevenueINRPrev = indiaTotalRevPrev + usaTotalRevUSDPrev * USD_TO_INR;
    const monthlyRevenueINRCurrent = indiaMonthlyRevCurrent + usaMonthlyRevUSDCurrent * USD_TO_INR;
    const monthlyRevenueINRPrev = indiaMonthlyRevPrev + usaMonthlyRevUSDPrev * USD_TO_INR;

    // Calculate percentage changes
    const calculateChange = (current: number, prev: number): [string, string] => {
      if (prev === 0) return ["+0%", "positive"];
      const change = ((current - prev) / prev) * 100;
      const changeStr = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
      const changeType = change >= 0 ? "positive" : "negative";
      return [changeStr, changeType];
    };

    const [activeChange, activeChangeType] = calculateChange(indiaActiveCurrent + usaActiveCurrent, indiaActivePrev + usaActivePrev);
    const [newSignupsChange, newSignupsChangeType] = calculateChange(indiaNewSignupsCurrent + usaNewSignupsCurrent, indiaNewSignupsPrev + usaNewSignupsPrev);
    const [totalRecordsChange, totalRecordsChangeType] = calculateChange(indiaUsersCurrent + usaUsersCurrent, indiaUsersPrev + usaUsersPrev);
    const [revenueChange, revenueChangeType] = calculateChange(monthlyRevenueINRCurrent, monthlyRevenueINRPrev);

    console.log("Calculated Changes:", {
      activeUsers: { change: activeChange, changeType: activeChangeType },
      newSignups: { change: newSignupsChange, changeType: newSignupsChangeType },
      totalRecords: { change: totalRecordsChange, changeType: totalRecordsChangeType },
      revenue: { change: revenueChange, changeType: revenueChangeType },
    });

    const stats = {
      totalUsers: indiaUsersCurrent + usaUsersCurrent,
      activeUsers: indiaActiveCurrent + usaActiveCurrent,
      newSignupsThisMonth: indiaNewSignupsCurrent + usaNewSignupsCurrent,
      revenue: {
        total: totalRevenueINRCurrent,
        thisMonth: monthlyRevenueINRCurrent,
        prevMonth: monthlyRevenueINRPrev, // For change calculation
      },
      breakdown: {
        india: {
          users: indiaUsersCurrent,
          active: indiaActiveCurrent,
          newSignups: indiaNewSignupsCurrent,
          totalRevenue: indiaTotalRevCurrent, // INR
          monthlyRevenue: indiaMonthlyRevCurrent, // INR
        },
        usa: {
          users: usaUsersCurrent,
          active: usaActiveCurrent,
          newSignups: usaNewSignupsCurrent,
          totalRevenue: usaTotalRevUSDCurrent, // USD
          monthlyRevenue: usaMonthlyRevUSDCurrent, // USD
        },
      },
    };

    console.log("Previous Month Actual Data:", {
  india: {
    users: indiaUsersPrev,
    active: indiaActivePrev,
    newSignups: indiaNewSignupsPrev,
    totalRevenue: indiaTotalRevPrev,
    monthlyRevenue: indiaMonthlyRevPrev,
  },
  usa: {
    users: usaUsersPrev,
    active: usaActivePrev,
    newSignups: usaNewSignupsPrev,
    totalRevenue: usaTotalRevUSDPrev,
    monthlyRevenue: usaMonthlyRevUSDPrev,
  },
  combined: {
    totalUsers: indiaUsersPrev + usaUsersPrev,
    activeUsers: indiaActivePrev + usaActivePrev,
    newSignups: indiaNewSignupsPrev + usaNewSignupsPrev,
    totalRevenueINR: totalRevenueINRPrev,
    monthlyRevenueINR: monthlyRevenueINRPrev,
  }
});


    return NextResponse.json({
      success: true,
      stats,
      changes: {
        activeUsers: { change: activeChange, changeType: activeChangeType },
        newSignups: { change: newSignupsChange, changeType: newSignupsChangeType },
        totalRecords: { change: totalRecordsChange, changeType: totalRecordsChangeType },
        revenue: { change: revenueChange, changeType: revenueChangeType },
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load data" },
      { status: 500 }
    );
  }
}
