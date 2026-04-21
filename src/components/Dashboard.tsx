import React from "react";
import { motion } from "motion/react";
import { 
  Users, 
  TrendingUp, 
  UserCheck, 
  UserX 
} from "lucide-react";
import { CustomerStats } from "../types";
import { cn } from "../lib/utils";

interface DashboardProps {
  stats: CustomerStats | null;
  onNavigate: (tab: string) => void;
  onAdd: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onNavigate, onAdd }) => {
  const cards = [
    { 
      label: "New Leads", 
      value: stats?.new ?? 0, 
      trend: "+12%",
      trendColor: "text-green-500"
    },
    { 
      label: "Active Deals", 
      value: stats?.total ?? 0, 
      trend: "Stable",
      trendColor: "text-blue-500"
    },
    { 
      label: "Converted", 
      value: stats?.converted ?? 0, 
      trend: "Fast",
      trendColor: "text-emerald-500"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="text-black font-medium">Dashboard</span>
          <span className="px-1">/</span>
          <span className="hover:text-black cursor-pointer">Overview</span>
        </div>
        <button 
          onClick={onAdd}
          className="bg-black text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded hover:bg-gray-800 transition-colors"
        >
          Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-5 rounded-lg border border-[#e5e5e5] shadow-sm flex flex-col justify-between"
            onClick={() => onNavigate("customers")}
          >
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{card.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold">{card.value}</span>
              <span className={cn("text-[10px] font-medium mb-1", card.trendColor)}>{card.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden shadow-sm flex flex-col h-80">
        <div className="px-6 py-4 border-b border-[#e5e5e5] bg-[#fafafa] flex justify-between items-center">
          <h3 className="text-sm font-semibold tracking-tight">Acquisition Pipeline</h3>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 bg-[#fdfdfd]">
          <div className="w-full h-full border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
            <div className="flex gap-3 items-end h-32">
              <div className="w-8 bg-gray-100 rounded-t h-[30%]"></div>
              <div className="w-8 bg-gray-200 rounded-t h-[50%]"></div>
              <div className="w-8 bg-gray-100 rounded-t h-[80%]"></div>
              <div className="w-8 bg-black rounded-t h-[60%]"></div>
              <div className="w-8 bg-gray-200 rounded-t h-[90%]"></div>
              <div className="w-8 bg-gray-100 rounded-t h-[40%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
