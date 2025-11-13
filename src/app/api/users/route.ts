import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || "";
    const bloodGroupsParam = searchParams.get("blood_groups");
    const bloodGroups =
      bloodGroupsParam && bloodGroupsParam.length > 0
        ? bloodGroupsParam.split(",").map((bg) => bg.trim())
        : [];

    console.log(
      `📄 Fetching users (page=${page}, limit=${limit}, search="${search}", blood_groups=${bloodGroups.join(
        ","
      )})`
    );

    // ✅ Dynamic filters for both DBs
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone_num: { contains: search, mode: "insensitive" } },
        { blood_group: { contains: search, mode: "insensitive" } },
      ];
    }

    if (bloodGroups.length > 0) {
      whereClause.blood_group = { in: bloodGroups };
    }

    const [indiaUsers, usaUsers, indiaCount, usaCount] = await Promise.all([
      prismaIndia.users
        .findMany({
          skip,
          take: limit,
          where: whereClause,
          select: {
            id: true,
            mdr_id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_num: true, // ✅ include mobile number
            gender: true,
            dob: true,
            created_at: true,
            user_plan_active: true,
            blood_group: true,
            address: true,
            plan_id: true,
            payment_date: true,
            expiry_date: true,
            country: true,
          },
          orderBy: { created_at: "desc" },
        })
        .catch((err) => {
          console.error("India users fetch failed:", err);
          return [];
        }),

      prismaUSA.users
        .findMany({
          skip,
          take: limit,
          where: whereClause,
          select: {
            id: true,
            mdr_id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_num: true, // ✅ include mobile number
            gender: true,
            dob: true,
            created_at: true,
            user_plan_active: true,
            blood_group: true,
            address: true,
            plan_id: true,
            payment_date: true,
            expiry_date: true,
            country: true,
          },
          orderBy: { created_at: "desc" },
        })
        .catch((err) => {
          console.error("USA users fetch failed:", err);
          return [];
        }),

      prismaIndia.users.count({ where: whereClause }).catch(() => 0),
      prismaUSA.users.count({ where: whereClause }).catch(() => 0),
    ]);

    const allUsers = [
      ...indiaUsers.map((u) => ({ ...u, region: "India" })),
      ...usaUsers.map((u) => ({ ...u, region: "USA" })),
    ];

    const total = indiaCount + usaCount;
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ Page ${page} fetched (${allUsers.length} users)`);

    return NextResponse.json({
      success: true,
      total,
      totalPages,
      currentPage: page,
      users: allUsers,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
