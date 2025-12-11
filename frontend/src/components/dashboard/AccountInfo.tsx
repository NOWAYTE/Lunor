import React from 'react';
import { RefreshCcw, MoreVertical, LayoutGrid } from 'lucide-react';

// --- Type Definitions ---

interface TabProps {
  name: string;
  isActive: boolean;
  icon: React.ReactNode; 
}

// --- Component Definitions ---

const Tab: React.FC<TabProps> = ({ name, isActive, icon }) => {
    const activeClass = isActive 
        ? 'text-white border-blue-500 font-medium' 
        : 'text-gray-400 border-transparent hover:text-white transition';

    return (
        <a href="#" className={`flex items-center space-x-2 pb-3 border-b-2 ${activeClass}`}>
            {icon}
            <span className="text-sm">{name}</span>
        </a>
    );
};

const AccountInfo: React.FC = () => {
  const darkBg = 'bg-[#1e2025]'; 
  const accentGreen = 'text-[#50c878]'; 

  return (
    <header className={`p-4 text-white`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Main Account • Bybit</div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-semibold">$18,536.43</span>
              <span className="text-sm text-gray-400">0.84253 BTC</span>
            </div>
          </div>
        </div>

        {/* Right Section: Last Update and Action Buttons */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">Last update: 45 mins ago</div>
          
          <button className={`p-2 rounded-full border border-gray-700 hover:bg-gray-700 transition ${accentGreen}`}>
            <RefreshCcw className="w-5 h-5" />
          </button>

          <button className="p-1 text-gray-400 hover:text-white transition">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* --- Tabbed Navigation Area --- */}
      <nav className="mt-4 flex space-x-6 border-b border-gray-700/50">
        <Tab isActive={true} name="Summary" icon={<LayoutGrid className="w-4 h-4" />} />
        <Tab isActive={false} name="Performance" icon={<span className="text-lg">📈</span>} />
        <Tab isActive={false} name="Analytics" icon={<span className="text-lg">📑</span>} />
        <Tab isActive={false} name="Reporting" icon={<span className="text-lg">📋</span>} />
      </nav>
    </header>
  );
};

export default AccountInfo;