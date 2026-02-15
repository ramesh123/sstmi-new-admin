import { Home, Heart, Flower2Icon } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
    onNavigate: (section: string) => void;
}

const menuItems = [
    {
        title: "Home",
        section: "home",
        icon: Home,
    },
    {
        title: "All Services",
        section: "services",
        icon: Heart,
    },
    {
        title: "Pooja",
        section: "Pooja",
        icon: Flower2Icon,
    },
    {
        title: "Abhishekam",
        section: "Abhishekam",
        image: "🔥"
    },

    {
        title: "Priest Services",
        section: "PriestServices",
        icon: Flower2Icon,
    },
    {
        title: "Donations",
        section: "Donations",
        icon: Heart,
    },
];

export function AppSidebar({ onNavigate }: AppSidebarProps) {
    return (
        <aside
            className="sidebar-class-names"
            style={{ marginTop: 84 }} // Adjust this value to match your header height
        >
            <Sidebar>
                <SidebarHeader className="border-b border-amber-200">
                    <div className="flex items-center space-x-2 p-4">
                      
                        <span className="font-bold text-amber-800"></span>
                    </div>
                </SidebarHeader>
                <SidebarContent className="bg-gradient-to-b from-orange-50 to-amber-50">
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-amber-700"></SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {menuItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            onClick={() => onNavigate(item.section)}
                                            className="text-amber-700 hover:bg-amber-100 hover:text-orange-600"
                                        >
                                            
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                </SidebarContent>
            </Sidebar>
        </aside>
    );
}
