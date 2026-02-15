'use client';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const REQUIRED_ENV_VARS = {
    NEXT_PUBLIC_REDIRECT_URI: process.env.NEXT_PUBLIC_REDIRECT_URI,
    NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
};

export default function LoginPage() {
    const router = useRouter();
    const logoPath = process.env.NEXT_PUBLIC_LOGO_PATH || '/assets/logo.png';

    useEffect(() => {
        const missingVars = Object.entries(REQUIRED_ENV_VARS)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingVars.length > 0) {
            console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
            return;
        }
    }, []);

    const initiateLogin = () => {
        const authUrl = `https://${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/authorize?` +
            new URLSearchParams({
                response_type: 'code',
                client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
                redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
                scope: 'email openid phone',
            }).toString();

        window.location.href = authUrl;
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <Image
                src={logoPath}
                alt="Logo"
                width={128}
                height={128}
                className="w-32 h-32 mb-6 object-contain"
                priority
            />
            <h1 className="text-2xl text-center mb-8">SSTMI Admin POS</h1>
            <button
                onClick={initiateLogin}
                className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
            >
                Login
            </button>
        </div>
    );
}