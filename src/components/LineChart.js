import React from 'react';
import {
  LineChart as RechartLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const LineChart = ({ data }) => {
  return (
    <div className="p-4 shadow-md rounded-lg bg-white">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">PM 2.5 Levels</h2>
      <ResponsiveContainer width="100%" height={300}>
        <RechartLineChart data={data}>
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis
            dataKey="date"
            /* Changed to display short date (e.g. "Sep 12") instead of just time */
            tickFormatter={(time) =>
              new Date(time).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            }
          />
          <YAxis />
          <Tooltip
            /* Changed to display full date/time (e.g. "Sep 12, 2025, 3:45 PM") in tooltip */
            labelFormatter={(time) =>
              new Date(time).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#ff7300"
            strokeWidth={2}
            dot={false} // Remove data point dots
            activeDot={{ r: 6 }} // Show dot on hover only
          />
        </RechartLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
