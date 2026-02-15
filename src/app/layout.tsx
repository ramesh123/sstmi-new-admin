// app/layout.tsx
'use client';
import './globals.css';
// import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local'
import { usePathname } from 'next/navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import { CartProvider } from "@/context/CartContext";
import HeaderWithCart from "@/components/HeaderWithCart";

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });


const geistSans = localFont({
  src: [
    {
      path: '../fonts/Geist-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Geist-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-geist',
})

const geistMono = localFont({
  src: '../fonts/GeistMono-Regular.ttf',
  variable: '--font-geist-mono',
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const showHeader = !pathname.includes('/login') && !pathname.includes('/callback');
    const isAdminPage = pathname.includes('/admin');

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <CartProvider>
                    <ErrorBoundary>
                        {showHeader && <HeaderWithCart />}
                        {/* <main className={isAdminPage ? '' : 'container mx-auto px-4 py-8'}>
                            {children}
                        </main> */}
                        <main className="w-full min-h-screen">
                            {children}
                        </main>
                    </ErrorBoundary>
                </CartProvider>
            </body>
        </html>
    );
}