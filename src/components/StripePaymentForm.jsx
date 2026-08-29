import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export default function StripePaymentForm({
  clientSecret,
  packageInfo,
  onSuccess,
  onCancel,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setPaymentError("");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/credits`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("❌ Stripe payment error:", error);
        setPaymentError(error.message || "Payment failed.");
        setProcessing(false);
        return;
      }

      console.log("✅ Stripe payment completed");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("❌ Payment confirmation error:", err);
      setPaymentError(
        err.message || "Something went wrong while processing payment.",
      );
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Package summary */}
      {packageInfo && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                {packageInfo.name}
              </p>

              <p className="text-sm text-gray-500">
                {packageInfo.total_credits} credits
              </p>
            </div>

            <p className="text-lg font-bold text-gray-900">
              ${Number(packageInfo.price_usd).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Stripe's secure payment UI */}
      <div className="rounded-lg border p-4">
        <PaymentElement />
      </div>

      {/* Error */}
      {paymentError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {paymentError}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!stripe || !elements || processing}
          className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing
            ? "Processing..."
            : `Pay $${Number(packageInfo?.price_usd || 0).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
} 