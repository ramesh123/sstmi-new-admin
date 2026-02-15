
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import ServiceCard from "./ServiceCard";
import AddServiceForm from "./AddServiceForm";
import ServiceControls from "./SericeControls";

interface Service {
    id: string;
    name: string;
    price: number;
    image: string;
}

const Achishekam = () => {
    const { addToCart } = useCart();
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [newService, setNewService] = useState({
        name: "",
        price: "",
        image: "🔔"
    });

    const [services, setServices] = useState<Service[]>([
        {
            id: "RUDRABHISHEKAM",
            name: "Ekadasa Rudrabhishekam",
            price: 25,
            image: "💧"
        },
        {
            id: "TAILABHISHEKAM",
            name: "Shani Grahana Tailabhishekam",
            price: 75,
            image: "💧"
        },
        {
            id: "SHASHTI",
            name: "Shashti Abhishekam",
            price: 150,
            image: "💧"
        }
    ]);

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddToCart = (service: Service) => {
        addToCart({
            id: service.id,
            name: service.name,
            price: service.price,
            description: service.name
        });

        toast({
            title: "Added to Cart",
            description: `${service.name} has been added to your cart.`,
        });
    };

    const handleAddService = () => {
        if (!newService.name || !newService.price) {
            toast({
                title: "Error",
                description: "Please fill in all fields.",
                variant: "destructive"
            });
            return;
        }

        const service: Service = {
            id: `custom-${Date.now()}`,
            name: newService.name,
            price: parseFloat(newService.price),
            image: newService.image
        };

        setServices([...services, service]);
        setNewService({
            name: "",
            price: "",
            image: "🔔"
        });
        setShowAddForm(false);

        toast({
            title: "Service Added",
            description: `${service.name} has been added to services.`,
        });
    };

    const handleUpdateService = (serviceId: string, newPrice: number) => {
        const updatedServices = services.map(service =>
            service.id === serviceId
                ? { ...service, price: newPrice }
                : service
        );
        setServices(updatedServices);
    };

    return (
        <section id="services" className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="container mx-auto px-4">
                <ServiceControls
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAddServiceClick={() => setShowAddForm(!showAddForm)}
                />

                {showAddForm && (
                    <AddServiceForm
                        newService={newService}
                        setNewService={setNewService}
                        onAddService={handleAddService}
                        onCancel={() => setShowAddForm(false)}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredServices.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            onAddToCart={handleAddToCart}
                            onUpdateService={handleUpdateService}
                        />
                    ))}
                </div>

                {filteredServices.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-amber-700 text-lg">No services found matching your search.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Achishekam;