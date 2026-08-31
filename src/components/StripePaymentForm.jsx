import { useState, useEffect } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Custom styling for Stripe Elements
const ELEMENT_STYLES = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1a1a1a",
      fontFamily: "Inter, -apple-system, sans-serif",
      "::placeholder": {
        color: "#9ca3af",
        fontSize: "14px",
      },
      padding: "12px 0",
    },
    invalid: {
      color: "#dc2626",
      iconColor: "#dc2626",
    },
  },
};

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
  const [isCardComplete, setIsCardComplete] = useState(false);

  // Check if card is complete
  useEffect(() => {
    if (!elements) return;

    // Listen for card element changes
    const cardElement = elements.getElement(CardNumberElement);
    if (cardElement) {
      cardElement.on("change", (event) => {
        setIsCardComplete(event.complete);
      });
    }
  }, [elements]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError("Stripe is still loading. Please wait.");
      return;
    }

    setProcessing(true);
    setPaymentError("");

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/credits`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        console.error("❌ Stripe payment error:", submitError);
        setPaymentError(submitError.message || "Payment failed.");
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

  // Custom input wrapper for consistent styling
  const InputWrapper = ({ children, label }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative rounded-lg border border-gray-300 bg-white px-3 py-2 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {children}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Card Number */}
      <InputWrapper label="Card number">
        <CardNumberElement
          options={ELEMENT_STYLES}
          className="w-full outline-none"
        />
      </InputWrapper>

      {/* Row: Expiry + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <InputWrapper label="Expiration date">
          <CardExpiryElement
            options={ELEMENT_STYLES}
            className="w-full outline-none"
          />
        </InputWrapper>

        <InputWrapper label="Security code">
          <CardCvcElement
            options={ELEMENT_STYLES}
            className="w-full outline-none"
          />
        </InputWrapper>
      </div>

      {/* Error Message */}
      {paymentError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {paymentError}
        </div>
      )}

      {/* Secure badge */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Your payment is secure with Stripe</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
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
          disabled={!stripe || !elements || processing || !isCardComplete}
          className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Processing...
            </span>
          ) : (
            `Pay $${(packageInfo?.price || 0).toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
}
