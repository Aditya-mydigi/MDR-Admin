import { NextRequest, NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

// GET - Fetch all coupons with pagination
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const region = searchParams.get("region") || "india";
        const is_active = searchParams.get("is_active");
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause: any = {};
        if (is_active !== undefined && is_active !== null) {
            whereClause.is_active = is_active === "true" || is_active === "1";
        }

        // Handle each Prisma client separately to avoid union type issues
        let total;
        let coupons;

        if (region.toLowerCase() === "usa") {
            total = await prismaUSA.coupons.count({ where: whereClause });
            coupons = await prismaUSA.coupons.findMany({
                where: whereClause,
                skip: offset,
                take: limit,
                orderBy: {
                    created_at: "desc",
                },
            });
        } else {
            total = await prismaIndia.coupons.count({ where: whereClause });
            coupons = await prismaIndia.coupons.findMany({
                where: whereClause,
                skip: offset,
                take: limit,
                orderBy: {
                    created_at: "desc",
                },
            });
        }

        return NextResponse.json({
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: coupons,
        });
    } catch (error) {
        console.error(" Error fetching coupons:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST - Create a new coupon
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            coupon_code,
            type,
            amount,
            start_date,
            end_date,
            usage_limit,
            referral_code,
            is_active,
            visible,
            region = "india",
        } = body;

        // Validation
        if (!coupon_code || !type || amount === undefined) {
            return NextResponse.json(
                { success: false, error: "coupon_code, type, and amount are required" },
                { status: 400 }
            );
        }

        // Validate type - database constraint expects 'percentage' or 'flat'
        // Map user-friendly values: 'percentage' -> 'percentage', 'fixed' -> 'flat'
        const normalizedType = type.toLowerCase();
        let typeForDb: string;

        if (normalizedType === "percentage" || normalizedType === "new") {
            typeForDb = "percentage";
        } else if (normalizedType === "fixed" || normalizedType === "regular" || normalizedType === "flat") {
            typeForDb = "flat";
        } else {
            return NextResponse.json(
                { success: false, error: 'type must be either "percentage" or "fixed" (flat)' },
                { status: 400 }
            );
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum < 0) {
            return NextResponse.json(
                { success: false, error: "amount must be a non-negative number" },
                { status: 400 }
            );
        }

        // Validate percentage amount
        if (typeForDb === "percentage" && (amountNum < 0 || amountNum > 100)) {
            return NextResponse.json(
                { success: false, error: "percentage amount must be between 0 and 100" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let existingCoupon;
        let referralCheck;
        let newCoupon;

        if (region.toLowerCase() === "usa") {
            // Check if coupon_code already exists
            existingCoupon = await prismaUSA.coupons.findUnique({
                where: { coupon_code },
            });

            if (existingCoupon) {
                return NextResponse.json(
                    { success: false, error: "Coupon code already exists" },
                    { status: 400 }
                );
            }

            // If referral_code is provided, validate it exists in referral_codes table
            if (referral_code) {
                referralCheck = await prismaUSA.referral_codes.findUnique({
                    where: { referral_code },
                });

                if (!referralCheck) {
                    return NextResponse.json(
                        { success: false, error: "Invalid referral_code. Referral code does not exist in referral_codes table" },
                        { status: 400 }
                    );
                }
            }

            // Create new coupon
            newCoupon = await prismaUSA.coupons.create({
                data: {
                    coupon_code,
                    type: typeForDb,
                    amount: amountNum,
                    start_date: start_date ? new Date(start_date) : null,
                    end_date: end_date ? new Date(end_date) : null,
                    usage_limit: usage_limit !== undefined ? usage_limit : null,
                    is_active: is_active !== undefined ? is_active : true,
                    referral_code: referral_code || null,
                    visible: visible !== undefined ? visible : false,
                },
            });
        } else {
            // Check if coupon_code already exists
            existingCoupon = await prismaIndia.coupons.findUnique({
                where: { coupon_code },
            });

            if (existingCoupon) {
                return NextResponse.json(
                    { success: false, error: "Coupon code already exists" },
                    { status: 400 }
                );
            }

            // If referral_code is provided, validate it exists in referral_codes table
            if (referral_code) {
                referralCheck = await prismaIndia.referral_codes.findUnique({
                    where: { referral_code },
                });

                if (!referralCheck) {
                    return NextResponse.json(
                        { success: false, error: "Invalid referral_code. Referral code does not exist in referral_codes table" },
                        { status: 400 }
                    );
                }
            }

            // Create new coupon
            newCoupon = await prismaIndia.coupons.create({
                data: {
                    coupon_code,
                    type: typeForDb,
                    amount: amountNum,
                    start_date: start_date ? new Date(start_date) : null,
                    end_date: end_date ? new Date(end_date) : null,
                    usage_limit: usage_limit !== undefined ? usage_limit : null,
                    is_active: is_active !== undefined ? is_active : true,
                    referral_code: referral_code || null,
                    visible: visible !== undefined ? visible : false,
                },
            });
        }

        console.log(` Coupon created successfully: ${coupon_code}`);

        return NextResponse.json(
            {
                success: true,
                message: "Coupon created successfully",
                data: newCoupon,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error(" Error creating coupon:", error);

        // Handle unique constraint violation
        if (error.code === "P2002") {
            return NextResponse.json(
                { success: false, error: "Coupon code already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
