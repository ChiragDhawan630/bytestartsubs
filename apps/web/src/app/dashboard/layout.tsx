import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
            <header style={{ borderBottom: '1px solid var(--border)', padding: '1rem' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>ByteStart Dashboard</h1>
                    <nav>
                        <Link href="/" style={{ marginRight: '1rem' }}>Home</Link>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>Logout</button>
                    </nav>
                </div>
            </header>
            <main style={{ flex: 1, padding: '2rem 0', background: 'hsl(var(--surface))' }}>
                <div className="container">
                    {children}
                </div>
            </main>
        </div>
    );
}
