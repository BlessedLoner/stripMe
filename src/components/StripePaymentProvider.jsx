import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// const stripePromise = loadStripe(
//   import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
// );

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

console.log("Stripe key exists:", !!stripeKey);
console.log("Stripe key prefix:", stripeKey?.slice(0, 7));

const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function StripePaymentProvider({ children }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}