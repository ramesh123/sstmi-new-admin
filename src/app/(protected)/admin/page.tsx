'use client';
import { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import nextDynamic from 'next/dynamic';
import Services from '@/components/services';
import PriestServices from '@/components/Priestservice';
import Abishekam from '@/components/Abishekam';
import Donations from '@/components/donations';
import Pooja from '@/components/pooja';
import 'react-toastify/dist/ReactToastify.css';

// Dynamically import components with SSR disabled
const Transactions = nextDynamic(() => import('@/components/Transactions'), { ssr: false });
const EditTransactions = nextDynamic(() => import('@/components/Edit-Transactions'), { ssr: false });
const DevoteeTypeahead = nextDynamic(() => import('@/components/DevoteeTypeahead'), { ssr: false });
const SingleTaxLetter = nextDynamic(() => import('@/components/SingleTaxLetter'), { ssr: false });
const BackendUtilities = nextDynamic(() => import('@/components/BackendUtilities'), { ssr: false });
const WebsiteMediaUpdate = nextDynamic(() => import('@/components/WebsiteMediaUpdate'), { ssr: false });

export const dynamic = 'force-dynamic';

interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function AdminPage() {
    const [roleCond, setRoleCond] = useState(1);
    const [currentTab, setCurrentTab] = useState(0);
    const [selectedDevotee, setSelectedDevotee] = useState<{
        Name: string;
        Email: string;
    } | null>(null);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
        setSelectedDevotee(null);
    };

    const handleDevoteeSelect = (devotee: {
        Name: string;
        Email: string;
        PhoneNumber: string;
        Address: string;
    }) => {
        setSelectedDevotee({
            Name: devotee.Name,
            Email: devotee.Email
        });
    };

    const handleNewDevotee = (name: string) => {
        console.log('New devotee name:', name);
    };

    useEffect(() => {
        const storedUser = sessionStorage.getItem('adminuser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setRoleCond(user.roleid);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={currentTab}
                                onChange={handleTabChange}
                                aria-label="admin tabs"
                                variant="scrollable"
                                scrollButtons="auto"
                                allowScrollButtonsMobile
                                sx={{
                                    '& .MuiTab-root': {
                                        minWidth: 120,
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        '@media (min-width: 600px)': {
                                            minWidth: 160
                                        }
                                    }
                                }}
                            >
                                {(roleCond === 1 || roleCond === 2) && <Tab label="Find Devotee" />}
                                {(roleCond === 1 || roleCond === 2) && <Tab label="Transactions" />}
                                {(roleCond === 1) && <Tab label="Tax Letters" />}
                                {(roleCond === 1) && <Tab label="Edit Transactions" />}
                                {(roleCond === 1) && <Tab label="Backend Utilities" />}
                                {(roleCond === 1) && <Tab label="Website Media" />}
                            </Tabs>
                        </Box>

                        {(roleCond === 1 || roleCond === 2) && <TabPanel value={currentTab} index={0}>
                            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1f2937' }}>
                                    Search Devotee
                                </Typography>
                                <DevoteeTypeahead
                                    onSelect={handleDevoteeSelect}
                                    onNewName={handleNewDevotee}
                                    className="mb-8"
                                />
                            </Box>
                        </TabPanel>}

                        {(roleCond === 1 || roleCond === 2) && <TabPanel value={currentTab} index={1}>
                            <Transactions />
                        </TabPanel>}

                        {(roleCond === 1) && <TabPanel value={currentTab} index={2}>
                            <SingleTaxLetter />
                        </TabPanel>}

                        {(roleCond === 1) && <TabPanel value={currentTab} index={3}>
                            <EditTransactions />
                        </TabPanel>}

                        {(roleCond === 1) && <TabPanel value={currentTab} index={4}>
                            <BackendUtilities />
                        </TabPanel>}

                        {(roleCond === 1) && <TabPanel value={currentTab} index={5}>
                            <WebsiteMediaUpdate />
                        </TabPanel>}
                    </Box>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
}

export default AdminPage;   