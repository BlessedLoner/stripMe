import { useState } from "react";
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
  packageInfo,
  createPaymentIntent,
  onSuccess,
  onCancel,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [cardComplete, setCardComplete] = useState(false);
  const [expiryComplete, setExpiryComplete] = useState(false);
  const [cvcComplete, setCvcComplete] = useState(false);

  // ------------------------------------------
  // LISTEN FOR CARD FIELD CHANGES
  // ------------------------------------------

  // ------------------------------------------
  // SUBMIT PAYMENT
  // ------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError("Stripe is still loading. Please wait.");
      return;
    }

    if (!cardComplete || !expiryComplete || !cvcComplete) {
      setPaymentError("Please complete all card details.");
      return;
    }

    if (!createPaymentIntent || !packageInfo?.id) {
      setPaymentError("Payment information is missing. Please try again.");
      return;
    }

    setProcessing(true);
    setPaymentError("");

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);

      if (!cardNumberElement) {
        throw new Error("Card input is not available.");
      }

      // ------------------------------------------
      // STEP 1: CREATE PAYMENT INTENT NOW
      // ------------------------------------------
      console.log("💳 Creating payment for package:", packageInfo.id);

      const result = await createPaymentIntent(packageInfo.id);

      if (!result?.clientSecret) {
        throw new Error("Payment session could not be created.");
      }

      const paymentClientSecret = result.clientSecret;

      console.log("💳 PaymentIntent created:", result.paymentIntentId);

      // ------------------------------------------
      // STEP 2: CONFIRM PAYMENT
      // ------------------------------------------
      console.log("💳 Confirming card payment...");

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentClientSecret,
        {
          payment_method: {
            card: cardNumberElement,
          },
        },
      );

      // ------------------------------------------
      // HANDLE STRIPE ERROR
      // ------------------------------------------
      if (error) {
        console.error("❌ Stripe payment error:", error);

        setPaymentError(error.message || "Payment failed. Please try again.");

        setProcessing(false);
        return;
      }

      console.log(
        "✅ PaymentIntent confirmed:",
        paymentIntent?.id,
        paymentIntent?.status,
      );

      // ------------------------------------------
      // PAYMENT SUCCESS
      // ------------------------------------------
      if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("✅ Payment succeeded!");

        if (onSuccess) {
          await onSuccess(paymentIntent);
        }

        return;
      }

      // ------------------------------------------
      // PAYMENT PROCESSING
      // ------------------------------------------
      if (paymentIntent && paymentIntent.status === "processing") {
        console.log("⏳ Payment is processing...");

        if (onSuccess) {
          await onSuccess(paymentIntent);
        }

        return;
      }

      // ------------------------------------------
      // UNEXPECTED STATUS
      // ------------------------------------------
      console.warn(
        "⚠️ Unexpected PaymentIntent status:",
        paymentIntent?.status,
      );

      setPaymentError("Payment was not completed. Please try again.");

      setProcessing(false);
    } catch (err) {
      console.error("❌ Payment confirmation error:", err);

      setPaymentError(
        err.message || "Something went wrong while processing your payment.",
      );

      setProcessing(false);
    }
  };

  const allFieldsComplete = cardComplete && expiryComplete && cvcComplete;

  // ------------------------------------------
  // INPUT WRAPPER
  // ------------------------------------------
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
      {/* ------------------------------------------ */}
      {/* CARD NUMBER */}
      {/* ------------------------------------------ */}
      {/* Card Number - Full width */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Card Number
        </label>
        <div className="rounded-lg border border-gray-300 bg-white px-4 py-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <CardNumberElement
            options={ELEMENT_STYLES}
            onChange={(event) => {
              console.log("💳 CARD:", {
                complete: event.complete,
                empty: event.empty,
                error: event.error?.message,
              });

              setCardComplete(event.complete);

              if (event.error) {
                setPaymentError(event.error.message);
              } else if (event.complete && expiryComplete && cvcComplete) {
                setPaymentError("");
              }
            }}
          />
        </div>
      </div>

      {/* ------------------------------------------ */}
      {/* EXPIRY + CVC */}
      {/* ------------------------------------------ */}

      {/* Expiry + CVC - 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Expiration Date
          </label>
          <div className="rounded-lg border border-gray-300 bg-white px-4 py-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <CardExpiryElement
              options={ELEMENT_STYLES}
              onChange={(event) => {
                setExpiryComplete(event.complete);

                if (event.error) {
                  setPaymentError(event.error.message);
                } else if (event.complete && cardComplete && cvcComplete) {
                  setPaymentError("");
                }
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Security Code
          </label>
          <div className="rounded-lg border border-gray-300 bg-white px-4 py-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <CardCvcElement
              options={ELEMENT_STYLES}
              onChange={(event) => {
                setCvcComplete(event.complete);

                if (event.error) {
                  setPaymentError(event.error.message);
                } else if (event.complete && cardComplete && expiryComplete) {
                  setPaymentError("");
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------ */}
      {/* ERROR */}
      {/* ------------------------------------------ */}
      {paymentError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {paymentError}
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* SECURE BADGE */}
      {/* ------------------------------------------ */}
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

      {/* ------------------------------------------ */}
      {/* BUTTONS */}
      {/* ------------------------------------------ */}
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
          disabled={!stripe || !elements || !allFieldsComplete || processing}
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
