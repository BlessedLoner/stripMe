// src/providers/StripePaymentProvider.jsx
import { Elements } from "@stripe/react-stripe-js";
import { getStripe, getStripeKey } from "../lib/stripe";
import { useState, useEffect } from "react";

export default function StripePaymentProvider({ children }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const key = getStripeKey();
      console.log('📝 StripeProvider key prefix:', key?.substring(0, 7));
      
      if (!key || key === '') {
        console.error('❌ Stripe key is empty in provider');
        setError('Stripe payment is not configured properly');
        return;
      }
      
      const stripe = getStripe();
      setStripePromise(stripe);
    } catch (err) {
      console.error('❌ Error loading Stripe:', err);
      setError('Failed to load Stripe');
    }
  }, []);

  if (error) {
    return (
      <div className="text-red-500 p-4">
        ⚠️ {error}. Please contact support.
      </div>
    );
  }

  if (!stripePromise) {
    return <div className="text-gray-500">Loading payment system...</div>;
  }

  return <Elements stripe={stripePromise}>{children}</Elements>;
}

// import { loadStripe } from "@stripe/stripe-js";
// import { Elements } from "@stripe/react-stripe-js";

// const stripePromise = loadStripe(
//   import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
// );

// export default function StripePaymentProvider({ children }) {
//   return (
//     <Elements stripe={stripePromise}>
//       {children}
//     </Elements>
//   );
// }