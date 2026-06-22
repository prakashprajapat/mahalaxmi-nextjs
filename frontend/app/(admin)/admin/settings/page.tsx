'use client';
import { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

const SECTIONS = [
  {
    title: 'Store Information',
    fields: [
      { key: 'storeName', label: 'Store Name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'address', label: 'Store Address', type: 'textarea' },
      { key: 'phone', label: 'Phone Number', type: 'text' },
      { key: 'whatsapp', label: 'WhatsApp Number (with country code)', type: 'text' },
    ]
  },
  {
    title: 'Social Media',
    fields: [
      { key: 'facebook', label: 'Facebook URL', type: 'url' },
      { key: 'instagram', label: 'Instagram URL', type: 'url' },
    ]
  },
  {
    title: 'Offer Banner',
    desc: 'Controls the offer banner shown on the homepage. Toggle it on/off anytime.',
    fields: [
      { key: 'offerEnabled', label: 'Show Offer Banner', type: 'toggle' },
      { key: 'offerEyebrow', label: 'Eyebrow Text (small label above title)', type: 'text' },
      { key: 'offerTitle', label: 'Offer Title', type: 'text' },
      { key: 'offerText', label: 'Offer Description', type: 'textarea' },
      { key: 'offerButtonLabel', label: 'Button Label', type: 'text' },
      { key: 'offerButtonLink', label: 'Button Link (URL or path)', type: 'text' },
    ]
  },
  {
    title: 'Hero Banner',
    fields: [
      { key: 'heroText', label: 'Hero Overlay Text', type: 'textarea' },
    ]
  },
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
      setMsg('✅ Settings saved successfully.');
    } catch (e) {
      setMsg('❌ Error: ' + (e as Error).message);
    } finally { setSaving(false); }
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a' }}>Store Settings</h1>
        <button onClick={handleSave} disabled={saving || loading}
          style={{ background: '#a7354d', color: '#fff', border: 'none', borderRadius: '8px', padding: '.65rem 2rem', fontSize: '.95rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
          {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>

      {msg && (
        <div style={{ padding: '.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '.9rem', fontWeight: 600,
          background: msg.startsWith('✅') ? '#e8f5e9' : '#fdecea',
          color: msg.startsWith('✅') ? '#2e7d32' : '#c62828', border: `1px solid ${msg.startsWith('✅') ? '#c8e6c9' : '#f5c6cb'}` }}>
          {msg}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#aaa' }}>Loading settings…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {SECTIONS.map(section => (
            <div key={section.title} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: section.desc ? '.35rem' : '1rem', color: '#333' }}>{section.title}</h2>
              {section.desc && <p style={{ fontSize: '.85rem', color: '#888', marginBottom: '1rem' }}>{section.desc}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {section.fields.map(f => (
                  <div key={f.key} style={{ gridColumn: ['address', 'offerText', 'heroText'].includes(f.key) ? '1 / -1' : undefined }}>
                    <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '.3rem', color: '#444' }}>{f.label}</label>
                    {f.type === 'toggle' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <button
                          onClick={() => set(f.key, form[f.key] === 'true' ? 'false' : 'true')}
                          style={{
                            width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                            background: form[f.key] === 'true' ? '#a7354d' : '#ddd',
                            position: 'relative', transition: 'background .2s',
                          }}>
                          <span style={{
                            position: 'absolute', top: '3px',
                            left: form[f.key] === 'true' ? '25px' : '3px',
                            width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                            transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                          }} />
                        </button>
                        <span style={{ fontSize: '.88rem', color: form[f.key] === 'true' ? '#a7354d' : '#888', fontWeight: 600 }}>
                          {form[f.key] === 'true' ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : f.type === 'textarea' ? (
                      <textarea value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}
                        rows={3}
                        style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    ) : (
                      <input type={f.type} value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: '8px', padding: '.6rem .75rem', fontSize: '.88rem', boxSizing: 'border-box' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
