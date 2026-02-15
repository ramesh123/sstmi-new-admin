// src/components/Navigation.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navigation() {
  const [roleCond, setRoleCond] = useState(1);
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const getButtonClass = (path: string) => {
    return pathname === path
      ? "w-full text-left px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg transition-colors"
      : "w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors";
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem('adminuser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setRoleCond(user.roleid);
    }
  }, []);

  return (
    <nav className="w-64 bg-white shadow-lg min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
      </div>
      <ul className="space-y-2">
        {(roleCond === 1 || roleCond === 2) && (
          <li>
            <button
              onClick={() => navigateTo('/admin')}
              className={getButtonClass('/admin')}
            >
              Manage Admin
            </button>
          </li>
        )}
        {(roleCond === 1 || roleCond === 2) && (
          <li>
            <button
              onClick={() => navigateTo('/dashboard')}
              className={getButtonClass('/dashboard')}
            >
              Services Dashboard
            </button>
          </li>
        )}
        {(roleCond === 1 || roleCond === 2) && (
          <li>
            <button
              onClick={() => navigateTo('/priest')}
              className={getButtonClass('/priest')}
            >
              Priest Dashboard
            </button>
          </li>
        )}
        {(roleCond === 1 || roleCond === 2 || roleCond === 3) && (
          <li>
            <button
              onClick={() => navigateTo('/volunteer')}
              className={getButtonClass('/volunteer')}
            >
              Volunteer Dashboard
            </button>
          </li>
        )}
        {roleCond === 1 && (
          <li>
            <button
              onClick={() => navigateTo('/manageusers')}
              className={getButtonClass('/manageusers')}
            >
              Manage Users
            </button>
          </li>
        )}
        {(roleCond === 1 || roleCond === 2) && (
          <li>
            <button
              onClick={() => navigateTo('/managefaqs')}
              className={getButtonClass('/managefaqs')}
            >
              Manage FAQ's
            </button>
          </li>
        )}
        {(roleCond === 1 || roleCond === 2) && (
          <li>
            <button
              onClick={() => navigateTo('/sendmail')}
              className={getButtonClass('/sendmail')}
            >
              Send Mail
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}