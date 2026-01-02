'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            router.push('/dashboard');
        } else {
            router.push('/login?error=missing_token');
        }
    }, [searchParams, router]);

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>Authenticating...</p>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <CallbackContent />
        </Suspense>
    );
}
