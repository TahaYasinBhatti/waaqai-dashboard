import React from 'react';
import GaugeChart from 'react-gauge-chart';
import PropTypes from 'prop-types';

const Dial = ({ value, min, max, unit, colors }) => {
  // Handle N/A and invalid values
  if (typeof value !== 'number' || isNaN(value) || value === 'N/A') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-gray-500 text-lg">No Data</div>
        <p className="text-sm text-gray-400">{unit}</p>
      </div>
    );
  }

  // Ensure valid gauge parameters
  const safeMin = typeof min === 'number' ? min : 0;
  const safeMax = typeof max === 'number' ? max : 100;
  const cappedValue = Math.max(safeMin, Math.min(value, safeMax));
  const scaledValue = (cappedValue - safeMin) / (safeMax - safeMin);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <GaugeChart
        id="gauge-chart"
        nrOfLevels={colors?.length || 3}
        percent={scaledValue}
        colors={colors || ['#00FF00', '#FFBF00', '#FF0000']}
        arcWidth={0.3}
        arcPadding={0.02}
        needleColor="#757575"
        hideText
      />
      <p className="text-lg font-bold mt-2">
        {cappedValue.toFixed(1)}
        <span className="text-sm"> {unit}</span>
      </p>
    </div>
  );
};

Dial.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  min: PropTypes.number,
  max: PropTypes.number,
  unit: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.string),
};

Dial.defaultProps = {
  value: 'N/A',
  min: 0,
  max: 100,
  unit: '',
  colors: ['#00FF00', '#FFBF00', '#FF0000'],
};

export default Dial;