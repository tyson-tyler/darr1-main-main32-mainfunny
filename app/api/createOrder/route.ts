// app/api/createOrder/route.ts
import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== "number") {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount, // in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (err: any) {
    console.error("Error creating Razorpay order:", err);
    return NextResponse.json(
      { error: "Unable to create order" },
      { status: 500 }
    );
  }
}
// "hello"
