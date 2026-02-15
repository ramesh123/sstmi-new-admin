import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

interface ServiceControlsProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onAddServiceClick: () => void;
}

const ServiceControls = ({ searchTerm, onSearchChange, onAddServiceClick }: ServiceControlsProps) => {
    return (
        <div className="flex justify-between items-center mb-8">
            <Button
                onClick={onAddServiceClick}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
                <Plus className="w-3 h-3 mr-1" />
                Add Service
            </Button>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                <Input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 border-amber-300 focus:border-orange-500 focus:ring-orange-500"
                />
            </div>
        </div>
    );
};

export default ServiceControls;
