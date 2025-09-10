// app/api/addCoupon/route.ts
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseadmin";

export async function POST(req: Request) {
  try {
    const { id, discountType, discountValue, expiresAt, maxUses } =
      await req.json();

    if (!id || !discountType || discountValue == null || !maxUses) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const ref = adminDB.collection("coupons").doc(id);
    await ref.set({
      discountType,
      discountValue,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxUses,
      userCount: 0,
    });

    return NextResponse.json({ message: "Coupon added successfully!" });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
