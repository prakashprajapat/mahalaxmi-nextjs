'use client';
import type { Metadata } from 'next';
import { useState } from 'react';

export default function TrackingPage() {
  const [awb, setAwb] = useState('');
  const [pincode, setPincode] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (awb.trim()) {
      window.open(`https://www.delhivery.com/track/package/${awb.trim()}`, '_blank');
    }
  };

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Delivery</p>
        <h1>Track Order</h1>
        <p>Enter your Delhivery AWB number to check shipment status. We open the official Delhivery tracking page in a new tab.</p>
      </section>

      <main className="tracking-page">
        <section className="tracking-card">
          <h2>Shipment Lookup</h2>
          <form className="tracking-form" onSubmit={handleTrack}>
            <input
              type="text"
              placeholder="AWB number from Delhivery"
              aria-label="AWB number"
              value={awb}
              onChange={e => setAwb(e.target.value)}
            />
            <button type="submit">Track</button>
          </form>
          <div className="safety-inline-box">
            <strong>Safe delivery reminder</strong>
            <p>Verify the order ID when receiving the delivery. If there is a parcel issue, send the parcel-opening video and parcel photos to the support team on the same day.</p>
          </div>
        </section>

        <section className="tracking-card">
          <h2>Check Serviceability</h2>
          <p>Not sure if we deliver to your area? Enter your pincode to check Delhivery&apos;s coverage and whether Cash on Delivery is available.</p>
          <form className="tracking-form" onSubmit={e => { e.preventDefault(); window.open(`https://www.delhivery.com/`, '_blank'); }}>
            <input
              type="text"
              placeholder="Enter 6-digit pincode"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <button type="submit">Check</button>
          </form>
        </section>

        <section className="tracking-card">
          <h2>Delivery Support</h2>
          <p>Facing a delivery issue? We are here to help.</p>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
            <li>For missing or damaged items, WhatsApp us within <strong>48 hours of delivery</strong>.</li>
            <li>For delayed orders, share your AWB number on WhatsApp for faster resolution.</li>
            <li>For address change requests, contact us before dispatch only.</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            <a href="https://wa.me/919429429880" target="_blank" rel="noopener noreferrer" style={{ color: '#a7354d', fontWeight: 600 }}>
              WhatsApp: +91 9429429880 →
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
