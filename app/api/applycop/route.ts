import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseadmin";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code?.trim()) {
      return NextResponse.json(
        { message: "Coupon code is required" },
        { status: 400 }
      );
    }

    const couponRef = adminDB
      .collection("coupons")
      .doc(code.toUpperCase().trim());
    const couponSnap = await couponRef.get();

    if (!couponSnap.exists) {
      return NextResponse.json(
        { message: "Invalid coupon code" },
        { status: 404 }
      );
    }

    const couponData = couponSnap.data();

    if (!couponData.discountType || couponData.discountValue === undefined) {
      return NextResponse.json(
        { message: "Coupon data is corrupted" },
        { status: 400 }
      );
    }

    if (
      couponData.maxUses &&
      (couponData.usedCount || 0) >= couponData.maxUses
    ) {
      return NextResponse.json(
        { message: "Coupon usage limit reached" },
        { status: 400 }
      );
    }

    // Increment usage safely
    await couponRef.update({
      usedCount: Number(couponData.usedCount || 0) + 1,
    });

    return NextResponse.json({
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
    });
  } catch (err: any) {
    console.error("❌ Apply coupon error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
