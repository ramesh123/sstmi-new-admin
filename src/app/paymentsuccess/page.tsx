"use client";
import { useEffect, useState } from 'react';
import TopInfo from '@/components/TopInfo';
import MainHeader from '@/components/TopInfo';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SuccessPage = () => {
  const [message, setMessage] = useState('Verifying payment status...');

  useEffect(() => {
    // This code will only run in the browser
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      validateToken(token);
    } else {
      setMessage('No token found. Unable to verify payment.');
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`https://511blbs43g.execute-api.us-east-1.amazonaws.com/prod/validate?token=${token}`);
      const data = await response.json();
      
      if (data.valid && data.type === 'success') {
        setMessage('Thank you for your payment! Your transaction was successful.');
      } else {
        setMessage('We could not verify your payment. Please contact support.');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setMessage('An error occurred while verifying your payment. Please try again or contact support.');
    }
  };

  return (
    <>
{/* <TopInfo /> */}
<MainHeader />
<Navbar />
<div className="gradient-background">
    <div className="container mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Payment Result</h1>
      <p>{message}</p>
    </div>
    </div>
<Footer />
</>
  );
};

export default SuccessPage;



