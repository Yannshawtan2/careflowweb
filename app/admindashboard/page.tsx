"use client"
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch users data
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersData = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as User[];

                // Fetch staff data
                const staffSnapshot = await getDocs(collection(db, 'staff'));
                const staffData = staffSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as StaffMember[];

                setUsers(usersData);
                setStaff(staffData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">User Management</h2>
                    <div className="space-y-4">
                        {/* {users.map((user) => (
                            <div key={user.id} className="border rounded p-4">
                                <p className="font-medium">{user.email}</p>
                                <p className="text-sm text-gray-600">Role: {user.role}</p>
                            </div>
                        ))} */}
                    </div>
                    <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Manage Users
                    </button>
                </section>

                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Staff Management</h2>
                    <div className="space-y-4">
                        {/* {staff.map((member) => (
                            <div key={member.id} className="border rounded p-4">
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-gray-600">{member.position}</p>
                            </div>
                        ))} */}
                    </div>
                    <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Manage Staff
                    </button>
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard; 