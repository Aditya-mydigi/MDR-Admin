import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../prisma/generated/panel";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.mdrPanelUser.findUnique({
      where: { id: params.id },
      select: {
        id: true, 
        mdr_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone1: true,
        phone2: true,
        role: true,
        isactive: true,
        date_of_joining: true,
        updated_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
