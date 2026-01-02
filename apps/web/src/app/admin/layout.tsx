'use client';

import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(var(--surface))' }}>
            <aside style={{ width: '250px', borderRight: '1px solid var(--border)', background: 'hsl(var(--background))', padding: '1.5rem', position: 'sticky', top: 0, height: '100vh' }}>
                <h2 style={{ marginBottom: '2rem', fontSize: '1.25rem' }}>Admin Panel</h2>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link href="/admin" className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none' }}>
                        Overview
                    </Link>
                    <Link href="/admin/users" className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none' }}>
                        Users
                    </Link>
                    <Link href="/admin/plans" className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none' }}>
                        Plans
                    </Link>
                    <Link href="/admin/invoices" className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none' }}>
                        Invoices
                    </Link>
                    <Link href="/admin/settings" className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none' }}>
                        Settings
                    </Link>
                    <hr style={{ margin: '1rem 0', borderColor: 'var(--border)' }} />
                    <Link href="/" style={{ color: 'var(--text-muted)' }}>Exit to App</Link>
                </nav>
            </aside>

            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
