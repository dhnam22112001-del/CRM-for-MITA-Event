import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { Customer } from "../types";
import { cn } from "../lib/utils";

interface CustomerFormProps {
  customer?: Customer | null;
  onSave: (data: Partial<Customer>) => Promise<void>;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ 
  customer, 
  onSave, 
  onClose 
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    full_name: "",
    phone: "",
    email: "",
    company: "",
    position: "",
    status: "new",
    notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        full_name: customer.full_name,
        phone: customer.phone,
        email: customer.email || "",
        company: customer.company || "",
        position: customer.position || "",
        status: customer.status,
        notes: customer.notes || "",
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) {
      setError("Full Name is required");
      return;
    }
    if (!formData.phone) {
      setError("Phone Number is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");
      console.log('[FRONTEND] Submitting customer data:', formData);
      await onSave(formData);
      setSuccess("Customer saved successfully");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('[FRONTEND ERROR] Save failed:', err);
      setError(err.message || "Failed to save customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl border border-[#e5e5e5] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#fafafa]">
          <h2 className="text-sm font-semibold tracking-tight">
            {customer ? "Edit Customer" : "New Customer"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-100 rounded flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-wider">
              <span className="w-3.5 h-3.5 flex items-center justify-center bg-green-500 text-white rounded-full text-[8px]">✓</span>
              <p>{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name *</label>
              <input 
                type="text" 
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Sarah Jenkins"
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded text-xs focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number *</label>
              <input 
                type="tel" 
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded text-xs focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="sarah.j@techflow.io"
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded text-xs focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company</label>
              <input 
                type="text" 
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="TechFlow Systems"
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded text-xs focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Position</label>
              <input 
                type="text" 
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Lead Engineer"
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded text-xs focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded text-xs focus:ring-1 focus:ring-black outline-none appearance-none"
              >
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</label>
              <textarea 
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Relationship history..."
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded text-xs focus:ring-1 focus:ring-black outline-none transition-all resize-none"
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-[#e5e5e5] flex items-center justify-end gap-3 bg-[#fafafa]">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              "flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-xs font-medium hover:bg-gray-800 transition-all",
              isSubmitting && "opacity-70 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            {customer ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
