import { NextResponse } from "next/server";
import { prismaUSA } from "@/lib/prisma"; // ✅ make sure prismaUSA is exported in /lib/prisma.ts

type Transaction = {
  plan_id: string | null;
  final_amount: any;
  datetime: Date;
};

type GroupedUser = {
  name: string;
  email: string;
  transactions: Transaction[];
};

export async function GET() {
  try {
    // Step 1: Fetch successful payments from USA DB
    const payments = await prismaUSA.payment_records.findMany({
      where: { payment_status: "Success" },
      select: {
        clientid: true,
        plan_id: true,
        final_amount: true,
        datetime: true,
      },
    });

    // Step 2: Extract all user IDs (clientid)
    const clientIds = payments.map((p) => p.clientid).filter(Boolean) as string[];

    // Step 3: Fetch all users matching those IDs
    const users = await prismaUSA.users.findMany({
      where: { id: { in: clientIds } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });

    // Step 4: Build a user lookup map
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Step 5: Group payments by user (typed)
    const grouped: Record<string, GroupedUser> = {};

    for (const p of payments) {
      const user = userMap.get(p.clientid!);
      if (!user) continue;

      const key = user.email;

      if (!grouped[key]) {
        grouped[key] = {
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
          email: user.email,
          transactions: [],
        };
      }

      grouped[key].transactions.push({
        plan_id: p.plan_id,
        final_amount: p.final_amount,
        datetime: p.datetime,
      });
    }

    // Step 6: Convert grouped data to array for output
    const response = Object.values(grouped);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching USA payment data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
