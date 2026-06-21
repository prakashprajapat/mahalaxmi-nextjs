'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCart, cartTotal, clearCart } from '@/lib/cart';
import { getCustomer, getToken } from '@/lib/auth';
import { ordersApi, paymentsApi } from '@/lib/api';
import type { CartItem, Customer } from '@/types';

function getPincodeState(pincode: string): string {
  if (pincode.length < 2) return '';
  const prefix = parseInt(pincode.substring(0, 2), 10);
  if (prefix === 11) return 'Delhi';
  if (prefix >= 12 && prefix <= 13) return 'Haryana';
  if (prefix >= 14 && prefix <= 16) return 'Punjab';
  if (prefix === 17) return 'Himachal Pradesh';
  if (prefix >= 18 && prefix <= 19) return 'Jammu & Kashmir';
  if (prefix >= 20 && prefix <= 28) return 'Uttar Pradesh';
  if (prefix >= 30 && prefix <= 34) return 'Rajasthan';
  if (prefix >= 36 && prefix <= 39) return 'Gujarat';
  if (prefix >= 40 && prefix <= 44) return 'Maharashtra';
  if (prefix >= 45 && prefix <= 49) return 'Madhya Pradesh';
  if (prefix >= 50 && prefix <= 53) return 'Telangana';
  if (prefix >= 56 && prefix <= 59) return 'Karnataka';
  if (prefix >= 60 && prefix <= 64) return 'Tamil Nadu';
  if (prefix >= 67 && prefix <= 69) return 'Kerala';
  if (prefix >= 70 && prefix <= 74) return 'West Bengal';
  if (prefix >= 75 && prefix <= 77) return 'Odisha';
  if (prefix === 78) return 'Assam';
  if (prefix === 79) return 'Arunachal Pradesh';
  if (prefix >= 80 && prefix <= 85) return 'Bihar';
  if (prefix >= 90 && prefix <= 97) return 'Jharkhand';
  return '';
}

type Step = 'shipping' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [step, setStep] = useState<Step>('shipping');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [shipping, setShipping] = useState({
    name: '', email: '', phone: '', address: '', city: '', pincode: '', state: '',
  });

  const [panData, setPanData] = useState({ panNumber: '', panName: '' });

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
        email: cust.email ?? '',
        phone: cust.phone,
        address: cust.addrLine1,
        city: cust.district,
        pincode: cust.pincode,
        state: cust.state,
      }));
    }
    // Pre-fill PAN from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('mfh-pan') ?? '{}');
      if (saved.panNumber) setPanData({ panNumber: saved.panNumber, panName: saved.panName ?? '' });
    } catch {}
  }, [router]);

  const subtotal = cartTotal(cart);
  const shippingCost = subtotal >= 999 ? 0 : 60;
  const total = subtotal + shippingCost;
  const requiresPan = total > 2000;

  const handlePincodeChange = (val: string) => {
    const state = val.length >= 2 ? getPincodeState(val) : '';
    setShipping(s => ({ ...s, pincode: val, ...(state ? { state } : {}) }));
  };

  const validateShipping = () => {
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.pincode || !shipping.state) {
      alert('Please fill all shipping fields.');
      return false;
    }
    if (requiresPan) {
      if (!panData.panNumber || !panData.panName) {
        alert('PAN card details are required for orders above ₹2000.');
        return false;
      }
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panData.panNumber.toUpperCase())) {
        alert('Please enter a valid PAN number (e.g. ABCDE1234F).');
        return false;
      }
    }
    return true;
  };

  const handleCod = async () => {
    if (!validateShipping()) return;
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
        customerEmail: shipping.email,
        customerPhone: shipping.phone,
        panNumber: requiresPan ? panData.panNumber : undefined,
        panName: requiresPan ? panData.panName : undefined,
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
    if (!validateShipping()) return;
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
          email: shipping.email || customer?.email || '',
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
            customerEmail: shipping.email,
            customerPhone: shipping.phone,
            panNumber: requiresPan ? panData.panNumber : undefined,
            panName: requiresPan ? panData.panName : undefined,
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
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#27ae60', marginBottom: '.5rem' }}>Order Placed!</h1>
      <p style={{ color: '#555', marginBottom: '.25rem' }}>Order ID: <strong>{orderId}</strong></p>
      <p style={{ color: '#888', fontSize: '.9rem', marginBottom: '2rem' }}>You will receive a confirmation message shortly.</p>
      <button onClick={() => router.push('/')} className="button primary">Continue Shopping</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: '#a7354d' }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        {/* Left: Shipping + Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Shipping Form */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>Shipping Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Full Name *</label>
                <input value={shipping.name} onChange={e => setShipping(s => ({ ...s, name: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }} />
              </div>
              {/* Email */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Email</label>
                <input type="email" value={shipping.email} onChange={e => setShipping(s => ({ ...s, email: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }} />
              </div>
              {/* Phone */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Phone *</label>
                <input value={shipping.phone} onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }} />
              </div>
              {/* Pincode */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Pincode *</label>
                <input value={shipping.pincode} maxLength={6} onChange={e => handlePincodeChange(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }} />
              </div>
              {/* Address */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Address *</label>
                <input value={shipping.address} onChange={e => setShipping(s => ({ ...s, address: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }} />
              </div>
              {/* City */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>City / District *</label>
                <input value={shipping.city} onChange={e => setShipping(s => ({ ...s, city: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }} />
              </div>
              {/* State */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>State *</label>
                <input value={shipping.state} onChange={e => setShipping(s => ({ ...s, state: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* PAN section (if required) */}
          {requiresPan && (
            <div className="card" style={{ padding: '1.5rem', border: '1.5px solid #f5c6cb', background: '#fff8f9' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem', color: '#a7354d' }}>PAN Card Details Required</h2>
              <p style={{ fontSize: '.85rem', color: '#666', marginBottom: '1rem' }}>
                As per government regulations, PAN details are mandatory for orders above ₹2,000.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>PAN Number *</label>
                  <input value={panData.panNumber} onChange={e => setPanData(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F" maxLength={10}
                    style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box', textTransform: 'uppercase' }} />
                </div>
                <div>
                  <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Name as on PAN *</label>
                  <input value={panData.panName} onChange={e => setPanData(p => ({ ...p, panName: e.target.value }))}
                    placeholder="Full Name"
                    style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>Payment Method</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <button onClick={handleRazorpay} disabled={loading} className="button primary" style={{ width: '100%' }}>
                {loading ? 'Processing…' : '💳 Pay Online (UPI / Card / Net Banking)'}
              </button>
              <button onClick={handleCod} disabled={loading} className="button secondary" style={{ width: '100%' }}>
                🏠 Cash on Delivery (+₹50)
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: '1rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Order Summary</h2>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
            {cart.map(i => (
              <div key={`${i.dbId}-${i.selectedSize}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: '.5rem' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '.5rem' }}>{i.name} × {i.quantity}{i.selectedSize ? ` (${i.selectedSize})` : ''}</span>
                <span style={{ flexShrink: 0 }}>₹{((i.discountPrice ?? i.price) * i.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: '.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', marginBottom: '.4rem' }}>
              <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', marginBottom: '.4rem' }}>
              <span>Shipping</span><span style={{ color: shippingCost === 0 ? '#27ae60' : undefined }}>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', paddingTop: '.5rem', borderTop: '1px solid #eee' }}>
              <span>Total</span>
              <span style={{ color: '#a7354d' }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          {subtotal < 999 && (
            <p style={{ fontSize: '.78rem', color: '#888', marginTop: '.75rem', textAlign: 'center' }}>
              Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for FREE shipping
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
