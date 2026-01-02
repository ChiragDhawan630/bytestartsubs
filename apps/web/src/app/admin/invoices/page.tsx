'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Invoice {
    id: number;
    invoice_number: string;
    customer_name?: string;
    total: number;
    status: string;
    invoice_date: string;
    pdf_generated: boolean;
}

export default function AdminInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get('/invoices');
            setInvoices(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleDownload = (id: number) => {
        // Direct download link
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        window.open(`${apiUrl}/invoices/${id}/download`, '_blank');
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Invoices</h1>
            </div>

            {loading ? (
                <p>Loading invoices...</p>
            ) : (
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'hsl(var(--surface-hover))', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Invoice #</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Total</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>{inv.invoice_number}</td>
                                    <td style={{ padding: '1rem' }}>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>₹{inv.total}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '0.25rem',
                                            background: inv.status === 'paid' ? 'hsl(var(--success)/0.2)' : 'hsl(var(--warning)/0.2)',
                                            color: inv.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                            fontSize: '0.875rem'
                                        }}>
                                            {inv.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => handleDownload(inv.id)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                                        >
                                            Download PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No invoices found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
