'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Plan {
    id: string;
    name: string;
    price_original: number;
    price_discounted: number;
    billing_cycle: string;
    is_active: boolean;
}

export default function AdminPlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/plans');
            setPlans(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await api.delete(`/admin/plans/${id}`);
            fetchPlans();
        } catch (err) {
            alert('Failed to delete plan');
            console.error(err);
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Plans Management</h1>
                <button className="btn btn-primary">Create New Plan</button>
            </div>

            {loading ? (
                <p>Loading plans...</p>
            ) : (
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'hsl(var(--surface-hover))', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Price</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Billing Cycle</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan) => (
                                <tr key={plan.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>{plan.id}</td>
                                    <td style={{ padding: '1rem' }}>{plan.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: '0.5rem' }}>{plan.price_original}</span>
                                        {plan.price_discounted}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{plan.billing_cycle}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            color: plan.is_active ? 'var(--success)' : 'var(--error)',
                                            fontWeight: 'bold'
                                        }}>
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Edit</button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                                                onClick={() => handleDelete(plan.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {plans.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No plans created yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
