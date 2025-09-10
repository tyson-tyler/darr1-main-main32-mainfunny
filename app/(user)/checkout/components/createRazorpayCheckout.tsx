import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

type CheckoutPayload = {
  uid: string;
  products: any[]; // [{ product, quantity }]
  address: any;
  coupon?: any;
  razorpay: {
    razorpay_order_id: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
};

export const createRazorpayCheckout = async ({
  uid,
  products,
  address,
  coupon = null,
  razorpay,
}: CheckoutPayload): Promise<string> => {
  try {
    console.log("📦 Saving Razorpay checkout…");

    if (!razorpay?.razorpay_order_id) {
      throw new Error("❌ Missing razorpay_order_id in payload!");
    }

    const checkoutId = razorpay.razorpay_order_id;
    const ref = doc(db, `orders/${checkoutId}`);

    // Convert products into line_items format
    const line_items = products.map((item: any) => ({
      price_data: {
        unit_amount: (item.product.saleprice ?? 0) * 100, // paise
        product_data: {
          name: item.product.title,
          images: [
            item.product.featureImageURL ??
              `https://i.ibb.co/FL0jxNDt/Whats-App-Image-2025-05-16-at-14-02-01-266c60c4.jpg`,
          ],
        },
      },
      quantity: item.quantity,
    }));

    const orderData = {
      id: checkoutId,
      uid,
      checkout: { line_items },
      address,
      coupon,
      razorpay,
      paymentMode: "prepaid",
      status: razorpay?.razorpay_payment_id ? "paid" : "pending",
      timestampCreate: serverTimestamp(),
      success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/checkout-success?checkout_id=${checkoutId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/checkout-failed?checkout_id=${checkoutId}`,
    };

    console.log("📝 Writing order to Firestore at:", ref.path, orderData);

    await setDoc(ref, orderData);

    console.log("✅ Order successfully created in Firestore!");
    toast.success("✅ Order model created in Firestore!");

    return checkoutId;
  } catch (error: any) {
    console.error("🔥 Failed to create Razorpay checkout:", error);
    toast.error("❌ Failed to create order in Firestore");
    throw new Error(error?.message || "Failed to create Razorpay checkout");
  }
};
