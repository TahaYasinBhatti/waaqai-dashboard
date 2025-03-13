import React from 'react';
import PropTypes from 'prop-types';
import GaugeChart from 'react-gauge-chart';          // For °C
import ReactSpeedometer from 'react-d3-speedometer'; // For PM2.5 half-circle

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

  // ================== TEMPERATURE (°C) DIAL ==================
  if (unit === '°C') {
    const tempDialColors = [
      '#00BFFF', // Blueish
      '#00FF80', // Greenish
      '#FFA500', // Orange
      '#FFFF00', // Yellow
      '#FF0000', // Red
    ];

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <GaugeChart
          id="temp-dial"
          nrOfLevels={200}
          percent={scaledValue}
          colors={tempDialColors}
          arcWidth={0.3}
          arcPadding={0}
          needleColor="#757575"
          hideText
        />
        <p className="text-lg font-bold mt-2">
          {cappedValue.toFixed(1)}
          <span className="text-sm"> {unit}</span>
        </p>
      </div>
    );
  }

  // ================== PM2.5 (µg/m³) HALF-CIRCLE GAUGE ==================
  if (unit === 'µg/m³') {
    // WHO-based thresholds (slightly subdued)
    const getPm25Color = (val) => {
      if (val <= 5)   return '#3B82F6'; // Blue
      if (val <= 10)  return '#22C55E'; // Green
      if (val <= 15)  return '#FACC15'; // Yellow
      if (val <= 25)  return '#F97316'; // Orange
      if (val <= 35)  return '#EF4444'; // Red
      if (val <= 50)  return '#A855F7'; // Purple
      if (val <= 100) return '#D2B48C'; // Light Brown
      return '#6D4C41';                // Dark Brown
    };

    // Cap PM2.5 at 500
    const pm25Value = Math.min(value, 500);
    const pm25Color = getPm25Color(pm25Value);

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <ReactSpeedometer
          // Our gauge goes from 0 to 500
          minValue={0}
          maxValue={500}
          value={pm25Value}
          // Make it half-circle by setting angles
          startAngle={-90}
          endAngle={90}
          // Single segment for the entire arc
          segments={1}
          segmentColors={[pm25Color]}
          // Needle styling
          needleColor="#757575"
          needleHeightRatio={0.6}
          ringWidth={30}
          // Hide built-in text near needle
          currentValueText=""
          customValueText=""
          currentValueRenderer={() => null}
          // Also set text sizes to zero
          valueTextFontSize="0"
          labelFontSize="0"
          // Size to match your other dial
          width={200}
          height={120}
          needleTransitionDuration={400}
          needleTransition="easeQuadIn"
          textColor="#333"
        />
        <p className="text-lg font-bold mt-2">
          {pm25Value.toFixed(1)}
          <span className="text-sm"> {unit}</span>
        </p>
      </div>
    );
  }

  // ================== FALLBACK (e.g., HUMIDITY) ==================
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <GaugeChart
        id="fallback-dial"
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
