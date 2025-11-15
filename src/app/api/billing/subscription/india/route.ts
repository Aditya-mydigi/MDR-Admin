import { NextResponse } from "next/server";
import { prismaIndia } from "@/lib/prisma";

export async function GET() {
  try {
    // 1️⃣ Fetch users with order_id
    const usersWithOrders = await prismaIndia.users.findMany({
      where: {
        order_id: { not: null },
      },
      select: {
        first_name: true,
        middle_name: true,
        last_name: true,
        email: true,
        plan_id: true,
        order_id: true,
      },
    });

    // 2️⃣ Fetch successful payments
    const payments = await prismaIndia.payment_records.findMany({
      where: {
        payment_status: "Success",
      },
      select: {
        orderid: true,
        final_amount: true,
        datetime: true,
      },
    });

    // 3️⃣ Map payments by orderid
    const paymentMap = new Map(
      payments.map((p) => [
        p.orderid?.trim(),
        {
          final_amount: p.final_amount,
          datetime: p.datetime,
        },
      ])
    );

    // 4️⃣ Combine result via order_id
    const combined = usersWithOrders
      .filter((user) => {
        const orderId = user.order_id?.trim();
        return orderId && paymentMap.has(orderId);
      })
      .map((user) => {
        const payment = paymentMap.get(user.order_id!.trim());
        return {
          username: [user.first_name, user.middle_name, user.last_name]
            .filter(Boolean)
            .join(" "),
          email: user.email,
          plan_id: user.plan_id ?? null,
          final_amount: payment?.final_amount ?? 0,
          datetime: payment?.datetime ?? null,
        };
      });

    return NextResponse.json({ success: true, data: combined });
  } catch (error: any) {
    console.error("Error fetching India subscriptions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
