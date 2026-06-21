'use client';
import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

const MOCK_STAFF = [
  { id: 1, name: 'Admin', email: 'admin@mahalaxmifashionhub.com', role: 'admin', lastLogin: '2026-06-21' },
  { id: 2, name: 'Store Manager', email: 'manager@mahalaxmifashionhub.com', role: 'staff', lastLogin: '2026-06-20' },
];

export default function AdminStaffPage() {
  const [staff] = useState(MOCK_STAFF);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async () => {
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) {
      setPwMsg('Password must be at least 8 characters.'); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg('Passwords do not match.'); return;
    }
    setSaving(true); setPwMsg('');
    try {
      // Placeholder: would call authApi.changePassword()
      await new Promise(r => setTimeout(r, 600));
      setPwMsg('Password changed successfully.');
      setPwForm({ newPassword: '', confirmPassword: '' });
    } catch (e) {
      setPwMsg('Error: ' + (e as Error).message);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1a1a1a' }}>Staff Management</h1>

      {/* Staff Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Accounts</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
          <thead style={{ background: '#f9f9f9' }}>
            <tr>
              {['Name', 'Email', 'Role', 'Last Login'].map(h => (
                <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '.78rem', color: '#888', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((s, i) => (
              <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid #f0f0f0' : undefined }}>
                <td style={{ padding: '.75rem 1rem', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '.75rem 1rem', color: '#555' }}>{s.email}</td>
                <td style={{ padding: '.75rem 1rem' }}>
                  <span style={{ background: s.role === 'admin' ? '#fdf0f3' : '#f0f0ff', color: s.role === 'admin' ? '#a7354d' : '#555', fontSize: '.78rem', fontWeight: 700, padding: '.2rem .6rem', borderRadius: '12px' }}>
                    {s.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '.75rem 1rem', color: '#888', fontSize: '.85rem' }}>{s.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Password Reset */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.07)', maxWidth: '480px' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Change Your Password</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>New Password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={e => { setPwForm(f => ({ ...f, newPassword: e.target.value })); setPwMsg(''); }}
              placeholder="Min 8 characters"
              style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Confirm Password</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={e => { setPwForm(f => ({ ...f, confirmPassword: e.target.value })); setPwMsg(''); }}
              placeholder="Re-enter new password"
              style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {pwMsg && (
          <p style={{ color: pwMsg.startsWith('Error') || pwMsg.includes('match') || pwMsg.includes('characters') ? '#c0392b' : '#27ae60', fontSize: '.88rem', marginBottom: '1rem', fontWeight: 600 }}>
            {pwMsg}
          </p>
        )}

        <button
          onClick={handlePasswordChange}
          disabled={saving}
          style={{ background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.65rem 1.5rem', fontSize: '.9rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
          {saving ? 'Saving…' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
