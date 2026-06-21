'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCustomer, getToken } from '@/lib/auth';
import { ordersApi } from '@/lib/api';
import type { Order, Customer } from '@/types';

const HOURS_12 = 12 * 60 * 60 * 1000;
const DAYS_7 = 7 * 24 * 60 * 60 * 1000;

function canCancel(order: Order): boolean {
  if (order.status !== 'Order Received' && order.status !== 'Pending') return false;
  const placed = new Date(order.placedAt ?? order.createdAt).getTime();
  return Date.now() - placed < HOURS_12;
}

function canReturn(order: Order): boolean {
  if (order.status !== 'Delivered') return false;
  const delivered = order.deliveredAt ? new Date(order.deliveredAt).getTime() : null;
  if (!delivered) return false;
  return Date.now() - delivered < DAYS_7;
}

export default function OrdersPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState('');
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnSubmitted, setReturnSubmitted] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const c = getCustomer();
    if (!c) { router.push('/account'); return; }
    setCustomer(c);
    const token = getToken() ?? '';
    ordersApi.getAll({ phone: c.phone, email: c.email }, token)
      .then(r => setOrders(r.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [router]);

  const handleCancel = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await ordersApi.cancel(orderId, getToken() ?? '');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
      setMsg(`Order #${orderId} cancelled successfully.`);
    } catch (e) {
      setMsg('Failed to cancel order: ' + (e as Error).message);
    } finally { setCancellingId(''); }
  };

  const handleReturn = async (orderId: string) => {
    if (!returnReason.trim()) { alert('Please enter a reason for return.'); return; }
    try {
      await ordersApi.requestReturn(orderId, returnReason, getToken() ?? '');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Return Requested' } : o));
      setReturnSubmitted(orderId);
      setReturnOrderId('');
      setReturnReason('');
      setMsg(`Return requested for order #${orderId}.`);
    } catch (e) {
      setMsg('Failed to request return: ' + (e as Error).message);
    }
  };

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">My Account</p>
        <h1>My Orders</h1>
        <p>Track and manage your orders.</p>
      </section>

      <main className="account-shell">
        <nav className="account-menu">
          <Link href="/account">Dashboard</Link>
          <Link href="/orders" className="active">My Orders</Link>
          <Link href="/account/wishlist">Wishlist</Link>
          <Link href="/tracking">Track Order</Link>
          <Link href="/reviews">Write Review</Link>
        </nav>

        <section>
          {msg && (
            <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.9rem', color: '#2e7d32', display: 'flex', justifyContent: 'space-between' }}>
              {msg}
              <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2e7d32', fontWeight: 700 }}>×</button>
            </div>
          )}

          {loading ? (
            <div className="form-card" style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="form-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ color: '#555' }}>No orders yet</h3>
              <p style={{ color: '#888', marginBottom: '1.5rem' }}>Your order history will appear here.</p>
              <Link href="/products" className="button primary">Start Shopping</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map(order => (
                <div key={order.id} className="form-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '1rem' }}>Order #{order.id}</strong>
                      <span style={{ display: 'block', fontSize: '.8rem', color: '#888', marginTop: '.1rem' }}>
                        Placed: {new Date(order.placedAt ?? order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <span className={`badge ${order.status === 'Delivered' ? 'badge-green' : order.status === 'Cancelled' ? 'badge-red' : 'badge-yellow'}`}>
                        {order.status}
                      </span>
                      <strong style={{ color: '#a7354d' }}>₹{order.total.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ fontSize: '.85rem', color: '#555', marginBottom: '.75rem' }}>
                    {order.cart.slice(0, 3).map((item, i) => (
                      <span key={i}>{item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}{i < Math.min(order.cart.length, 3) - 1 ? ', ' : ''}</span>
                    ))}
                    {order.cart.length > 3 && <span style={{ color: '#aaa' }}> +{order.cart.length - 3} more</span>}
                  </div>

                  {order.awb && (
                    <p style={{ fontSize: '.82rem', color: '#666', marginBottom: '.75rem' }}>
                      AWB / Tracking: <strong>{order.awb}</strong>
                    </p>
                  )}

                  {/* Return form */}
                  {returnOrderId === order.id && (
                    <div style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px', padding: '1rem', marginBottom: '.75rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.5rem' }}>Reason for Return</p>
                      <textarea
                        value={returnReason}
                        onChange={e => setReturnReason(e.target.value)}
                        placeholder="Please describe the issue (damaged, wrong item, size issue, etc.)"
                        rows={3}
                        style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                        <button className="button primary" onClick={() => handleReturn(order.id)} style={{ fontSize: '.85rem', padding: '.5rem 1rem' }}>
                          Submit Return Request
                        </button>
                        <button className="button secondary" onClick={() => { setReturnOrderId(''); setReturnReason(''); }} style={{ fontSize: '.85rem', padding: '.5rem 1rem' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {returnSubmitted === order.id && (
                    <p style={{ color: '#27ae60', fontSize: '.85rem', marginBottom: '.5rem' }}>✓ Return request submitted successfully.</p>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    {canCancel(order) && (
                      <button
                        className="button secondary"
                        disabled={cancellingId === order.id}
                        onClick={() => handleCancel(order.id)}
                        style={{ fontSize: '.82rem', padding: '.4rem .85rem', borderColor: '#e74c3c', color: '#e74c3c' }}>
                        {cancellingId === order.id ? 'Cancelling…' : '✕ Cancel Order'}
                      </button>
                    )}
                    {canReturn(order) && returnOrderId !== order.id && returnSubmitted !== order.id && (
                      <button
                        className="button secondary"
                        onClick={() => setReturnOrderId(order.id)}
                        style={{ fontSize: '.82rem', padding: '.4rem .85rem' }}>
                        🔄 Request Return
                      </button>
                    )}
                    <Link href={`/tracking?awb=${order.awb ?? ''}`} className="button secondary" style={{ fontSize: '.82rem', padding: '.4rem .85rem' }}>
                      📦 Track
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
