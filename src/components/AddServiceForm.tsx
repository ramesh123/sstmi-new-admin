
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface NewService {
    name: string;
    price: string;
    image: string;
}

interface AddServiceFormProps {
    newService: NewService;
    setNewService: (service: NewService) => void;
    onAddService: () => void;
    onCancel: () => void;
}

const AddServiceForm = ({ newService, setNewService, onAddService, onCancel }: AddServiceFormProps) => {
    return (
        <Card className="mb-8 max-w-2xl mx-auto border-amber-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-amber-800">Add New Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="serviceName">Service Name</Label>
                    <Input
                        id="serviceName"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        placeholder="Enter service name"
                    />
                </div>
                <div>
                    <Label htmlFor="servicePrice">Price ($)</Label>
                    <Input
                        id="servicePrice"
                        type="number"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                        placeholder="Enter price"
                    />
                </div>
                <div>
                    <Label htmlFor="serviceEmoji">Emoji</Label>
                    <Input
                        id="serviceEmoji"
                        value={newService.image}
                        onChange={(e) => setNewService({ ...newService, image: e.target.value })}
                        placeholder="Enter emoji (e.g., 🔔)"
                        maxLength={2}
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={onAddService} className="bg-green-600 hover:bg-green-700">
                        Add Service
                    </Button>
                    <Button
                        onClick={onCancel}
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                        Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AddServiceForm;