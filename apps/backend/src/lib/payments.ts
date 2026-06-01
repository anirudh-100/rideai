/**
 * Razorpay order creation. Returns null when keys aren't configured so the
 * booking flow works in dev without a payments integration.
 */
import { env } from '../env';

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: 'INR';
}

/** Create a Razorpay order for an amount in rupees, or null if unconfigured. */
export async function createPaymentOrder(
  amountRupees: number,
): Promise<PaymentOrder | null> {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return null;
  try {
    const { default: Razorpay } = await import('razorpay');
    const rzp = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
    const amount = Math.round(amountRupees * 100); // paise
    const order = await rzp.orders.create({ amount, currency: 'INR' });
    return { id: String((order as { id: string }).id), amount, currency: 'INR' };
  } catch (err) {
    console.warn(`createPaymentOrder: Razorpay order failed — ${(err as Error).message}`);
    return null;
  }
}
