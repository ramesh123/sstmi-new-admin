"use client";

import React, { useState, useEffect } from "react";
import { makeSignedRequest } from '../app/layout-client';

// Custom logging function
const log = (...args: unknown[]): void => {
  if (process.env.NEXT_PUBLIC_CONSOLE_LOG === 'on') {
    console.log(...args);
  }
};

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export default function Footer() {
  const [formData, setFormData] = useState({ name: "", email: "", unsubscribe: false });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    log("Footer component mounted");
  }, []);

  useEffect(() => {
    log("Form data updated:", formData);
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {  
    e.preventDefault();
    setLoading(true);
    setMessage("");

    log("Form submission started");

    try {
      if (typeof window.grecaptcha === 'undefined') {
        throw new Error('reCAPTCHA has not loaded');
      }

      const token = await new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute('6Lfgd58qAAAAAPV03W3LgVMhxu57mDL006Jr3Jhs', { action: 'submit' })
            .then(resolve, reject);
        });
      });

      log("reCAPTCHA token obtained:", token);

      const apiEndpoint = "https://gv2houqzgk.execute-api.us-east-1.amazonaws.com/prod/subscribe";

      const body = {
        name: formData.name,
        email: formData.email,
        subscribe: !formData.unsubscribe,
        token: token
      };

      log("Request body:", body);

      const data = await makeSignedRequest(apiEndpoint, "POST", body);

      log("API response:", data);

      setMessage(data.message || "Successfully updated preferences!");
    } catch (error) {
      console.error("Submission error:", error);
      log("Submission error:", error);
      setMessage("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const allVolunteersIconUrl = "https://pplx-res.cloudinary.com/image/upload/v1743804925/user_uploads/xQWozVbcOkYaamf/image.jpg";
  const youthVolunteersIconUrl = "https://pplx-res.cloudinary.com/image/upload/v1743804795/user_uploads/xQWozVbcOkYaamf/image.jpg";

  return (
    <footer id="Contact" className="bg-gradient-to-r from-yellow-100 to-yellow-300 py-12 text-gray-800">
      <div className="container mx-auto px-6">
        {/* Connect & Contact Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 items-start">

          {/* Connect & Contact */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Connect & Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="https://youtube.com/%40MurugarKovil2024"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <i className="fab fa-youtube text-red-600 text-xl"></i>
                <span>YouTube</span>
              </a>
              <a
                href="https://www.facebook.com/ssstmi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <i className="fab fa-facebook text-blue-600 text-xl"></i>
                <span>Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/srisubramanyaswamytemple"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <i className="fab fa-instagram text-pink-600 text-xl"></i>
                <span>Instagram</span>
              </a>
              <a
                href="https://wa.me/12404134578"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <i className="fab fa-whatsapp text-green-600 text-xl"></i>
                <span>WhatsApp</span>
              </a>
              <a
                href="mailto:info@sstmi.org"
                className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <i className="fas fa-envelope text-red-500 text-xl"></i>
                <span>Email</span>
              </a>
              <a
                href="tel:+12404134578"
                className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <i className="fas fa-phone text-green-500 text-xl"></i>
                <span>Call</span>
              </a>
              <a
                href="https://linktr.ee/SSTMI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <img src={youthVolunteersIconUrl} alt="Youth Volunteer Icon" className="h-5 w-5" />
                <span>Youth Volunteers Signup</span>
              </a>
              <a
                href="https://linktr.ee/SSTMI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <img src={allVolunteersIconUrl} alt="All Volunteer Icon" className="h-5 w-5" />
                <span>Volunteers Signup</span>
              </a>
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Location</h3>
            <a
              href="https://maps.app.goo.gl/Xy5CsEAtA8oMNxn4A"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <i className="fas fa-map-marker-alt text-green-500 text-xl"></i>
              <span>Find Us on Google Maps</span>
            </a>
            <img
              src="https://sstmi-website.s3.us-east-1.amazonaws.com/assets/logo/location.jpg"
              alt="landmark"
              className="mt-4 rounded-lg shadow-md w-full h-48 object-cover"
            />
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Subscribe to Our Newsletter</h3>
            <div id="newsletter" className="bg-white p-6 rounded-lg shadow-lg flex flex-col">

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  required
                />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Your Email"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  required
                />
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="unsubscribe"
                    checked={formData.unsubscribe}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="unsubscribe">Unsubscribe</label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 transition"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Update Preferences"}
                </button>
              </form>
              {message && (
                <p
                  className={`mt-4 text-center font-semibold ${message.includes("Successfully") ? "text-green-500" : "text-red-500"
                    }`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-600 mt-12">
          &copy; 2024 Sri Subramanya Swamy Cultural Center. All Rights
          Reserved.
        </p>
      </div>
      {/* Spacer for Bottom Navbar */}
      <div className="h-16 md:h-20"></div>
    </footer>
  );
}
