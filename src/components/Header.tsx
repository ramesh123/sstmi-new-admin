import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import Cart from "./Cart";

const Header = () => {
   const [isCartOpen, setIsCartOpen] = useState(false);
   const { getCartCount } = useCart();

   return (
       <>
           <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-40">
               <div className="container mx-auto px-4 py-4">
                   <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                           <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                               <span className="text-white font-bold text-lg">🕉</span>
                           </div>
                           <h1 className="text-2xl font-bold text-amber-800">Sacred Temple</h1>
                       </div>

                       <div className="flex items-center space-x-4">
                           <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setIsCartOpen(true)}
                               className="relative border-amber-300 text-amber-700 hover:bg-amber-50"
                           >
                               <ShoppingCart className="w-4 h-4" />
                               {getCartCount() > 0 && (
                                   <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                       {getCartCount()}
                                   </span>
                               )}
                           </Button>
                       </div>
                   </div>
               </div>
           </header>

           <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
       </>
   );
};

export default Header;
