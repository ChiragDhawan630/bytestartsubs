'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Subscription {
    id: number;
    razorpay_sub_id: string;
    plan_id: string;
    status: string;
    start_date: string;
    renewal_date: string;
}

export default function Dashboard() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSubs = async () => {
            try {
                const res = await api.get('/subscriptions/my-subscriptions');
                setSubscriptions(res.data);
            } catch (err) {
                console.error(err);
                // If 401, interceptor will redirect, but we can also handle here
            } finally {
                setLoading(false);
            }
        };

        fetchSubs();
    }, [router]);

    if (loading) return <p>Loading dashboard...</p>;

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem' }}>My Subscriptions</h2>

            {subscriptions.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You don&apos;t have any active subscriptions.</p>
                    <Link href="/#plans" className="btn btn-primary">Browse Plans</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {subscriptions.map((sub) => (
                        <div key={sub.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>Subscription #{sub.id}</h3>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    background: sub.status === 'active' ? 'hsl(var(--success)/0.2)' : 'hsl(var(--text-muted)/0.2)',
                                    color: sub.status === 'active' ? 'hsl(var(--success))' : 'hsl(var(--text-muted))',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}>
                                    {sub.status.toUpperCase()}
                                </span>
                            </div>

                            <p style={{ color: 'var(--text-muted)' }}>Razorpay ID: {sub.razorpay_sub_id}</p>
                            <p>Renews on: {sub.renewal_date ? new Date(sub.renewal_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
