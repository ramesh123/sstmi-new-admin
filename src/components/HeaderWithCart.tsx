'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import { useCart } from "@/context/CartContext";
import Cart from "@/components/Cart";

const signOutRedirect = () => {
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const logoutUri = process.env.NEXT_PUBLIC_LOGOUT_URI; 
  const cognitoDomain = `https://${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}`;
  
  if (clientId && logoutUri && cognitoDomain) {
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  } else {
    console.error('Missing environment variables for Cognito logout.');
  }
};

export default function OptimizedHeader() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { getCartCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  // Hide Navbar elements if on the login page
  const isLoginPage = pathname === '/login' || pathname === '/'; 
  const cartCount = getCartCount();

  const navItems = [
    { label: 'Pooja Cart', path: '/dashboard' },
    { label: 'Admin', path: '/admin' },
    { label: 'Receipts', path: '/volunteer' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsNavOpen(false);
  };

  return (
    <>
      <header className="bg-gray-800 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left Side: Burger + Logo */}
          <div className="flex items-center space-x-3">
            {!isLoginPage && (
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="p-2 hover:bg-gray-700 rounded-lg transition text-amber-300"
                aria-label="Menu"
              ><Menu size={28} />
                {/* {isNavOpen ? <X size={28} /> : <Menu size={28} />} */}
              </button>
            )}
            
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
              <Image
                src={process.env.NEXT_PUBLIC_LOGO_PATH || '/default-logo.png'}
                alt="Logo"
                width={40}
                height={40}
                className="object-contain w-8 h-8 md:w-10 md:h-10"
              />
              <h1 className="text-lg md:text-2xl font-bold">SSTMI POS</h1>
            </div>
          </div>

          {/* Right Side: Cart & Logout */}
          <div className="flex items-center space-x-2 md:space-x-6">
            {/* <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-amber-300 hover:bg-gray-700 rounded-lg transition"
            >
              <ShoppingCart size={24} className="w-5 h-5 md:w-6 md:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button> */}

            {!isLoginPage && (
              <>
                {/* Desktop Logout */}
                <button
                  onClick={signOutRedirect}
                  className="hidden md:block bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition font-medium"
                >
                  Logout
                </button>
                {/* Mobile Logout */}
                <button
                  onClick={signOutRedirect}
                  className="md:hidden p-2 text-red-400 hover:bg-gray-700 rounded-lg transition"
                >
                  <LogOut size={22} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dropdown Navigation Menu (The "Burger" Menu) */}
        {/* {!isLoginPage && isNavOpen && (
          <div className="absolute top-full left-0 w-full bg-gray-800 border-t border-gray-700 shadow-xl animate-in fade-in slide-in-from-top-2">
            <nav className="max-w-7xl mx-auto p-4">
              <ul className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition font-medium ${
                        pathname === item.path 
                        ? 'bg-gray-700 text-white border-l-4 border-amber-300' 
                        : 'text-amber-300 hover:bg-gray-700 hover:text-amber-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )} */}
      </header>

      {/* <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} /> */}
    </>
  );
}