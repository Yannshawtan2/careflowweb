"use client"
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Activity, AlertTriangle, Users, Calendar, TrendingUp } from "lucide-react"
import Link from 'next/link';
import type { Patient, HealthRecord } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/useAuth';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                // Fetch patients from the patients collection
                const patientsSnapshot = await getDocs(collection(db, 'patients'));
                const patientsData = patientsSnapshot.docs
                    .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                    } as any)) as Patient[];

                // Fetch health records
                const healthSnapshot = await getDocs(collection(db, 'healthRecords'));
                const healthData = healthSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as HealthRecord[];

                setPatients(patientsData);
                setHealthRecords(healthData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getRecentUpdates = () => {
        const today = new Date();
        return healthRecords.filter(hr => {
            if (!hr.lastUpdated) return false;
            const lastUpdate = new Date(hr.lastUpdated);
            const diffTime = Math.abs(today.getTime() - lastUpdate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 1;
        }).length;
    };

    const getHighCarePatients = () => {
        return patients.filter(p => p.careLevel === "high").length;
    };

    const getPatientsOnMedication = () => {
        return patients.filter(p => p.medications && p.medications.length > 0).length;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0C878] mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#A0C878]">Staff Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {user?.name || user?.email}! Here&apos;s an overview of your patients and care activities.</p>
                </div>
                <Link href="/staffdashboard/patients">
                    <Button className="bg-[#A0C878] hover:bg-[#8AB868] text-white">
                        <Heart className="mr-2 h-4 w-4" />
                        Manage Patients
                    </Button>
                </Link>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                        <Heart className="h-4 w-4 text-[#A0C878]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{patients.length}</div>
                        <p className="text-xs text-muted-foreground">Under your care</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Care Level</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{getHighCarePatients()}</div>
                        <p className="text-xs text-muted-foreground">Require special attention</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
                        <Activity className="h-4 w-4 text-[#A0C878]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getRecentUpdates()}</div>
                        <p className="text-xs text-muted-foreground">Updated today</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">On Medication</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{getPatientsOnMedication()}</div>
                        <p className="text-xs text-muted-foreground">Require medication management</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            Patient Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Access comprehensive patient health data, update vitals, and manage care plans.
                        </p>
                        <div className="flex gap-2">
                            <Link href="/staffdashboard/patients" className="flex-1">
                                <Button className="w-full bg-[#A0C878] hover:bg-[#8AB868] text-white">
                                    View Patients
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Health Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Access electronic health records and clinical documentation.
                        </p>
                        <div className="flex gap-2">
                            <Link href="/staffdashboard/EHR" className="flex-1">
                                <Button variant="outline" className="w-full border-[#DDEB9D] text-[#2E7D32] hover:bg-[#E8F5E9]">
                                    Access EHR
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-[#FAF6E9] border-[#DDEB9D]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {healthRecords && healthRecords.length > 0 ? (
                        <div className="space-y-3">
                            {healthRecords.slice(0, 5).map((record) => {
                                const lastUpdate = record.lastUpdated ? new Date(record.lastUpdated) : new Date();
                                return (
                                    <div key={record.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">Patient Health Update</p>
                                            <p className="text-sm text-muted-foreground">
                                                Last updated: {lastUpdate.toLocaleDateString()}
                                            </p>
                            </div>
                                        <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800">
                                            Updated
                                        </Badge>
                    </div>
                                );
                            })}
                            </div>
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No recent activity</p>
                            <p className="text-sm text-muted-foreground">Start by adding patients and updating their health records</p>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardPage;