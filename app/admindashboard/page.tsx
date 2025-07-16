"use client"
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryAlerts } from '@/components/inventory-alerts';
import { IncompleteSubscriptions } from '@/components/incomplete-subscriptions';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AlertCircle, Building, DollarSign, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { billingService } from '@/lib/services/billing-service';
import type { BillingSubscription } from '@/lib/types';
import type { InventoryItem } from '@/lib/types';

interface User {
  id: string;
  email: string;
  role: string;
}

interface StaffMember {
  id: string;
  name: string;
  position: string;
}

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [subscriptions, setSubscriptions] = useState<BillingSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [authMessage, setAuthMessage] = useState<string | null>(null);

    useEffect(() => {
        console.log("Admin Dashboard mounting");
        
        const checkAuth = () => {
            console.log("Checking authentication on admin dashboard");
            
            // Always clear redirect flags
            sessionStorage.removeItem('redirectAttempt');
            sessionStorage.removeItem('redirectTimestamp');

            const token = sessionStorage.getItem('token');
            const userRole = sessionStorage.getItem('userRole');
            
            console.log("Admin dashboard auth check:", { hasToken: !!token, role: userRole });
            
            if (!token) {
                console.log('No token found, authentication failed');
                setAuthMessage("You need to log in to access this page.");
                return false;
            }
            
            if (userRole !== 'admin') {
                console.log('User is not an admin, access denied');
                setAuthMessage("You don't have permission to access this page.");
                return false;
            }

            console.log('Authentication successful:', { role: userRole });
            return true;
        };

        const init = async () => {
            try {
                const isAuth = checkAuth();
                if (!isAuth) {
                    setLoading(false);
                    return;
                }

                setAuthenticated(true);
                console.log('Fetching dashboard data...');

                // Fetch users data
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersData = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as User[];
                console.log('Users data fetched:', usersData.length);

                // Fetch staff data
                const staffSnapshot = await getDocs(collection(db, 'staff'));
                const staffData = staffSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as StaffMember[];
                console.log('Staff data fetched:', staffData.length);

                // Fetch inventory data
                const inventoryResponse = await fetch('/api/inventory');
                const inventoryData = await inventoryResponse.json();
                const inventoryItemsData = inventoryData.success ? inventoryData.items : [];
                console.log('Inventory data fetched:', inventoryItemsData.length);

                // Fetch subscriptions data
                const subscriptionsData = await billingService.getSubscriptions();
                console.log('Subscriptions data fetched:', subscriptionsData.length);

                setUsers(usersData);
                setStaff(staffData);
                setInventoryItems(inventoryItemsData);
                setSubscriptions(subscriptionsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setAuthMessage("Error loading dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        // Execute initialization
        init();
        
        // Return cleanup function
        return () => {
            console.log("Admin Dashboard unmounting");
        };
    }, []);

    const goToLogin = () => {
        console.log("Redirecting to login");
        window.location.href = "/login";
    };

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
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="mb-4">{authMessage || "Authentication error"}</p>
                    <button 
                        onClick={goToLogin}
                        className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full bg-[#FFFDF6]">
          <AdminSidebar />
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
              <div className="w-full">
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
          </div>
        </div>
    );
};

export default AdminDashboard; 