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

  // For temperature (°C), define color stops that skip purple/pink:
  // 1) #00BFFF (blueish)
  // 2) #00FF80 (greenish)
  // 3) #FFFF00 (yellow)
  // 4) #FF8000 (orange)
  // 5) #FF0000 (red)
  let dialColors = colors;
  let nrOfLevels = dialColors?.length || 3;
  let arcPadding = 0.02;

  if (unit === '°C') {
    dialColors = [
      '#00BFFF', // Blueish
      '#00FF80', // Greenish
      '#FFA500', // Orange
      '#FFFF00', // Yellow
      '#FF0000', // Red
    ];
    nrOfLevels = 200;  // Many small segments for smooth blending
    arcPadding = 0;    // No gap for a continuous arc
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <GaugeChart
        id="gauge-chart"
        nrOfLevels={nrOfLevels}
        percent={scaledValue}
        colors={dialColors || ['#00FF00', '#FFBF00', '#FF0000']}
        arcWidth={0.3}
        arcPadding={arcPadding}
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
