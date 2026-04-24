import React, { useState } from "react";
import { 
  MoreHorizontal, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Building2,
  Trash2,
  Edit2
} from "lucide-react";
import { Customer } from "../types";
import { cn, formatDate } from "../lib/utils";

interface CustomerTableProps {
  customers: Customer[];
  onAdd: () => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
  loading: boolean;
}

const statusStyles = {
  new: "bg-yellow-50 text-yellow-700 border-yellow-100",
  contacted: "bg-blue-50 text-blue-700 border-blue-100",
  converted: "bg-green-50 text-green-700 border-green-100",
  lost: "bg-gray-50 text-gray-600 border-gray-100",
};

const CustomerTable: React.FC<CustomerTableProps> = ({ 
  customers, 
  onAdd, 
  onEdit, 
  onDelete,
  loading 
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = customers.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) || 
                         c.company?.toLowerCase().includes(search.toLowerCase()) ||
                         c.phone?.includes(search);
    const matchesFilter = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="hover:text-black cursor-pointer">Customers</span>
          <span className="px-1">/</span>
          <span className="text-black font-medium">Active Contacts</span>
        </div>
        <button 
          onClick={onAdd}
          className="bg-black text-white text-xs px-3 py-1.5 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden shadow-sm flex flex-col">
        <div className="px-6 py-4 border-b border-[#e5e5e5] bg-[#fafafa] flex justify-between items-center gap-4">
          <div className="flex-1 max-w-sm">
            <input 
              type="text" 
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-white border border-[#e5e5e5] px-3 py-1.5 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-[#e5e5e5] px-2 py-1.5 rounded-md focus:outline-none"
            >
              <option value="all">Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
            <button className="px-2 py-1.5 bg-white border border-[#e5e5e5] rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Export</button>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#f9f9f9] text-[11px] uppercase tracking-wider text-gray-500 border-b border-[#e5e5e5] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Company</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Created</th>
                <th className="px-6 py-3 font-semibold">Notes</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#f0f0f0] bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 animate-pulse text-xs tracking-tight">Syncing database data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-xs tracking-tight">No records found.</td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#fafafa] transition-colors group">
                    <td className="px-6 py-3">
                      <div className="font-medium text-[#1a1a1a]">{customer.full_name}</div>
                      <div className="text-[10px] text-gray-400">{customer.email || "no-email@nexus.io"}</div>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                       <span className="text-xs">{customer.company || "Creative Hub"}</span>
                       <div className="text-[10px] text-gray-400">{customer.position || "Independent"}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-tight",
                        statusStyles[customer.status as keyof typeof statusStyles]
                      )}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs tabular-nums">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-3 text-gray-500 italic text-xs max-w-xs truncate">
                      {customer.notes || "-"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(customer)}
                          className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onDelete(customer.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-[#e5e5e5] bg-[#fafafa] flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
          <span>Showing {filtered.length} of {customers.length} results</span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-black">Previous</span>
            <span className="cursor-pointer hover:text-black">Next</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTable;
