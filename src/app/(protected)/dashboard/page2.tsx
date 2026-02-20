'use client';
import { useState, useEffect } from 'react';
import Services from '@/components/services';
import PriestServices from '@/components/Priestservice';
import Abishekam from '@/components/Abishekam';
import Donations from '@/components/donations';
import Pooja from '@/components/pooja';
import { Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function DashboardPage() {
    const [activeSection, setActiveSection] = useState('home');
    const [roleCond, setRoleCond] = useState(1);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('adminuser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setRoleCond(user.roleid);
        }
    }, []);

    const renderMainContent = () => {
        // Back button for mobile users when not on home
        const backButton = activeSection !== 'home' && (
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => setActiveSection('home')}
                sx={{ 
                    mb: 2, 
                    display: { xs: 'flex', md: 'none' }, 
                    color: '#1A3C34',
                    fontWeight: 600
                }}
            >
                Back to Menu
            </Button>
        );

        switch (activeSection) {
            case 'services':
                return (
                    <Box sx={{ p: { xs: 2, md: 0 } }}>
                        {backButton}
                        <Services />
                    </Box>
                );
            case 'Abhishekam':
                return (
                    <Box sx={{ p: { xs: 2, md: 0 } }}>
                        {backButton}
                        <Abishekam />
                    </Box>
                );
            case 'Pooja':
                return (
                    <Box sx={{ p: { xs: 2, md: 0 } }}>
                        {backButton}
                        <Pooja />
                    </Box>
                );
            case 'Donations':
                return (
                    <Box sx={{ p: { xs: 2, md: 0 } }}>
                        {backButton}
                        <Donations />
                    </Box>
                );
            case 'PriestServices':
                return (
                    <Box sx={{ p: { xs: 2, md: 0 } }}>
                        {backButton}
                        <PriestServices />
                    </Box>
                );
            case 'home':
            default:
                return (
                    <Box>
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Welcome to Services
                            </h1>
                            <p className="text-gray-600">
                                <span className="hidden md:inline">Select a service from the cards below to get started.</span>
                                <span className="md:hidden">Select a service below to get started.</span>
                            </p>
                        </div>
                        
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
                            gap: 3,
                            mt: 4
                        }}>
                            <ServiceCard 
                                icon="❤️" 
                                title="All Services" 
                                description="Browse all available services"
                                onClick={() => setActiveSection('services')} 
                            />
                            <ServiceCard 
                                icon="🌸" 
                                title="Pooja" 
                                description="Traditional worship services"
                                onClick={() => setActiveSection('Pooja')} 
                            />
                            <ServiceCard 
                                icon="🔥" 
                                title="Abhishekam" 
                                description="Sacred ritual offerings"
                                onClick={() => setActiveSection('Abhishekam')} 
                            />
                            <ServiceCard 
                                icon="💐" 
                                title="Priest Services" 
                                description="Book priest for ceremonies"
                                onClick={() => setActiveSection('PriestServices')} 
                            />
                            <ServiceCard 
                                icon="💝" 
                                title="Donations" 
                                description="Support temple activities"
                                onClick={() => setActiveSection('Donations')} 
                            />
                        </Box>
                    </Box>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white rounded-lg shadow-sm p-6">
                {renderMainContent()}
            </div>
        </div>
    );
}

// Reusable Service Card Component with improved styling
function ServiceCard({ 
    icon, 
    title, 
    description,
    onClick 
}: { 
    icon: string; 
    title: string; 
    description: string;
    onClick: () => void 
}) {
    return (
        <div 
            onClick={onClick}
            className="group cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
        >
            <div className="text-4xl mb-3">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-amber-900 transition-colors">
                {title}
            </h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    );
}