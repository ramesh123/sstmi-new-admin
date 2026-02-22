// src/components/Navigation.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const ADMIN_EMAILS = ['kumarkoppireddy@gmail.com', 'hvgpaani@gmail.com', 'vikram846@gmail.com'];

const ADMIN_LINKS = [
  { path: '/admin', label: 'Manage Admin' },
  { path: '/dashboard', label: 'Services Dashboard' },
  { path: '/priest', label: 'Priest Dashboard' },
  { path: '/volunteer', label: 'Volunteer Dashboard' },
  { path: '/manageusers', label: 'Manage Users' },
  { path: '/managefaqs', label: "Manage FAQ's" },
  { path: '/sendmail', label: 'Send Mail' }
];

const OTHER_LINKS = [
  { path: '/volunteer', label: 'Volunteer Dashboard' },
  { path: '/servicesdashboard', label: 'Services Dashboard' }
];

export default function Navigation() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const email = document.cookie
      .split('; ')
      .find((row) => row.startsWith('email='))
      ?.split('=')[1];

    setIsAdmin(!!email && ADMIN_EMAILS.includes(decodeURIComponent(email)));
  }, []);

  const getButtonClass = (path: string) =>
    `w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
      pathname === path
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-200'
    }`;

  const links = isAdmin ? ADMIN_LINKS : OTHER_LINKS;

  return (
    <nav className="w-64 bg-white shadow-lg min-h-screen p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Admin Panel</h2>
      <ul className="space-y-2">
        {links.map(({ path, label }) => (
          <li key={path}>
            <button onClick={() => router.push(path)} className={getButtonClass(path)}>
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}