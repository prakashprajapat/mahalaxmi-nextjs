'use client';
import { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

const FIELDS = [
  { key: 'storeName', label: 'Store Name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'address', label: 'Store Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'whatsapp', label: 'WhatsApp Number' },
  { key: 'facebook', label: 'Facebook URL' },
  { key: 'instagram', label: 'Instagram URL' },
  { key: 'offerBanner', label: 'Offer Banner Text' },
  { key: 'heroText', label: 'Hero Banner Text' },
];

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    settingsApi.getAll()
      .then(r => setForm(r.settings ?? {}))
      .catch(() => setForm({}))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await settingsApi.bulkUpsert(form, getAdminToken() ?? '');
      setMsg('Settings saved successfully.');
    } catch (e) {
      setMsg('Error: ' + (e as Error).message);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1a1a1a' }}>Store Settings</h1>

      {loading ? (
        <p style={{ color: '#aaa' }}>Loading settings…</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.07)', maxWidth: '700px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {FIELDS.map(f => (
              <div key={f.key} style={{ gridColumn: ['address', 'offerBanner', 'heroText'].includes(f.key) ? '1 / -1' : undefined }}>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem', color: '#333' }}>{f.label}</label>
                {['address', 'offerBanner', 'heroText'].includes(f.key) ? (
                  <textarea
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={2}
                    style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                ) : (
                  <input
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.9rem', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}
          </div>

          {msg && (
            <p style={{ color: msg.startsWith('Error') ? '#c0392b' : '#27ae60', fontSize: '.88rem', marginBottom: '1rem', fontWeight: 600 }}>
              {msg}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.75rem 2rem', fontSize: '.95rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
