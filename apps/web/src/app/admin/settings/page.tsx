'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminSettings() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings');
                setSettings(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Send all settings as a flat object, the backend DTO logic might need adjustment if it expects specific structure
            // Based on previous checks, updateSettings expects generic object
            await api.put('/admin/settings', settings);
            alert('Settings saved successfully');
        } catch (err) {
            console.error(err);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>Loading settings...</p>;

    return (
        <div style={{ maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem' }}>System Settings</h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>General Settings</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Site Name</label>
                            <input
                                className="input"
                                type="text"
                                value={settings.site_name || ''}
                                onChange={e => handleChange('site_name', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'hsl(var(--background))', color: 'hsl(var(--text-main))' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Support Email</label>
                            <input
                                type="email"
                                value={settings.support_email || ''}
                                onChange={e => handleChange('support_email', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'hsl(var(--background))', color: 'hsl(var(--text-main))' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Tax & Billing</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>GSTIN</label>
                            <input
                                type="text"
                                value={settings.gstin || ''}
                                onChange={e => handleChange('gstin', e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'hsl(var(--background))', color: 'hsl(var(--text-main))' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Invoice Terms</label>
                            <textarea
                                value={settings.invoice_terms || ''}
                                onChange={e => handleChange('invoice_terms', e.target.value)}
                                rows={4}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'hsl(var(--background))', color: 'hsl(var(--text-main))', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Policies</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Privacy Policy URL/Content</label>
                            <textarea
                                value={settings.privacy_policy || ''}
                                onChange={e => handleChange('privacy_policy', e.target.value)}
                                rows={4}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'hsl(var(--background))', color: 'hsl(var(--text-main))', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>

            </form>
        </div>
    );
}
