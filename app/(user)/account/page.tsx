"use client";

import { useAuth } from "@/context/authcontext";
import { useOrders } from "@/lib/firebase/orders/read";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import React from "react";

interface ProductData {
  name: string;
  images: string[];
}

interface PriceData {
  unit_amount: number; // already includes coupon discount
  product_data: ProductData;
}

interface LineItem {
  price_data: PriceData;
  quantity: number;
}

interface Checkout {
  line_items: LineItem[];
}

interface Coupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
}

interface Order {
  paymentMode?: string;
  status?: string;
  timestampCreate?: {
    toDate: () => Date;
  };
  checkout?: Checkout;
  coupon?: Coupon | null;
}

export default function Page() {
  const { user } = useAuth();
  const { data: orders, error, isLoading } = useOrders({ uid: user?.uid });

  if (isLoading) {
    return (
      <div className="flex justify-center py-48">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-10">{String(error)}</div>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {(!orders || orders.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <Image
            src="/empty.svg"
            width={180}
            height={180}
            alt="Empty"
            className="opacity-80"
          />
          <h2 className="text-xl text-gray-600">You have no orders yet.</h2>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {orders?.map((order: Order, orderIndex: number) => {
          // Total amount after coupon is already applied in unit_amount
          const totalAmount =
            order.checkout?.line_items?.reduce((prev, curr) => {
              return prev + (curr.price_data.unit_amount / 100) * curr.quantity;
            }, 0) ?? 0;

          return (
            <div
              key={`order-${orderIndex}`}
              className="rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition"
            >
              {/* Order Header */}
              <div className="flex justify-between flex-wrap gap-2 mb-4">
                <div className="flex gap-3 flex-wrap items-center">
                  <span className="text-sm font-semibold text-gray-700">
                    Order #{orderIndex + 1}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-500">
                    {order.paymentMode}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {order.status ?? "Pending"}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-green-600 font-medium">
                    ₹ {totalAmount.toFixed(2)}
                  </span>
                  {order.coupon && (
                    <span className="text-xs text-green-600">
                      Coupon <b>{order.coupon.code}</b> applied (
                      {order.coupon.type === "percentage"
                        ? `${order.coupon.value}%`
                        : `₹${order.coupon.value}`}
                      )
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                {order.timestampCreate?.toDate().toLocaleString()}
              </p>

              {/* Order Items */}
              <div className="grid gap-4 md:grid-cols-2">
                {order.checkout?.line_items?.map((item, idx) => (
                  <div
                    key={`order-${orderIndex}-item-${idx}`}
                    className="flex items-center gap-4"
                  >
                    <div className="relative w-14 h-14 rounded-md overflow-hidden bg-gray-100">
                      {item.price_data.product_data.images?.[0] && (
                        <Image
                          src={item.price_data.product_data.images[0]}
                          alt={item.price_data.product_data.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {item.price_data.product_data.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ₹ {(item.price_data.unit_amount / 100).toFixed(2)} x{" "}
                        {item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
