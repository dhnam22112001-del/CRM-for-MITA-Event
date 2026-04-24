/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CustomerTable from "./components/CustomerTable";
import CustomerForm from "./components/CustomerForm";
import { Customer, CustomerStats } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersRes, statsRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/stats")
      ]);
      
      if (!customersRes.ok || !statsRes.ok) throw new Error("Failed to fetch data");
      
      const customersData = await customersRes.json();
      const statsData = await statsRes.json();
      
      setCustomers(customersData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCustomer = async (data: Partial<Customer>) => {
    const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
    const method = editingCustomer ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save customer");
      } else {
        const text = await response.text();
        console.error("Non-JSON error response:", text);
        throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}...`);
      }
    }

    await fetchData();
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const response = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await fetchData();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            stats={stats} 
            onNavigate={setActiveTab} 
            onAdd={() => {
              setActiveTab("customers");
              setShowForm(true);
            }} 
          />
        );
      case "customers":
        return (
          <CustomerTable 
            customers={customers} 
            loading={loading}
            onAdd={() => setShowForm(true)}
            onEdit={(customer) => {
              setEditingCustomer(customer);
              setShowForm(true);
            }}
            onDelete={handleDeleteCustomer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#fafafa]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {showForm && (
        <CustomerForm 
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
}
