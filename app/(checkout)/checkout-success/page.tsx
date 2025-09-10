import Footer from "../../components/footer/footer";
import TopHeader from "../../components/navbar/topheader";
import { adminDB } from "@/lib/firebase_admin";
import Link from "next/link";
import SuccessMessage from "./components/SuccessMessage";
import { Metadata } from "next";
import Productnav from "@/app/components/navbar/ProductNav";
import admin from "firebase-admin";

// Types
type CheckoutSession = {
  id: string;
  products: {
    quantity: number;
    product: {
      id: string;
      title: string;
    };
  }[];
  uid: string;
  status: string;
  [key: string]: any;
};

type SearchParams = {
  checkout_id: string;
};

export const metadata: Metadata = {
  title: "Order Success",
};

// Fetch Razorpay checkout order from Firestore
const fetchCheckout = async (
  checkoutId: string
): Promise<CheckoutSession | null> => {
  try {
    const orderDoc = await adminDB.doc(`orders/${checkoutId}`).get();

    if (!orderDoc.exists) {
      throw new Error("Invalid Checkout ID");
    }

    return orderDoc.data() as CheckoutSession;
  } catch (error: any) {
    console.error("❌ fetchCheckout error:", error.message);
    return null;
  }
};

// Save final order + update user cart + increment product orders
const processOrder = async ({
  checkout,
}: {
  checkout: CheckoutSession | null;
}): Promise<boolean> => {
  if (!checkout) return false;

  const orderRef = adminDB.doc(`orders/${checkout.id}`);
  const existing = await orderRef.get();

  // If already processed, skip
  if (existing.exists && existing.data()?.status === "paid") {
    return false;
  }

  // Mark order as paid
  await orderRef.set(
    {
      ...checkout,
      status: "paid",
      timestampCreate: admin.firestore.Timestamp.now(),
    },
    { merge: true }
  );

  // Remove purchased items from user cart
  const uid = checkout.uid;
  const userRef = adminDB.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};

  const purchasedIds = checkout.products.map((p: any) => p.product.id);
  const newCart = (userData.carts ?? []).filter(
    (item: any) => !purchasedIds.includes(item.id)
  );

  await userRef.set({ carts: newCart }, { merge: true });

  // Increment product order counts
  const batch = adminDB.batch();
  checkout.products.forEach((p: any) => {
    const productRef = adminDB.doc(`products/${p.product.id}`);
    batch.update(productRef, {
      orders: admin.firestore.FieldValue.increment(p.quantity),
    });
  });
  await batch.commit();

  return true;
};

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { checkout_id } = searchParams;

  const checkout = await fetchCheckout(checkout_id);
  const result = await processOrder({ checkout });

  if (!checkout) {
    return (
      <main>
        <Productnav />
        <section className="min-h-screen flex flex-col gap-3 justify-center items-center">
          <h1 className="text-2xl font-semibold text-red-500">
            Invalid or Missing Checkout ID
          </h1>
          <Link href="/">
            <button className="text-blue-600 border border-blue-600 px-5 py-2 rounded-lg bg-white">
              Go to Home
            </button>
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Productnav />
      <SuccessMessage />
      <section className="min-h-screen flex flex-col gap-3 justify-center items-center">
        <div className="flex justify-center w-full">
          <img src="/success.svg" className="h-48" alt="Success" />
        </div>
        <h1 className="text-2xl font-semibold text-green-600">
          Your Order Is <span className="font-bold">Successfully</span> Placed
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href={"/account"}>
            <button className="text-blue-600 border border-blue-600 px-5 py-2 rounded-lg bg-white">
              Go To Orders Page
            </button>
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
