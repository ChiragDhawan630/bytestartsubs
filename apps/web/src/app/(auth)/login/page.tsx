import Link from 'next/link';
import { Suspense } from 'react';

export default function LoginPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    return (
        <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '1rem' }}>Welcome Back</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Sign in to manage your subscription</p>

                <a
                    href={`${apiUrl}/auth/google`}
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '1.5rem', justifyContent: 'center' }}
                >
                    Sign in with Google
                </a>

                <p style={{ fontSize: '0.875rem' }}>
                    Don&apos;t have an account? <Link href="/register" style={{ color: 'hsl(var(--primary))' }}>Register</Link>
                </p>
            </div>
        </div>
    );
}
