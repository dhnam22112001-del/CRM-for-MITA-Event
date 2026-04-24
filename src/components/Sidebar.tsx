import React from "react";
import { 
  Users, 
  LayoutDashboard, 
  FileUp, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "customers", icon: Users, label: "Customers" },
  ];

  return (
    <aside className="w-60 border-r border-[#e5e5e5] bg-[#ffffff] flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
          <div className="w-2 h-2 bg-white rotate-45"></div>
        </div>
        <span className="font-semibold tracking-tight text-sm">Nexus CRM</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
              activeTab === item.id 
                ? "text-black bg-gray-100 font-medium" 
                : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4",
              activeTab === item.id ? "text-black" : "text-gray-400"
            )} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#e5e5e5] items-center flex gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-[10px] font-bold">JD</div>
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-semibold truncate">John Doe</p>
          <p className="text-[10px] text-gray-500 truncate">Senior Admin</p>
        </div>
        <LogOut className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 cursor-pointer" />
      </div>
    </aside>
  );
};

export default Sidebar;
