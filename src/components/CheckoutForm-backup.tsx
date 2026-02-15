import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
//import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { makeSignedRequest, getCognitoIdentityId } from '../app/layout-client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Lock } from "lucide-react";

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

interface CheckoutFormProps {
    onClose: () => void;
}
const stripePromise = loadStripe(
    "pk_live_51QAG83KOttRlqJR2SEJv5rPa0V6yqXMv8j9SW3O4KGkYIeAiUxj79hZJvsBr3IKE7Zfo25OEgDLjaMkt6qILRPX400pyo8ImED"
);

const CheckoutForm = ({ onClose }: CheckoutFormProps) => {
    const { items, getCartTotal, clearCart } = useCart();
    const [isProcessing, setIsProcessing] = useState(false);

    const form = useForm<CheckoutFormData>({
        defaultValues: {
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            cardholderName: '',
            email: '',
            billingAddress: '',
            city: '',
            zipCode: '',
        },
    });

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    const formatExpiryDate = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };
    const log = (...args: unknown[]): void => {
        if (process.env.NEXT_PUBLIC_CONSOLE_LOG === 'on') {
            console.log(...args);
        }
    };

    const onSubmit = async (data: CheckoutFormData) => {
        setIsProcessing(true);

        try {
            const endpoint =
                "https://pxvvmjjvo9.execute-api.us-east-1.amazonaws.com/prod/create-checkout-session";

            // Convert items array to a string for the 'purpose' field
            const purposeString = items && items.length > 0
                ? items.map(item => `${item.name} x${item.quantity}`).join(', ')
                : "General Donation";

            const body = {
                amount: getCartTotal() * 100,
                name: data.cardholderName,
                email: data.email,
                purpose: purposeString,
                cognitoIdentityId: getCognitoIdentityId(),
                success_url: `https://admin.sstmi.org/paymentsuccess`,
                cancel_url: `https://admin.sstmi.org/paymentfailed`
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

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('Processing payment for:', {
                items,
                total: getCartTotal(),
                paymentDetails: {
                    ...data,
                    cardNumber: data.cardNumber.replace(/\d(?=\d{4})/g, '*'),
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

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="cardholderName"
                            rules={{ required: "Cardholder name is required" }}
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Cardholder Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cardNumber"
                            rules={{
                                required: "Card number is required",
                                pattern: {
                                    value: /^[\d\s]{13,19}$/,
                                    message: "Please enter a valid card number"
                                }
                            }}
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Card Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="1234 5678 9012 3456"
                                            maxLength={19}
                                            {...field}
                                            onChange={(e) => {
                                                const formatted = formatCardNumber(e.target.value);
                                                field.onChange(formatted);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="expiryDate"
                            rules={{
                                required: "Expiry date is required",
                                pattern: {
                                    value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                                    message: "Please enter a valid expiry date (MM/YY)"
                                }
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Expiry Date</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="MM/YY"
                                            maxLength={5}
                                            {...field}
                                            onChange={(e) => {
                                                const formatted = formatExpiryDate(e.target.value);
                                                field.onChange(formatted);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cvv"
                            rules={{
                                required: "CVV is required",
                                pattern: {
                                    value: /^\d{3,4}$/,
                                    message: "Please enter a valid CVV"
                                }
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CVV</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="123"
                                            maxLength={4}
                                            type="password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-amber-800">Billing Information</h3>

                        <FormField
                            control={form.control}
                            name="email"
                            rules={{
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Please enter a valid email address"
                                }
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="billingAddress"
                            rules={{ required: "Billing address is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billing Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main Street" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                rules={{ required: "City is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="New York" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="zipCode"
                                rules={{ required: "ZIP code is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ZIP Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="10001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
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
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Processing..." : `Pay $${getCartTotal().toFixed(2)}`}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default CheckoutForm;