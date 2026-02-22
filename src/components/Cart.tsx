import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import CheckoutForm from "./CheckoutForm";
import DevoteeTypeahead from "./DevoteeTypeahead";

interface CartProps {
    isOpen: boolean;
    onClose: () => void;
}

const Cart = ({ isOpen, onClose }: CartProps) => {
    const { items, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
    const [showCheckout, setShowCheckout] = useState(false);

    const [selectedDevotee, setSelectedDevotee] = useState<{
        Name: string;
        Email: string;
        PhoneNumber: string;
        Address: string;
    } | null>(null);

    //const handleDevoteeSelect = (devotee: {
    //    Name: string;
    //    Email: string;
    //    PhoneNumber: string;
    //    Address: string;
    //}) => {
    //    setSelectedDevotee(devotee);
    //};

    //const handleNewDevotee = (name: string) => {
    //    setSelectedDevotee({
    //        Name: name,
    //        Email: "",
    //        PhoneNumber: "",
    //        Address: ""
    //    });
    //};

    const handleCheckout = () => {
        if (items.length === 0) {
            toast({
                title: "Cart is empty",
                description: "Please add some services before proceeding to checkout.",
                variant: "destructive",
            });
            return;
        }

        setShowCheckout(true);
    };

    const handleCloseCheckout = () => {
        setShowCheckout(false);
    };

    if (showCheckout) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-full sm:max-w-2xl bg-gradient-to-br from-amber-50 to-orange-50 overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-bold text-amber-800">
                            Checkout
                        </SheetTitle>
                    </SheetHeader>
                    <div className="mt-8">
                        <CheckoutForm
                            // devotee={selectedDevotee}
                            onClose={() => {
                                handleCloseCheckout();
                                onClose();
                            }}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-lg bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle className="text-2xl font-bold text-amber-800">
                        Your Cart
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 flex flex-col">
                    {items.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🛒</div>
                                <p className="text-lg text-amber-700">Your cart is empty</p>
                                <p className="text-sm text-amber-600 mt-2">Add some temple services to get started</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                    {items.map((item) => (
                                        <div key={item.id} className="bg-white rounded-lg p-4 shadow-md border border-amber-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-amber-800">{item.name}</h3>
                                                    {/* <p className="text-sm text-gray-600 mt-1">{item.description}</p> */}
                                                    <p className="text-lg font-bold text-orange-600 mt-2">${item.price}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 p-0 border-amber-300"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                    <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 p-0 border-amber-300"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="font-bold text-amber-800">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-amber-200 pt-4 mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xl font-bold text-amber-800">Total:</span>
                                    <span className="text-2xl font-bold text-orange-600">${getCartTotal().toFixed(2)}</span>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={handleCheckout}
                                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 text-lg shadow-lg"
                                    >
                                        Proceed to Checkout
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={clearCart}
                                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                                    >
                                        Clear Cart
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default Cart;
