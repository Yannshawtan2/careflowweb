"use client"
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
}

interface HealthRecord {
  id: string;
  residentId: string;
  condition: string;
  notes?: string;
}

const DashboardPage: React.FC = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch inventory data
                const inventorySnapshot = await getDocs(collection(db, 'inventory'));
                const inventoryData = inventorySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as InventoryItem[];

                // Fetch health records
                const healthSnapshot = await getDocs(collection(db, 'healthRecords'));
                const healthData = healthSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as HealthRecord[];

                setInventory(inventoryData);
                setHealthRecords(healthData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <h1>Admin Dashboard</h1>
            </header>
            <main className="dashboard-content">
                <section className="inventory-management">
                    <h2>Inventory Management</h2>
                    <p>Manage and track inventory for the nursing home.</p>
                    <div className="inventory-list">
                        {inventory.map((item) => (
                            <div key={item.id} className="inventory-item">
                                <h3>{item.name}</h3>
                                <p>Quantity: {item.quantity}</p>
                                <p>Category: {item.category}</p>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => alert('Navigate to Inventory Management')}>
                        Go to Inventory Management
                    </button>
                </section>
                <section className="health-updates">
                    <h2>Health Updates</h2>
                    <p>Update and monitor health records for residents.</p>
                    <div className="health-records">
                        {healthRecords.map((record) => (
                            <div key={record.id} className="health-record">
                                <h3>Resident ID: {record.residentId}</h3>
                                <p>Condition: {record.condition}</p>
                                {record.notes && <p>Notes: {record.notes}</p>}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => alert('Navigate to Health Updates')}>
                        Go to Health Updates
                    </button>
                </section>
            </main>
            <style jsx>{`
                .dashboard-page {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                }
                .dashboard-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .dashboard-content {
                    display: flex;
                    justify-content: space-around;
                }
                section {
                    border: 1px solid #ccc;
                    padding: 20px;
                    border-radius: 8px;
                    width: 45%;
                    text-align: center;
                }
                button {
                    margin-top: 10px;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: #0056b3;
                }
                .inventory-list, .health-records {
                    margin: 20px 0;
                    text-align: left;
                }
                .inventory-item, .health-record {
                    border: 1px solid #eee;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default DashboardPage;