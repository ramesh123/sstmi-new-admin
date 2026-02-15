
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import ServiceCard from "./ServiceCard";
import AddServiceForm from "./AddServiceForm";
import ServiceControls from "./SericeControls";
import Donations from "./donations";
interface Pooja {
    id: string;
    name: string;
    price: number;
    image: string;
}

const PriestServices = () => {
    const { addToCart } = useCart();
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [newService, setNewService] = useState({
        name: "",
        price: "",
        image: "🔔"
    });

    const [services, setServices] = useState<Pooja[]>([
        {
            id: "Punyahavachanam ",
            name: "Punyahavachanam ",
            price: 108,
            image: "🙏"
        },
        {
            id: "Annaprashanam ",
            name: "Annaprashanam ",
            price: 31,
            image: "🔥"
        },
        {
            id: "Kesha Kandana ",
            name: "Kesha Kandana ",
            price: 31,
            image: "🏠"
        },
        {
            id: "Akshara Abhyasam",
            name: "Akshara Abhyasam",
            price: 31,
            image: "💒"
        },
        {
            id: "Upanayanam",
            name: "Upanayanam",
            price: 31,
            image: "🎁"
        },
        {
            id: "Nischitartham ",
            name: "Nischitartham ",
            price: 201,
            image: "🍯"
        },
        {
            id: "Hindu Wedding ",
            name: "Hindu Wedding ",
            price: 251,
            image: "🏠"
        },
        {
            id: "Seemantam",
            name: "Seemantam",
            price: 151,
            image: "💒"
        },
        {
            id: "Shashtipoorti Shanti ",
            name: "Shashtipoorti Shanti ",
            price: 201,
            image: "🎁"
        },
        {
            id: "Bhimaratha shanthi",
            name: "Bhimaratha shanthi  ",
            price: 201,
            image: "🍯"
        },
        {
            id: "Shathabhishekam ",
            name: "Seemantam",
            price: 151,
            image: "💒"
        },
        {
            id: "Sathyanarayana",
            name: "Sathyanarayana",
            price: 108,
            image: "🎁"
        },
        {
            id: "Thirupaavai  Ghoshti",
            name: "Gruhapravesham",
            price: 201,
            image: "🍯"
        },
        {
            id: "Gruhapravesham",
            name: "Gruhapravesham",
            price: 108,
            image: "🎁"
        },
        {
            id: "Hanuman Chalisa",
            name: "Hanuman Chalisa 108",
            price: 201,
            image: "🍯"
        }
    ]);

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddToCart = (service: Donations) => {
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

        const service: Donations = {
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

export default PriestServices;