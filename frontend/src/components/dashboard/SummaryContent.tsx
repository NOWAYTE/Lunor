import React from 'react';

const SummaryContent: React.FC = () => {
  return (
    <div className="p-6">
      {/* Summary Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-1">Summary</h2>
        <p className="text-sm text-gray-400">
          A quick summary of your entire account on Bybit and current positions
        </p>
      </div>

      {/* Main Content Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Donut Chart Area (Takes 1/3 of the space on md screens) */}
        <div className="col-span-1">
          {/* Placeholder for the Donut Chart component */}
          <div className="h-64 rounded-lg flex items-center justify-center">
            {/* We will build this next! */}
            <p className="text-gray-500">Donut Chart Component Placeholder</p>
          </div>
        </div>

        {/* Column 2 & 3: Metric Cards Area (Takes 2/3 of the space on md screens) */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          
          {/* Top row of Metric Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 1: Total Deposits */}
            <div className="h-28 bg-[#25282f] rounded-lg shadow-md flex items-center justify-center">
              <p className="text-gray-400">Total Deposits Card</p>
            </div>
            
            {/* Card 2: Total Withdrawals */}
            <div className="h-28 bg-[#25282f] rounded-lg shadow-md flex items-center justify-center">
              <p className="text-gray-400">Total Withdrawals Card</p>
            </div>
          </div>
          
          {/* Bottom row: Overall PNL Card (Full width under the top two) */}
          <div className="h-28 bg-[#25282f] rounded-lg shadow-md flex items-center justify-center">
             <p className="text-gray-400">Overall PNL Card</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SummaryContent;