import { NextResponse } from "next/server";
import { prismaUSA } from "@/lib/prisma";

export async function GET() {
  try {
    // 1️⃣ Fetch users who have order_id
    const usersWithOrder = await prismaUSA.users.findMany({
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
    const successfulPayments = await prismaUSA.payment_records.findMany({
      where: { payment_status: "Success" },
      select: {
        orderid: true,
        final_amount: true,
        datetime: true,
      },
    });

    // 3️⃣ Create lookup map
    const paymentMap = new Map(
      successfulPayments.map((p) => [
        p.orderid,
        { final_amount: p.final_amount, datetime: p.datetime },
      ])
    );

    // 4️⃣ Combine user and payment data
    const formatted = usersWithOrder
      .filter((u) => u.order_id && paymentMap.has(u.order_id))
      .map((u) => {
        const payment = paymentMap.get(u.order_id as string);
        return {
          username: [u.first_name ?? "", u.middle_name ?? "", u.last_name ?? ""]
            .filter(Boolean)
            .join(" ")
            .trim(),
          email: u.email,
          plan_id: u.plan_id ?? null,
          final_amount: payment?.final_amount ?? 0,
          datetime: payment?.datetime ?? null,
        };
      });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("Error fetching USA subscriptions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
