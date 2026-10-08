// src/payment.js — ALL payment-provider logic lives in this file.
// main.js only calls startPayment() and shows the result; it knows nothing about the provider.
// To change provider later, replace the contents of this file and keep the startPayment() contract below.
//
// SECURITY: only PUBLIC values belong here (e.g. a Key ID). Secret keys must stay on a server.
// A small server function is still needed (not built yet) to (1) create the order and (2) verify the payment.

export const PAYMENT = {
  createOrder: "",   // server endpoint that creates the order (returns { orderId, amount })
  verifyPayment: "", // server endpoint that verifies the payment signature
  razorpayKeyId: "", // public Key ID
};

const isConfigured = () => Boolean(PAYMENT.createOrder && PAYMENT.razorpayKeyId);

function loadCheckout() {
  return new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

/**
 * startPayment({ program, businessName, customer, onSuccess, onError })
 *  - program:      { slug, cohort, name, currency, ... } from the program config
 *  - businessName: shown in the checkout window
 *  - customer:     { name, phone, email }
 *  - onSuccess():  called once the payment is verified
 *  - onError(code): code is "not_configured" | "verify_failed" | "start_failed"
 */
export async function startPayment({ program, businessName, customer, onSuccess, onError }) {
  if (!isConfigured()) return onError("not_configured");
  try {
    // The server creates the order and decides the amount from its own program settings.
    const o = await (
      await fetch(PAYMENT.createOrder, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program: program.slug, ...customer }),
      })
    ).json();
    await loadCheckout();
    new window.Razorpay({
      key: PAYMENT.razorpayKeyId,
      order_id: o.orderId,
      amount: o.amount,
      currency: program.currency,
      name: businessName,
      description: `${program.cohort} — ${program.name}`,
      prefill: { name: customer.name, contact: customer.phone, email: customer.email },
      handler: async (r) => {
        const v = await fetch(PAYMENT.verifyPayment, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        });
        v.ok ? onSuccess() : onError("verify_failed");
      },
    }).open();
  } catch {
    onError("start_failed");
  }
}
