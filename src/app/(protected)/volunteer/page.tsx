'use client';
import { useState, useEffect } from 'react';
import GenerateReceiptForm from './GenerateReceiptForm';

export default function VolunteerPage() {
  const [activeTab, setActiveTab] = useState('generateReceipt');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Utility to fetch the email from cookies
    const getCookie = (name: string): string | null => {
      const cookies = document.cookie.split('; ');
      const cookie = cookies.find((row) => row.startsWith(`${name}=`));
      return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
    };

    const email = getCookie('email');
    setUserEmail(email || 'Unknown User'); // Set default if no cookie
  }, []);

  const tabs = [
    { key: 'generateReceipt', label: 'Generate Receipt' },
    { key: 'reports', label: 'Reports' },
    // Add more tabs here
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'generateReceipt':
        return <GenerateReceiptForm userName={userEmail || ''} />;
      case 'reports':
        return <div>Reports Content</div>;
      // Add more cases for other tabs
      default:
        return null;
    }
  };

  return (
    // <div className="bg-white rounded-lg shadow p-6">
    <div className="bg-gray-50 min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Volunteer Dashboard</h1>
      <nav className="flex space-x-4 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div>{getTabContent()}</div>
    </div>
  );
}
