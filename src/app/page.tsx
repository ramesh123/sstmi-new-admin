// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MainPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the login page by default
        router.push('/login');
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
            <p>Redirecting to the login page...</p>
        </div>
    );
}