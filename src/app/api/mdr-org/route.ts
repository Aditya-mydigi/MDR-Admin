// src/app/api/mdr-org/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../prisma/generated/panel";

// GET /api/mdr-org
const prisma = new PrismaClient();
export async function GET(req: Request) {

  // Check if id query param is present for fetching single user //
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const user = await prisma.mdrPanelUser.findUnique({
      where: { id },
      select: {
        mdr_id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        phone1: true,
        phone2: true,
        isactive: true,
        date_of_joining: true,
        updated_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  }
  ///////////////////////////////////////////////////////////////////

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "10")));
    const search = (searchParams.get("search") ?? "").trim();
    const status = (searchParams.get("status") ?? "active").toLowerCase();
    const role = (searchParams.get("role") ?? "all").toLowerCase();
    const sort = (searchParams.get("sort") ?? "asc").toLowerCase(); // asc | desc
    const skip = (page - 1) * limit;


    // default behavior: show only active users
    const where: any = {};

    // filter by status
    if (status === "active") {
      where.isactive = true;
    } else if (status === "inactive") {
      where.isactive = false;
    }

    // filter by role if specified
    if (role === "admin" || role === "employee") {
      where.role = role;
    }

    // search by first_name or last_name
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
      ];
    }



    // QUERY DB WITH PAGINATION & FILTERS //
    const [users, total] = await Promise.all([
      prisma.mdrPanelUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          first_name: sort === "desc" ? "desc" : "asc",
        },

        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone1: true,
          role: true,
          isactive: true,
        },
      }),
      prisma.mdrPanelUser.count({ where }),
    ]);

    // Return paginated response
    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/mdr-org error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}


// POST /api/mdr-org //
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const normalizedRole =
      typeof body.role === "string"
        ? body.role.toLowerCase()
        : body.role;

    // Helper to treat empty strings as null (essential for unique but optional fields)
    const nullIfEmpty = (val: any) => (typeof val === 'string' && val.trim() === '' ? null : val);

    // create new user
    const user = await prisma.mdrPanelUser.create({
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        role: normalizedRole,
        phone1: body.phone1,
        phone2: body.phone2,
        mdr_id: nullIfEmpty(body.mdr_id),
      },
    });

    // return created user
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {        // error handling
    console.error("CREATE USER ERROR FULL:", error);

    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      const field = target.includes('mdr_id') ? 'MDR ID' : target.includes('email') ? 'Email' : 'Field';
      return NextResponse.json(
        { error: `${field} already exists. Please use a unique value.` },
        { status: 409 }
      );
    }

    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json(
      {
        error: "Failed to create user",
        details: message,
      },
      { status: 500 }
    );
  }
}

// PUT /api/mdr-org //
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
      );
    }
    // normalize role to lowercase
    const normalizedRole =
      typeof body.role === "string"
        ? body.role.toLowerCase()
        : body.role;
    // Helper to treat empty strings as null
    const nullIfEmpty = (val: any) => (typeof val === 'string' && val.trim() === '' ? null : val);

    // update user
    const user = await prisma.mdrPanelUser.update({
      where: { id: body.id },
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        role: normalizedRole,
        phone1: body.phone1,
        phone2: body.phone2,
        mdr_id: nullIfEmpty(body.mdr_id),
        isactive: Boolean(body.isactive),
      },
    });

    // return updated user
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("UPDATE USER ERROR FULL:", error);

    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      const field = target.includes('mdr_id') ? 'MDR ID' : target.includes('email') ? 'Email' : 'Field';
      return NextResponse.json(
        { error: `${field} already exists. Please use a unique value.` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}


// PATCH /api/mdr-org (change status) //
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isactive } = body;

    if (!id || typeof isactive !== "boolean") {
      return NextResponse.json(
        { error: "id and isactive are required" },
        { status: 400 }
      );
    }

    const user = await prisma.mdrPanelUser.update({
      where: { id },
      data: { isactive },
      select: {
        id: true,
        isactive: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("PATCH USER STATUS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}



// DELETE /api/mdr-org //
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing user id" },
        { status: 400 }
      );
    }

    await prisma.mdrPanelUser.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
