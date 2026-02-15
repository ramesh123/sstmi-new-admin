"use client";
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { makeSignedRequest, getCognitoIdentityId } from '../app/layout-client';
//import ServiceTypeahead from "./ServiceTypeAhead";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ServiceTypeahead from "./ServiceTypeahead";

// Stripe public key
const stripePromise = loadStripe(
  "pk_live_51QAG83KOttRlqJR2SEJv5rPa0V6yqXMv8j9SW3O4KGkYIeAiUxj79hZJvsBr3IKE7Zfo25OEgDLjaMkt6qILRPX400pyo8ImED"
);

// Custom logging function
const log = (...args: unknown[]): void => {
  if (process.env.NEXT_PUBLIC_CONSOLE_LOG === 'on') {
    console.log(...args);
  }
};

interface CheckoutPageProps {
  initialAmount?: string;
  initialEmail?: string;
  initialPurpose?: string;
  initialName?: string;
}


const CheckoutPage: React.FC<CheckoutPageProps> = ({
  initialAmount = '',
  initialEmail = '',
  initialPurpose = '',
  initialName = ''
}) => {
  const [donationAmount, setDonationAmount] = useState(initialAmount);
  const [devoteeName, setDevoteeName] = useState(initialName);
  const [devoteeEmail, setDevoteeEmail] = useState(initialEmail);
  const [donationPurpose, setDonationPurpose] = useState(initialPurpose);
  const [loading, setLoading] = useState(false);
  // const [message, setMessage] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    // setMessage("");

    log("Checkout process started");

    if (!donationAmount || isNaN(Number(donationAmount)) || Number(donationAmount) <= 0) {
      toast.error("Please enter a valid donation amount.");
      setLoading(false);
      log("Invalid donation amount", donationAmount);
      return;
    }

    if (!devoteeName || devoteeName.trim() === "") {
      toast.error("Please enter a devotee name.");
      setLoading(false);
      log("Invalid devotee name", devoteeName);
      return;
    }

    if (!devoteeEmail || !devoteeEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      setLoading(false);
      log("Invalid email address", devoteeEmail);
      return;
    }

    try {
      const endpoint =
        "https://pxvvmjjvo9.execute-api.us-east-1.amazonaws.com/prod/create-checkout-session";

      const body = {
        amount: Number(donationAmount) * 100,
        name: devoteeName,
        email: devoteeEmail,
        purpose: donationPurpose || "General Donation",
        cognitoIdentityId: getCognitoIdentityId(),
        success_url: `https://www.sstmi.org/paymentsuccess`,
        cancel_url: `https://www.sstmi.org/paymentfailed`
      };

      log("Request body:", JSON.stringify(body));

      log("Sending request to API");
      const responseData = await makeSignedRequest(endpoint, "POST", body);

      log("API response:", JSON.stringify(responseData));

      // Parse the sessionId from the nested JSON in the 'body' field
      const responseBody = JSON.parse(responseData.body);
      const sessionId = responseBody.sessionId;

      
      if (!sessionId) {
        throw new Error('No session ID returned from the API');
      }

      log("Stripe Session ID:", sessionId);

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe has not been initialized');
      }

      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      log("Checkout error:", error);
      toast.error("An error occurred while processing your request. Please try again later.");
    } finally {
      setLoading(false);
      log("Checkout process ended");
    }
  };


  const copyEmailAndNotify = () => {
    navigator.clipboard.writeText("donations@sstmi.org").then(() => {
      toast.success("Email ID copied! Please paste it in your Zelle app.");
      log("Email copied to clipboard");
    });
  };


  return (
    <div className="checkout-container max-w-4xl mx-auto p-6 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg shadow-lg">
      <div className="sloka text-center mb-6">
        <p className="sanskrit text-xl font-bold text-teal-900">
          Paropakāreṇa cittashuddhiḥ saadhyate |
        </p>
        <p className="sanskrit text-xl font-bold text-teal-900">
          Ātmajñānena mokshaḥ sampadhyate ||
        </p>
        <p className="translation text-md text-indigo-900">
          "Serving others purifies the heart. Spiritual knowledge leads to liberation."
        </p>
      </div>

      <h1 className="text-2xl font-bold text-center  text-teal-900 mb-4">Make a Donation</h1>

      <div className="info-section mb-6">
        <p className="text-center font-medium  text-indigo-900 mb-4">
          Please contribute to <strong>donations@sstmi.org</strong>.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="https://venmo.com/code?user_id=4092019295127046995"
            target="_blank"
            className="flex items-center bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition text-teal-900"
          >
            <img src="https://sstmi-website.s3.us-east-1.amazonaws.com/assets/icons/venmo-logo.png" alt="Venmo Logo" className="w-6 h-6 mr-2" />
            Venmo
          </a>
          <a
            href="https://www.paypal.com/qrcodes/managed/8233f027-d985-430f-a32c-7e8b75ad37fc"
            target="_blank"
            className="flex items-center bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition text-teal-900"
          >
            <img src="https://sstmi-website.s3.us-east-1.amazonaws.com/assets/icons/paypal-logo.png" alt="PayPal Logo" className="w-6 h-6 mr-2" />
            PayPal
          </a>
          <button
            onClick={copyEmailAndNotify}
            className="flex items-center bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition text-teal-900"
          >
            <img src="https://sstmi-website.s3.us-east-1.amazonaws.com/assets/icons/zelle-logo.png" alt="Zelle Logo" className="w-6 h-6 mr-2" />
            Zelle
          </button>
        </div>
      </div>

      <div className="credit-card-section bg-white p-4 rounded-lg shadow-md mb-6 max-w-md mx-auto">
      <form className="space-y-4">
          <input
            type="text" // Use "text" to allow fine-grained control
            inputMode="decimal" // Ensures the numeric keypad is displayed
            pattern="[0-9]*" // Optional: restricts input to numbers
            placeholder="Donation Amount $"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Devotee Name"
            value={devoteeName}
            onChange={(e) => setDevoteeName(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            type="email"
            placeholder="Devotee Email"
            value={devoteeEmail}
            onChange={(e) => setDevoteeEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />

          <ServiceTypeahead
            onSelect={(selectedPurpose) => setDonationPurpose(selectedPurpose)}
            className="w-full "
          />

          <button
            type="button"
            onClick={handleCheckout}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center space-x-2"
            disabled={loading}
          >
            <img src="https://sstmi-website.s3.us-east-1.amazonaws.com/assets/icons/cc-logo.png" alt="Credit Card Logo" className="h-6 w-auto" />
            <div className="flex-1">
              {loading ? (
                <span className="button-loading">Loading...</span>
              ) : (
                <span className="button-text">Proceed to secure gateway</span>
              )}
            </div>
          </button>
        </form>
      </div>

      <div className="text-center mt-6">
        <h4 className="text-lg font-bold  text-teal-900">Cheque Payments</h4>
        <p className=" text-indigo-900">Please make your cheque payable to:</p>
        <p className=" text-indigo-900 font-bold">"SSS Temple"</p>
      </div>

      <div className="thank-you-message text-center mt-6">
        <p className="text-teal-900">
          Thank you for your generosity; we gratefully accept all donations. <br />
          <strong className="text-indigo-900">Murugar Blessings!</strong>
        </p>
      </div>
          {/* Add this line */}
    <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default CheckoutPage;