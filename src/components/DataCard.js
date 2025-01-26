import React from 'react';

const DataCard = ({ title, color, icon, children }) => {
  return (
    <div className="p-6 rounded-xl shadow-md bg-white border border-gray-200 flex flex-col items-center space-y-4">
      {/* Icon */}
      <div className={`text-4xl ${color}`}>{icon}</div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>

      {/* Content (Dial or Text) */}
      <div className="flex items-center justify-center">{children}</div>
    </div>
  );
};

export default DataCard;
