import { useState } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#1a1a1a",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      "::placeholder": {
        color: "#9ca3af",
      },
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

  // Track each field independently
  const [cardComplete, setCardComplete] = useState(false);
  const [expiryComplete, setExpiryComplete] = useState(false);
  const [cvcComplete, setCvcComplete] = useState(false);

  const allFieldsComplete = cardComplete && expiryComplete && cvcComplete;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError("Stripe is still loading. Please wait.");
      return;
    }

    if (!clientSecret) {
      setPaymentError("Payment session is not ready. Please try again.");
      return;
    }

    if (!allFieldsComplete) {
      setPaymentError("Please complete all card details.");
      return;
    }

    setProcessing(true);
    setPaymentError("");

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);

      if (!cardNumberElement) {
        throw new Error("Card input is not ready.");
      }

      console.log("💳 Confirming card payment...");

      const { paymentIntent, error } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
          },
        },
      );

      if (error) {
        console.error("❌ Stripe payment error:", error);

        setPaymentError(error.message || "Payment failed. Please try again.");

        setProcessing(false);
        return;
      }

      console.log("✅ Stripe payment result:", paymentIntent);

      if (paymentIntent?.status === "succeeded") {
        console.log("✅ Payment succeeded");

        if (onSuccess) {
          await onSuccess();
        }

        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "processing") {
        console.log("⏳ Payment is processing");

        if (onSuccess) {
          await onSuccess();
        }

        setProcessing(false);
        return;
      }

      setPaymentError(`Payment status: ${paymentIntent?.status || "unknown"}`);

      setProcessing(false);
    } catch (err) {
      console.error("❌ Payment confirmation error:", err);

      setPaymentError(
        err.message || "Something went wrong while processing payment.",
      );

      setProcessing(false);
    }
  };

  const InputWrapper = ({ children, label }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative rounded-lg border border-gray-300 bg-white px-3 py-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {children}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Card Number */}
      <InputWrapper label="Card number">
        <CardNumberElement
          options={ELEMENT_OPTIONS}
          onChange={(event) => {
            setCardComplete(event.complete);

            if (event.error) {
              setPaymentError(event.error.message);
            } else {
              setPaymentError("");
            }
          }}
        />
      </InputWrapper>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <InputWrapper label="Expiration date">
          <CardExpiryElement
            options={ELEMENT_OPTIONS}
            onChange={(event) => {
              setExpiryComplete(event.complete);

              if (event.error) {
                setPaymentError(event.error.message);
              } else if (event.complete) {
                setPaymentError("");
              }
            }}
          />
        </InputWrapper>

        <InputWrapper label="Security code">
          <CardCvcElement
            options={ELEMENT_OPTIONS}
            onChange={(event) => {
              setCvcComplete(event.complete);

              if (event.error) {
                setPaymentError(event.error.message);
              } else if (event.complete) {
                setPaymentError("");
              }
            }}
          />
        </InputWrapper>
      </div>

      {/* Error */}
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
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2-2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
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
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            !stripe ||
            !elements ||
            !clientSecret ||
            !allFieldsComplete ||
            processing
          }
          className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </span>
          ) : (
            `Pay $${Number(packageInfo?.price || 0).toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
}
