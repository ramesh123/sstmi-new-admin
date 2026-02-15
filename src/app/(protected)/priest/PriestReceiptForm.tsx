'use client';
import { useEffect, useState } from 'react';
import DevoteeTypeahead from '../../../components/DevoteeTypeahead';
import PriestServiceTypeahead from '../../../components/PriestServiceTypeahead';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ReceiptFormProps {
  userName: string;
}

interface Devotee {
  Name: string;
  Email: string;
  PhoneNumber: string;
  Address: string;
}

interface FormData {
  userName: string;
  recipientName: string;
  recipientEmail: string;
  recipientNumber: string;
  paymentMethod: string;
  serviceName: string;
  price: string;
  donationDate: string;
}

interface ReceiptResponse {
  success: boolean;
  transactionId: string;
  error?: string;
}

export default function PriestReceiptForm({ userName }: ReceiptFormProps) {
  const [formData, setFormData] = useState<FormData>({
    userName,
    recipientName: '',
    recipientEmail: '',
    recipientNumber: '',
    paymentMethod: '',
    serviceName: '',
    price: '',
    donationDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    if (!userName) {
      const email = getCookie('email');
      if (email) {
        setFormData((prev) => ({ ...prev, userName: email }));
      }
    }
  }, [userName]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setIsEdited(true);
  };

  const handleDevoteeSelect = (devotee: Devotee) => {
    setFormData((prev) => ({
      ...prev,
      recipientName: devotee.Name,
      recipientEmail: devotee.Email,
      recipientNumber: devotee.PhoneNumber || '',
    }));
    setIsEdited(true);
  };

  const handleNewName = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      recipientName: name,
      recipientEmail: '',
      recipientNumber: '',
    }));
    setIsEdited(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Custom client-side validation before submitting
    if (!formData.recipientName.trim()) {
      toast.error('Please enter the devotee name', { position: 'top-center' });
      return;
      }
    if (!formData.recipientEmail.trim()) {
      toast.error('Please enter the devotee email', { position: 'top-center' });
      return;
      }
    if (!formData.paymentMethod) {
      toast.error('Please select a payment method', { position: 'top-center' });
      return;
      }
    if (!formData.serviceName.trim()) {
      toast.error('Please select or enter a service name', { position: 'top-center' });
      return;
      }
    if (!formData.price.trim()) {
      toast.error('Please enter the donation amount', { position: 'top-center' });
      return;
      }
    if (!formData.donationDate.trim()) {
      toast.error('Please select a donation date', { position: 'top-center' });
      return;
      }
    setIsSubmitting(true);

    try {
      const payloadData = {
        userName: formData.userName,
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        recipientPhone: formData.recipientNumber || undefined,
        paymentMethod: formData.paymentMethod.toUpperCase(),
        serviceName: formData.serviceName,
        price: Number(formData.price).toFixed(2),
        donationDate: formData.donationDate,
      };

      const response = await fetch('/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payloadData),
      });

      const data: ReceiptResponse = await response.json();

      if (response.ok && data.success) {
        toast.success(
          `Receipt Generated Successfully!
Transaction ID: #${data.transactionId}
Recipient: ${formData.recipientName}
Service: ${formData.serviceName}
Amount: $${formData.price}`,
          { position: 'top-center', autoClose: false }
        );
      } else {
        toast.error(data.error || 'Failed to generate receipt', { position: 'top-center' });
      }
    } catch (err) {
      console.error('Error submitting receipt:', err);
      toast.error('An error occurred. Please try again later.', { position: 'top-center' });
    } finally {
      setIsSubmitting(false);
      setIsEdited(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="mt-6 bg-gray-50 p-4 rounded shadow-md">
        <h2 className="text-xl font-bold mb-4">Generate Receipt</h2>
        <div className="grid grid-cols-1 gap-6">
          {/* User Name (read-only) */}
          <div className="flex flex-col">
            <label htmlFor="userName" className="mb-1 text-sm text-gray-600">
              Your Name
            </label>
            <input
              id="userName"
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              className="p-2 border rounded w-full"
              readOnly
            />
          </div>

          {/* Devotee Typeahead */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm text-gray-600">Devotee Name</label>
            <DevoteeTypeahead
              onSelect={handleDevoteeSelect}
              onNewName={handleNewName}
              className="w-full"
            />
          </div>

          {/* Devotee Email */}
          <div className="flex flex-col">
            <label htmlFor="recipientEmail" className="mb-1 text-sm text-gray-600">
              Devotee Email
            </label>
            <input
              id="recipientEmail"
              type="email"
              name="recipientEmail"
              value={formData.recipientEmail}
              onChange={handleInputChange}
              className="p-2 border rounded w-full"
              required
            />
          </div>

          {/* Devotee Phone Number */}
          <div className="flex flex-col">
            <label htmlFor="recipientNumber" className="mb-1 text-sm text-gray-600">
              Devotee Phone Number (Optional)
            </label>
            <input
              id="recipientNumber"
              type="tel"
              name="recipientNumber"
              value={formData.recipientNumber}
              onChange={handleInputChange}
              className="p-2 border rounded w-full"
              pattern="[0-9+\-\s]*"
            />
          </div>

          {/* Payment Method */}
          <div className="flex flex-col">
            <label htmlFor="paymentMethod" className="mb-1 text-sm text-gray-600">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="p-2 border rounded w-full"
              required
            >
              <option value="">Select Payment Method</option>
              <option value="Cash/Zelle/Venmo">Cash/Zelle/Venmo</option>
              <option value="Check/Cheque">Cheque</option>
              <option value="Credit/Debit Card">Credit/Debit Card</option>
            </select>
          </div>

          {/* Service Typeahead */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm text-gray-600">Service Name</label>
            <PriestServiceTypeahead
              onSelect={(serviceName) =>
                setFormData((prev) => ({
                  ...prev,
                  serviceName,
                }))
              }
              className="w-full"
            />
          </div>

          {/* Donation Amount */}
          <div className="flex flex-col">
            <label htmlFor="price" className="mb-1 text-sm text-gray-600">
              Donation Amount ($)
            </label>
            <input
              id="price"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="p-2 border rounded w-full"
              required
              step="0.01"
              min="0"
            />
          </div>

          {/* Donation Date */}
          <div className="flex flex-col">
            <label htmlFor="donationDate" className="mb-1 text-sm text-gray-600">
              Donation Date
            </label>
            <input
              id="donationDate"
              type="date"
              name="donationDate"
              value={formData.donationDate}
              onChange={handleInputChange}
              className="p-2 border rounded w-full"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded w-full sm:w-auto disabled:opacity-50"
          disabled={isSubmitting || !isEdited}
        >
          {isSubmitting ? 'Generating...' : 'Submit'}
        </button>
      </form>
      <ToastContainer />
    </div>
  );
}

const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((row) => row.startsWith(name + '='));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};
