'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { customersApi } from '@/lib/api';
import { setCustomer, setToken } from '@/lib/auth';

type Step = 'details' | 'emailOtp' | 'success';

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Chandigarh',
  'Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep','Puducherry'
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpInput, setOtpInput] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', gender: '',
    phone: '', email: '', password: '', confirmPw: '',
    dob: '', anniv: '',
    addrLine1: '', addrLine2: '', pincode: '', postOffice: '',
    state: '', district: '',
    consent: false,
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const pwStrength = (() => {
    const pw = form.password;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    const colors = ['#e74c3c','#e67e22','#f1c40f','#27ae60'];
    const labels = ['Weak','Fair','Good','Strong'];
    return { pct: s * 25, color: colors[s-1] || '#ddd', label: s > 0 ? labels[s-1] : '' };
  })();

  const handleSendEmailOtp = async () => {
    setError('');
    if (!form.firstName.trim()) return setError('First Name is required.');
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return setError('Please enter a valid email address.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPw) return setError('Passwords do not match.');
    if (!form.addrLine1.trim()) return setError('Address Line 1 is required.');
    if (!form.pincode || !/^\d{6}$/.test(form.pincode)) return setError('Please enter a valid 6-digit Pincode.');
    if (!form.state) return setError('Please select a State.');

    setLoading(true);
    try {
      await customersApi.sendOtp(form.phone || form.email);
      setStep('emailOtp');
    } catch (e) {
      setError((e as Error).message || 'Could not send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleCreateAccount = async () => {
    setError('');
    if (!otpInput || otpInput.length < 6) return setError('Please enter the complete 6-digit OTP.');
    setLoading(true);
    try {
      const res = await customersApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        email: form.email,
        phone: form.phone,
        password: form.password,
        dateOfBirth: form.dob,
        anniversaryDate: form.anniv,
        addrLine1: form.addrLine1,
        addrLine2: form.addrLine2,
        pincode: form.pincode,
        postOffice: form.postOffice,
        state: form.state,
        district: form.district,
        marketingConsent: form.consent,
        otp: otpInput,
      });
      if (res.token) { setToken(res.token); setCustomer(res.customer); }
      setStep('success');
      setTimeout(() => router.push('/account'), 3000);
    } catch (e) {
      setError((e as Error).message || 'Account creation failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Customer Account</p>
        <h1>Create Account</h1>
        <p>Join Mahalaxmi Fashion Hub for faster checkout, order tracking and exclusive offers.</p>
      </section>

      <main className="account-shell">
        <nav className="account-menu">
          <Link href="/account">Login / Signup</Link>
          <Link className="active" href="/account/register">New Registration</Link>
          <Link href="/account?tab=orders">My Orders</Link>
        </nav>

        <section className="auth-stack">
          {/* Step Indicator */}
          <div className="wizard-steps">
            <div className={`wiz-step ${step === 'details' ? 'active' : 'done'}`}>
              <div className="wiz-circle">{step === 'details' ? '1' : '✓'}</div>
              <div className="wiz-label">Details</div>
            </div>
            <div className={`wiz-step ${step === 'emailOtp' ? 'active' : step === 'success' ? 'done' : ''}`}>
              <div className="wiz-circle">{step === 'success' ? '✓' : '2'}</div>
              <div className="wiz-label">Email OTP</div>
            </div>
          </div>

          {/* Step 1: Details */}
          {step === 'details' && (
            <div className="form-card">
              <h2>Your Personal Details</h2>
              <div className="info-banner success">
                We will verify your email before creating the account.
              </div>
              <div className="form-grid">
                <label>
                  First Name <span className="required-mark">*</span>
                  <input type="text" value={form.firstName} onChange={set('firstName')}
                    placeholder="First name" required autoComplete="given-name" />
                </label>
                <label>
                  Last Name
                  <input type="text" value={form.lastName} onChange={set('lastName')}
                    placeholder="Last name (optional)" autoComplete="family-name" />
                </label>

                <div className="full-field">
                  <span style={{ fontSize: '.9rem', fontWeight: 600, display: 'block', marginBottom: '.5rem' }}>Gender</span>
                  <div className="gender-row">
                    {['Male','Female','Other'].map(g => (
                      <label key={g} className="gender-option">
                        <input type="radio" name="gender" value={g}
                          checked={form.gender === g}
                          onChange={() => setForm(f => ({ ...f, gender: g }))} /> {g}
                      </label>
                    ))}
                  </div>
                </div>

                <label>
                  Mobile Number
                  <input type="tel" value={form.phone} onChange={set('phone')}
                    placeholder="e.g. 9876543210" maxLength={15} inputMode="numeric" autoComplete="tel" />
                </label>
                <label>
                  Email ID <span className="required-mark">*</span>
                  <input type="email" value={form.email} onChange={set('email')}
                    placeholder="you@example.com" required autoComplete="email" />
                </label>
                <label style={{ alignContent: 'start' }}>
                  Password <span className="required-mark">*</span>
                  <input type="password" value={form.password} onChange={set('password')}
                    placeholder="Min 8 characters" required autoComplete="new-password" />
                  <div className="pw-bar" style={{ width: `${pwStrength.pct}%`, background: pwStrength.color }} />
                  <small className="pw-hint">{pwStrength.label}</small>
                </label>
                <label>
                  Confirm Password <span className="required-mark">*</span>
                  <input type="password" value={form.confirmPw} onChange={set('confirmPw')}
                    placeholder="Re-enter password" required autoComplete="new-password" />
                </label>
                {/* Birthday & Anniversary Special Offers Box */}
                <div className="full-field" style={{
                  background: 'linear-gradient(135deg, #fff0f3 0%, #fff8e1 100%)',
                  border: '2px dashed #a7354d',
                  borderRadius: '12px',
                  padding: '1.25rem 1.25rem .75rem',
                  marginTop: '.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.5rem' }}>
                    <span style={{ fontSize: '1.6rem' }}>🎁</span>
                    <div>
                      <p style={{ fontWeight: 700, color: '#a7354d', fontSize: '.95rem', margin: 0 }}>
                        Get Special Birthday &amp; Anniversary Offers!
                      </p>
                      <p style={{ color: '#666', fontSize: '.82rem', margin: '2px 0 0' }}>
                        Enter your dates below to receive exclusive discounts and surprises on your special days.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginTop: '.75rem' }}>
                    <label>
                      🎂 Date of Birth
                      <input type="date" value={form.dob} onChange={set('dob')} autoComplete="bday" />
                    </label>
                    <label>
                      💍 Anniversary Date
                      <input type="date" value={form.anniv} onChange={set('anniv')} />
                    </label>
                  </div>
                </div>

                <label className="full-field">
                  Address Line 1 <span className="required-mark">*</span>
                  <input type="text" value={form.addrLine1} onChange={set('addrLine1')}
                    placeholder="House No., Building, Street" required autoComplete="address-line1" />
                </label>
                <label className="full-field">
                  Address Line 2 <small style={{ color: '#888', fontWeight: 400 }}>(optional)</small>
                  <input type="text" value={form.addrLine2} onChange={set('addrLine2')}
                    placeholder="Landmark, Colony, Area" autoComplete="address-line2" />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <label>
                    Pincode <span className="required-mark">*</span>
                    <input type="text" value={form.pincode} onChange={set('pincode')}
                      inputMode="numeric" maxLength={6} pattern="[0-9]{6}" placeholder="6-digit PIN" required />
                  </label>
                  <label>
                    Post Office <span className="required-mark">*</span>
                    <input type="text" value={form.postOffice} onChange={set('postOffice')}
                      placeholder="Post office name" />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <label>
                    State <span className="required-mark">*</span>
                    <select value={form.state} onChange={set('state')} required>
                      <option value="">— Select State —</option>
                      {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label>
                    District
                    <input type="text" value={form.district} onChange={set('district')} placeholder="District" />
                  </label>
                </div>

                <label className="full-field consent-check">
                  <input type="checkbox" checked={form.consent}
                    onChange={e => setForm(f => ({ ...f, consent: e.target.checked }))} />
                  <span>I agree to receive offer updates and order notifications on WhatsApp or email.</span>
                </label>

                {error && <p className="wiz-message full-field">{error}</p>}

                <div className="form-actions">
                  <button type="button" onClick={handleSendEmailOtp} disabled={loading} className="button primary">
                    {loading ? 'Please wait…' : 'Send Email OTP →'}
                  </button>
                  <Link href="/account" className="button secondary">Back to Login</Link>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Email OTP */}
          {step === 'emailOtp' && (
            <div className="form-card">
              <h2>Verify Your Email</h2>
              <p style={{ color: '#555', fontSize: '.92rem', marginBottom: '.5rem' }}>
                OTP sent to <strong>{form.email}</strong>
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '.65rem .85rem', margin: '.5rem 0 .75rem', fontSize: '.84rem', color: '#795548', lineHeight: 1.45 }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📬</span>
                <span>OTP emails sometimes land in your <strong>Spam / Junk</strong> folder. Please check there if you did not receive it.</span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, fontSize: '.9rem', display: 'block', marginBottom: '.4rem' }}>Enter 6-digit OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter OTP"
                  style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '.65rem 1rem', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '.15em', maxWidth: '200px', outline: 'none', textAlign: 'center' }}
                  onFocus={e => { e.target.style.borderColor = '#a7354d'; }}
                  onBlur={e => { e.target.style.borderColor = '#ddd'; }}
                />
              </div>

              {error && <p className="wiz-message">{error}</p>}

              <div className="form-actions">
                <button type="button" onClick={handleCreateAccount} disabled={loading} className="button primary">
                  {loading ? 'Creating Account…' : 'Create Account 🎉'}
                </button>
                <button type="button" onClick={() => setStep('details')} className="button secondary">← Back</button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="form-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '.75rem' }}>🎉</div>
              <h2 style={{ color: '#27ae60' }}>Account Created!</h2>
              <p style={{ color: '#555', marginBottom: '1.5rem' }}>
                Welcome to Mahalaxmi Fashion Hub. Redirecting to your account…
              </p>
              <div className="form-actions" style={{ justifyContent: 'center' }}>
                <Link href="/account" className="button primary">Go to My Account</Link>
                <Link href="/" className="button secondary">Continue Shopping</Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
