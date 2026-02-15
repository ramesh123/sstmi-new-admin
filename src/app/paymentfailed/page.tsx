"use client";
import { useEffect, useState } from 'react';
import TopInfo from '@/components/TopInfo';
import MainHeader from '@/components/TopInfo';
import Navbar from '@/components/Navbar';
import Checkout from '@/components/donate';
import Footer from '@/components/Footer';

// Custom logging function
const log = (...args: unknown[]): void => {
  if (process.env.NEXT_PUBLIC_CONSOLE_LOG === 'on') {
    console.log(...args);
  }
};

const FailurePage = () => {
  const [message, setMessage] = useState('Verifying payment status...');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ name: '', amount: '', email: '', purpose: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // This code will only run in the browser
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      validateToken(token);
    } else {
      setMessage('No token found. Unable to verify payment.');
      setShowCheckout(true);
      setIsModalOpen(true); // Open the modal
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`https://511blbs43g.execute-api.us-east-1.amazonaws.com/prod/validate?token=${token}`);
      const data = await response.json();
      log('Validation response data:', data);
      setMessage('We\'re sorry, but there was an issue with your payment. Please try again.');
      setShowCheckout(true);
      setIsModalOpen(true); // Open the modal

      if (data.valid) {
        setCheckoutData({
          amount: data.amount ? (Number(data.amount) / 100).toString() : '',
          name: data.name || '',
          email: data.email || '',
          purpose: data.purpose || ''
        });
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setMessage('An error occurred while verifying your payment. Please try again or contact support.');
      setShowCheckout(true);
      setIsModalOpen(true); // Open the modal
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* <TopInfo /> */}
      <MainHeader />
      <Navbar />
      <div className="gradient-background">
        <div className="container mx-auto mt-10 p-4">
          {/* <h1 className="text-2xl font-bold mb-4">Payment Result</h1>
          <p className="mb-4">{message}</p> */}
          {showCheckout && (
            <div>
              {/* <h2 className="text-xl font-semibold mb-2">Try Again</h2> */}
              <Checkout 
                initialAmount={checkoutData.amount}
                initialName={checkoutData.name}
                initialEmail={checkoutData.email}
                initialPurpose={checkoutData.purpose}
              />
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Message</h2>
            <p className="mb-4">{message}</p>
            <button
              onClick={closeModal}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FailurePage;
