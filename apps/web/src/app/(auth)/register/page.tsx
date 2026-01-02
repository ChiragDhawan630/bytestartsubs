import Link from 'next/link';

export default function RegisterPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    return (
        <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '1rem' }}>Get Started</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Create a new account to subscribe</p>

                <a
                    href={`${apiUrl}/auth/google`}
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '1.5rem', justifyContent: 'center' }}
                >
                    Sign up with Google
                </a>

                <p style={{ fontSize: '0.875rem' }}>
                    Already have an account? <Link href="/login" style={{ color: 'hsl(var(--primary))' }}>Login</Link>
                </p>
            </div>
        </div>
    );
}
