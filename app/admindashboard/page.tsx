"use client"
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryAlerts } from '@/components/inventory-alerts';
import { IncompleteSubscriptions } from '@/components/incomplete-subscriptions';
import { AlertCircle, Building, DollarSign, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { billingService } from '@/lib/services/billing-service';
import type { BillingSubscription } from '@/lib/types';
import type { InventoryItem } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';

interface User {
  id: string;
  email: string;
  role: string;
}

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [subscriptions, setSubscriptions] = useState<BillingSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching dashboard data...');

                // Fetch users data
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersData = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as User[];

                // Fetch inventory data
                const inventoryResponse = await fetch('/api/inventory');
                const inventoryData = await inventoryResponse.json();
                const inventoryItemsData = inventoryData.success ? inventoryData.items : [];

                // Fetch subscriptions data
                const subscriptionsData = await billingService.getSubscriptions();

                setUsers(usersData);
                setInventoryItems(inventoryItemsData);
                setSubscriptions(subscriptionsData);
                
                console.log('Dashboard data loaded successfully');
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate dashboard metrics
    const totalResidences = users.filter(user => user.role === 'guardian').length;
    const totalStaff = users.filter(user => user.role === 'staff').length;
    const inventoryAlerts = inventoryItems.filter(item => item.quantity <= item.minimumQuantity).length;
    const incompleteSubscriptions = subscriptions.filter(sub => sub.status === 'incomplete').length;
    const totalIncompleteAmount = subscriptions
        .filter(sub => sub.status === 'incomplete')
        .reduce((sum, sub) => sum + sub.amount, 0);

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Loading dashboard data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full flex items-center justify-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name || user?.email}</p>
            </div>
            
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-[#FAF6E9] border border-[#DDEB9D] flex justify-center">
                    <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-[#DDEB9D] data-[state=active]:text-black"
                    >
                        Overview
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-8">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-[#FAF6E9] border-[#DDEB9D] w-full ">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Residences</CardTitle>
                                <Building className="h-4 w-4 text-[#A0C878]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalResidences}</div>
                                <p className="text-xs text-muted-foreground">Active guardian accounts</p>
                                <div className="mt-4">
                                    <Progress value={Math.min((totalResidences / 200) * 100, 100)} className="h-2 bg-[#FFFDF6] [&>div]:bg-[#A0C878]" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#FAF6E9] border-[#DDEB9D] w-full ">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                                <Users className="h-4 w-4 text-[#A0C878]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalStaff}</div>
                                <p className="text-xs text-muted-foreground">Active staff accounts</p>
                                <div className="mt-4">
                                    <Progress value={Math.min((totalStaff / 50) * 100, 100)} className="h-2 bg-[#FFFDF6] [&>div]:bg-[#A0C878]" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#FAF6E9] border-[#DDEB9D] w-full ">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
                                <AlertCircle className="h-4 w-4 text-[#A0C878]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{inventoryAlerts}</div>
                                <p className="text-xs text-muted-foreground">Items need restocking</p>
                                <div className="mt-4">
                                    <Progress value={Math.min((inventoryAlerts / 20) * 100, 100)} className="h-2 bg-[#FFFDF6] [&>div]:bg-[#A0C878]" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#FAF6E9] border-[#DDEB9D] w-full ">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Incomplete Subscriptions</CardTitle>
                                <DollarSign className="h-4 w-4 text-[#A0C878]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalIncompleteAmount.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">{incompleteSubscriptions} pending payments</p>
                                <div className="mt-4">
                                    <Progress value={Math.min((incompleteSubscriptions / 10) * 100, 100)} className="h-2 bg-[#FFFDF6] [&>div]:bg-[#A0C878]" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4 bg-[#FAF6E9] border-[#DDEB9D] w-full ">
                            <CardHeader>
                                <CardTitle>Inventory Restock Alerts</CardTitle>
                                <CardDescription>Items that need to be restocked soon</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <InventoryAlerts />
                            </CardContent>
                        </Card>
                        <Card className="col-span-3 bg-[#FAF6E9] border-[#DDEB9D] w-full ">
                            <CardHeader>
                                <CardTitle>Incomplete Subscriptions</CardTitle>
                                <CardDescription>Subscriptions with pending payments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <IncompleteSubscriptions />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDashboard; 