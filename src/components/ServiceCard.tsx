
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface Service {
    id: string;
    name: string;
    price: number;
    image: string;
}

interface ServiceCardProps {
    service: Service;
    onAddToCart: (service: Service) => void;
    onUpdateService: (serviceId: string, newPrice: number) => void;
}

const ServiceCard = ({ service, onAddToCart, onUpdateService }: ServiceCardProps) => {
    const [editPrice, setEditPrice] = useState("");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleEditService = () => {
        setEditPrice(service.price.toString());
        setIsEditDialogOpen(true);
    };

    const handleUpdatePrice = () => {
        if (!editPrice || isNaN(parseFloat(editPrice))) {
            toast({
                title: "Error",
                description: "Please enter a valid price.",
                variant: "destructive"
            });
            return;
        }

        onUpdateService(service.id, parseFloat(editPrice));
        setIsEditDialogOpen(false);
        setEditPrice("");

        toast({
            title: "Price Updated",
            description: `${service.name} price has been updated to $${editPrice}.`,
        });
    };

    return (
        <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-amber-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {service.image}
                </div>
                <CardTitle className="text-xl font-bold text-amber-800 mb-2">
                    {service.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <div className="mb-6">
                    <span className="text-3xl font-bold text-orange-600">
                        ${service.price}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => onAddToCart(service)}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                        Add to Cart
                    </Button>
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={handleEditService}
                                variant="outline"
                                size="icon"
                                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit Service Price</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-price" className="text-right">
                                        Price ($)
                                    </Label>
                                    <Input
                                        id="edit-price"
                                        type="number"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Enter new price"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    onClick={handleUpdatePrice}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Update Price
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
};

export default ServiceCard;