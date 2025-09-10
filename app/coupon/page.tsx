"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

export default function page() {
  const [id, setId] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCoupon = async () => {
    if (!id || !discountValue || !expiresAt || !maxUses) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/addCoupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          discountType,
          discountValue,
          expiresAt,
          maxUses,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
      } else {
        toast.success(`Coupon ${data.id} added successfully`);
        setId("");
        setDiscountValue(0);
        setExpiresAt("");
        setMaxUses(1);
      }
    } catch (err) {
      toast.error("Failed to add coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
      <h1 className="text-xl font-bold mb-4">Add Coupon</h1>

      <input
        type="text"
        placeholder="Coupon ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <select
        value={discountType}
        onChange={(e) => setDiscountType(e.target.value as any)}
        className="w-full mb-3 p-2 border rounded"
      >
        <option value="percentage">Percentage</option>
        <option value="fixed">Fixed</option>
      </select>

      <input
        type="number"
        placeholder="Discount Value"
        value={discountValue}
        onChange={(e) => setDiscountValue(Number(e.target.value))}
        className="w-full mb-3 p-2 border rounded"
      />

      <input
        type="datetime-local"
        placeholder="Expires At"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <input
        type="number"
        placeholder="Max Uses"
        value={maxUses}
        onChange={(e) => setMaxUses(Number(e.target.value))}
        className="w-full mb-3 p-2 border rounded"
      />

      <button
        onClick={handleAddCoupon}
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {isSubmitting ? "Adding..." : "Add Coupon"}
      </button>
    </div>
  );
}
