'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCart, cartTotal, clearCart } from '@/lib/cart';
import { getCustomer, getToken } from '@/lib/auth';
import { ordersApi, paymentsApi } from '@/lib/api';
import type { CartItem, Customer } from '@/types';

type Step = 'shipping' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [step, setStep] = useState<Step>('shipping');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [shipping, setShipping] = useState({
    name: '', phone: '', address: '', city: '', pincode: '', state: '',
  });

  useEffect(() => {
    const c = getCart();
    if (c.length === 0) { router.push('/cart'); return; }
    setCart(c);
    const cust = getCustomer();
    if (cust) {
      setCustomer(cust);
      setShipping(s => ({
        ...s,
        name: `${cust.firstName} ${cust.lastName}`,
        phone: cust.phone,
        address: cust.addrLine1,
        city: cust.district,
        pincode: cust.pincode,
        state: cust.state,
      }));
    }
  }, [router]);

  const subtotal = cartTotal(cart);
  const shippingCost = subtotal >= 999 ? 0 : 60;
  const total = subtotal + shippingCost;

  const handleCod = async () => {
    setLoading(true);
    try {
      const oid = `MFH${Date.now()}`;
      await ordersApi.place({
        id: oid,
        method: 'cod',
        status: 'Order Received',
        cart: cart.map(i => ({
          id: String(i.dbId),
          name: i.name,
          sku: i.sku ?? '',
          size: i.selectedSize ?? '',
          image: i.image ?? '',
          quantity: i.quantity,
          price: i.discountPrice ?? i.price,
          lineTotal: (i.discountPrice ?? i.price) * i.quantity,
          category: i.category,
          subcategory: i.subcategory,
          gstRate: 5,
          hsn: '6211',
        })),
        subtotal,
        shippingCost,
        codFee: 50,
        total: total + 50,
        customerId: customer?.id?.toString(),
        customerName: shipping.name,
        customerPhone: shipping.phone,
        shippingName: shipping.name,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingPincode: shipping.pincode,
        shippingState: shipping.state,
        placedAt: new Date().toISOString(),
      });
      clearCart();
      setOrderId(oid);
      setStep('confirm');
    } catch (e) {
      alert('Order failed: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.createOrder({
        amount: total,
        currency: 'INR',
        cart,
        customer,
        shipping,
      });

      const options = {
        key: res.keyId,
        amount: res.amountPaise,
        currency: 'INR',
        order_id: res.orderId,
        name: 'Mahalaxmi Fashion Hub',
        prefill: {
          name: shipping.name,
          contact: shipping.phone,
          email: customer?.email ?? '',
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          await paymentsApi.verify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          await ordersApi.place({
            id: res.localOrderId,
            method: 'razorpay',
            status: 'Paid',
            paymentId: response.razorpay_payment_id,
            cart,
            subtotal,
            shippingCost,
            codFee: 0,
            total,
            customerId: customer?.id?.toString(),
            customerName: shipping.name,
            customerPhone: shipping.phone,
            shippingName: shipping.name,
            shippingAddress: shipping.address,
            shippingCity: shipping.city,
            shippingPincode: shipping.pincode,
            shippingState: shipping.state,
            placedAt: new Date().toISOString(),
          });
          clearCart();
          setOrderId(res.localOrderId);
          setStep('confirm');
          setLoading(false);
        },
        modal: { ondismiss: () => setLoading(false) },
      };
      // @ts-expect-error Razorpay loaded via script tag
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      alert('Payment init failed: ' + (e as Error).message);
      setLoading(false);
    }
  };

  if (step === 'confirm') return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-green-600 mb-2">Order Placed!</h1>
      <p className="text-gray-600 mb-1">Order ID: <strong>{orderId}</strong></p>
      <p className="text-gray-500 text-sm mb-6">You will receive a confirmation message shortly.</p>
      <button onClick={() => router.push('/')} className="btn-primary">Continue Shopping</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <h1 className="text-2xl font-bold mb-6 text-[#8B1A1A]">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Shipping Form */}
        <div className="flex-1">
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4">Shipping Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {([
                ['name', 'Full Name'],
                ['phone', 'Phone'],
                ['address', 'Address'],
                ['city', 'City / District'],
                ['pincode', 'Pincode'],
                ['state', 'State'],
              ] as [keyof typeof shipping, string][]).map(([field, label]) => (
                <div key={field} className={field === 'address' ? 'sm:col-span-2' : ''}>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                  <input
                    value={shipping[field]}
                    onChange={e => setShipping(s => ({ ...s, [field]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6 mt-4">
            <h2 className="font-bold text-lg mb-4">Payment Method</h2>
            <div className="space-y-3">
              <button
                onClick={handleRazorpay}
                disabled={loading}
                className="btn-primary w-full">
                {loading ? 'Processing...' : '💳 Pay Online (UPI / Card / Net Banking)'}
              </button>
              <button
                onClick={handleCod}
                disabled={loading}
                className="btn-secondary w-full">
                🏠 Cash on Delivery (+₹50)
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="card p-5 sticky top-4">
            <h2 className="font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm max-h-48 overflow-y-auto mb-4">
              {cart.map(i => (
                <div key={`${i.dbId}-${i.selectedSize}`} className="flex justify-between">
                  <span className="truncate mr-2">{i.name} × {i.quantity}</span>
                  <span className="shrink-0">₹{((i.discountPrice ?? i.price) * i.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span></div>
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span className="text-[#8B1A1A]">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
