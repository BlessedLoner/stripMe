// src/lib/stripe.js
import { loadStripe } from "@stripe/stripe-js";

// Get the key with proper fallback
function getStripeKey() {
  // Try to get the key from environment variables
  let key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  // Log for debugging
  console.log('🔑 Stripe key loaded, length:', key?.length || 0);
  console.log('🔑 Stripe key prefix:', key?.substring(0, 7) || 'undefined');
  
  // If key is empty or undefined, check for alternative sources
  if (!key || key === '') {
    console.error('❌ Stripe key is empty or undefined!');
    console.error('📝 Environment variables:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
    
    // ⚠️ FALLBACK: For production debugging ONLY
    // Remove this after fixing the environment variable issue
    // IMPORTANT: Never hardcode keys in production code
    if (import.meta.env.MODE === 'development') {
      key = 'pk_test_YOUR_TEST_KEY_HERE';
      console.warn('⚠️ Using fallback test key (development only)');
    }
  }
  
  return key;
}

// Lazy load Stripe - only when needed
let stripePromise = null;

export function getStripe() {
  if (!stripePromise) {
    const key = getStripeKey();
    if (!key || key === '') {
      console.error('❌ Cannot initialize Stripe: Missing publishable key');
      // Return a rejected promise to fail gracefully
      stripePromise = Promise.reject(new Error('Stripe publishable key is missing'));
    } else {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
}

// For compatibility with existing code
export const stripePromise = getStripe();