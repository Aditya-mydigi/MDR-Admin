import { NextRequest, NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";

// GET - Fetch a specific coupon by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ← Changed here
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const region = searchParams.get("region") || "india";

        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let coupon;
        if (region.toLowerCase() === "usa") {
            coupon = await prismaUSA.coupons.findUnique({
                where: { id },
            });
        } else {
            coupon = await prismaIndia.coupons.findUnique({
                where: { id },
            });
        }

        if (!coupon) {
            return NextResponse.json(
                { success: false, error: "Coupon not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: coupon,
        });
    } catch (error) {
        console.error(" Error fetching coupon:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// PUT - Update a coupon
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ← Changed here
) {
    try {
        const { id } = await params;
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

        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let existingCoupon;
        if (region.toLowerCase() === "usa") {
            existingCoupon = await prismaUSA.coupons.findUnique({
                where: { id },
            });
        } else {
            existingCoupon = await prismaIndia.coupons.findUnique({
                where: { id },
            });
        }

        if (!existingCoupon) {
            return NextResponse.json(
                { success: false, error: "Coupon not found" },
                { status: 404 }
            );
        }

        // If coupon_code is being updated, check for duplicates
        if (coupon_code !== undefined) {
            let duplicateCheck;
            if (region.toLowerCase() === "usa") {
                duplicateCheck = await prismaUSA.coupons.findFirst({
                    where: {
                        coupon_code,
                        id: { not: id },
                    },
                });
            } else {
                duplicateCheck = await prismaIndia.coupons.findFirst({
                    where: {
                        coupon_code,
                        id: { not: id },
                    },
                });
            }

            if (duplicateCheck) {
                return NextResponse.json(
                    { success: false, error: "Coupon code already exists" },
                    { status: 400 }
                );
            }
        }

        // Validate type if provided
        let typeForDb: string | undefined;
        if (type !== undefined) {
            const normalizedType = type.toLowerCase();
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
        }

        // Validate amount if provided
        if (amount !== undefined) {
            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum < 0) {
                return NextResponse.json(
                    { success: false, error: "amount must be a non-negative number" },
                    { status: 400 }
                );
            }

            // Validate percentage amount
            const currentType = typeForDb || existingCoupon.type;
            if (currentType && currentType.toLowerCase() === "percentage" && (amountNum < 0 || amountNum > 100)) {
                return NextResponse.json(
                    { success: false, error: "percentage amount must be between 0 and 100" },
                    { status: 400 }
                );
            }
        }

        // If referral_code is provided, validate it exists in referral_codes table
        if (referral_code !== undefined && referral_code !== null) {
            let referralCheck;
            if (region.toLowerCase() === "usa") {
                referralCheck = await prismaUSA.referral_codes.findUnique({
                    where: { referral_code },
                });
            } else {
                referralCheck = await prismaIndia.referral_codes.findUnique({
                    where: { referral_code },
                });
            }

            if (!referralCheck) {
                return NextResponse.json(
                    { success: false, error: "Invalid referral_code. Referral code does not exist in referral_codes table" },
                    { status: 400 }
                );
            }
        }

        // Build update data object
        const updateData: any = {};

        if (coupon_code !== undefined) updateData.coupon_code = coupon_code;
        if (type !== undefined) updateData.type = typeForDb;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (start_date !== undefined) updateData.start_date = start_date ? new Date(start_date) : null;
        if (end_date !== undefined) updateData.end_date = end_date ? new Date(end_date) : null;
        if (usage_limit !== undefined) updateData.usage_limit = usage_limit !== null ? usage_limit : null;
        if (referral_code !== undefined) updateData.referral_code = referral_code || null;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (visible !== undefined) updateData.visible = visible;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: "No fields to update" },
                { status: 400 }
            );
        }

        // Always update updated_at
        updateData.updated_at = new Date();

        // Update the coupon
        let updatedCoupon;
        if (region.toLowerCase() === "usa") {
            updatedCoupon = await prismaUSA.coupons.update({
                where: { id },
                data: updateData,
            });
        } else {
            updatedCoupon = await prismaIndia.coupons.update({
                where: { id },
                data: updateData,
            });
        }

        console.log(` Coupon updated successfully: ${id}`);

        return NextResponse.json({
            success: true,
            message: "Coupon updated successfully",
            data: updatedCoupon,
        });
    } catch (error: any) {
        console.error(" Error updating coupon:", error);

        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a coupon
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const region = searchParams.get("region") || "india";

        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID is required" },
                { status: 400 }
            );
        }

        // Handle each Prisma client separately to avoid union type issues
        let existingCoupon;
        if (region.toLowerCase() === "usa") {
            existingCoupon = await prismaUSA.coupons.findUnique({
                where: { id },
            });
        } else {
            existingCoupon = await prismaIndia.coupons.findUnique({
                where: { id },
            });
        }

        if (!existingCoupon) {
            return NextResponse.json(
                { success: false, error: "Coupon not found" },
                { status: 404 }
            );
        }

        // Delete the coupon
        if (region.toLowerCase() === "usa") {
            await prismaUSA.coupons.delete({
                where: { id },
            });
        } else {
            await prismaIndia.coupons.delete({
                where: { id },
            });
        }

        console.log(` Coupon deleted successfully: ${id}`);

        return NextResponse.json({
            success: true,
            message: "Coupon deleted successfully",
        });
    } catch (error) {
        console.error(" Error deleting coupon:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
