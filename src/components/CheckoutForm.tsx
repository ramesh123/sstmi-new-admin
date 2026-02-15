import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { makeSignedRequest, getCognitoIdentityId } from '../app/layout-client';
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Lock } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import DevoteeTypeahead from "@/components/DevoteeTypeahead";

interface CheckoutFormData {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
    email: string;
    billingAddress: string;
    city: string;
    zipCode: string;
}

interface Devotee {
    Name: string;
    Email: string;
    PhoneNumber: string;
    Address: string;
}

interface CheckoutFormProps {
    onClose: () => void;
}

const stripePromise = loadStripe(
    "pk_live_51QAG83KOttRlqJR2SEJv5rPa0V6yqXMv8j9SW3O4KGkYIeAiUxj79hZJvsBr3IKE7Zfo25OEgDLjaMkt6qILRPX400pyo8ImED"
);

const CheckoutForm = ({ onClose }: CheckoutFormProps) => {
    const { items, getCartTotal, clearCart } = useCart();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Devotee information state
    const [devoteeName, setDevoteeName] = useState("");
    const [devoteeEmail, setDevoteeEmail] = useState("");
    const [devoteePhone, setDevoteePhone] = useState("");

    const form = useForm<CheckoutFormData>({
        defaultValues: {
            cardNumber: "",
            expiryDate: "",
            cvv: "",
            cardholderName: "",
            email: "",
            billingAddress: "",
            city: "",
            zipCode: "",
        },
    });

    const log = (...args: unknown[]): void => {
        if (process.env.NEXT_PUBLIC_CONSOLE_LOG === 'on') {
            console.log(...args);
        }
    };

    const handleDevoteeSelect = (devotee: Devotee) => {
        setDevoteeName(devotee.Name);
        setDevoteeEmail(devotee.Email);
        setDevoteePhone(devotee.PhoneNumber || "");
    };

    const handleNewName = (name: string) => {
        setDevoteeName(name);
        setDevoteeEmail("");
        setDevoteePhone("");
    };

    const onSubmit = async () => {
        // Validate devotee information
        if (!devoteeName.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter your name.",
                variant: "destructive"
            });
            return;
        }

        if (!devoteeEmail.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter your email.",
                variant: "destructive"
            });
            return;
        }

        if (!devoteePhone.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter your phone number.",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);

        try {
            const endpoint =
                "https://pxvvmjjvo9.execute-api.us-east-1.amazonaws.com/prod/create-checkout-session";

            const purposeString = items && items.length > 0
                ? items.map(item => `${item.name} x${item.quantity}`).join(', ')
                : "General Donation";

            const body = {
                amount: getCartTotal() * 100,
                name: devoteeName,
                email: devoteeEmail,
                phone: devoteePhone,
                purpose: purposeString,
                cognitoIdentityId: getCognitoIdentityId(),
                success_url: `https://admin.sstmi.org/paymentsuccess`,
                cancel_url: `https://admin.sstmi.org/paymentfailed`
            };
            log("Request body:", JSON.stringify(body));

            log("Sending request to API");
            const responseData = await makeSignedRequest(endpoint, "POST", body);

            log("API response:", JSON.stringify(responseData));

            const responseBody = JSON.parse(responseData.body);
            const sessionId = responseBody.sessionId;

            if (!sessionId) {
                throw new Error('No session ID returned from the API');
            }

            log("Stripe Session ID:", sessionId);

            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error('Stripe has not been initialized');
            }
            const result = await stripe.redirectToCheckout({ sessionId });

            if (result.error) {
                throw new Error(result.error.message);
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('Processing payment for:', {
                items,
                total: getCartTotal(),
                devoteeInfo: {
                    name: devoteeName,
                    email: devoteeEmail,
                    phone: devoteePhone
                },
            });

            toast({
                title: "Payment Successful!",
                description: `Your order of $${getCartTotal().toFixed(2)} has been processed successfully.`,
            });

            clearCart();
            onClose();
        } catch (error) {
            toast({
                title: "Payment Failed",
                description: "There was an error processing your payment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
            log("Checkout process ended");
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto text-amber-600 mb-4" />
                <h2 className="text-2xl font-bold text-amber-800 mb-2">Secure Checkout</h2>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Lock className="w-4 h-4" />
                    <span>Your payment information is encrypted and secure</span>
                </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm">
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.name} × {item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-amber-300 mt-2 pt-2 font-bold text-lg">
                    Total: ${getCartTotal().toFixed(2)}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-amber-800">Billing Information</h3>

                {/* Name - DevoteeTypeahead */}
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <DevoteeTypeahead
                        onSelect={handleDevoteeSelect}
                        onNewName={handleNewName}
                        className="w-full"
                    />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <label htmlFor="devoteeEmail" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="devoteeEmail"
                        type="email"
                        placeholder="john@example.com"
                        value={devoteeEmail}
                        onChange={(e) => setDevoteeEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                    <label htmlFor="devoteePhone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="devoteePhone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={devoteePhone}
                        onChange={(e) => setDevoteePhone(e.target.value)}
                        pattern="[0-9+\-\s()]*"
                        required
                    />
                </div>
            </div>

            <div className="flex space-x-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={isProcessing}
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={onSubmit}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    disabled={isProcessing}
                >
                    {isProcessing ? "Processing..." : `Pay $${getCartTotal().toFixed(2)}`}
                </Button>
            </div>
        </div>
    );
};

export default CheckoutForm;