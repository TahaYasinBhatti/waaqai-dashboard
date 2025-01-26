import React from 'react';
import Select from 'react-select';

const DeviceDropdown = ({ devices, selectedDevice, onDeviceChange }) => {
  // Map devices to use value/label correctly
  const options = devices.map((device) => ({
    value: device.value,  // Use device.value instead of entire device object
    label: device.label   // Use device.label for display
  }));

  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: '#ccc',
      boxShadow: 'none',
      '&:hover': { borderColor: '#007BFF' },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#007BFF' : 'white',
      color: state.isSelected ? 'white' : 'black',
      '&:hover': { backgroundColor: '#E9F5FF', color: '#007BFF' },
    }),
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-semibold mb-2">Select Device</label>
      <Select
        value={options.find(option => option.value === selectedDevice)}
        onChange={(selectedOption) => onDeviceChange(selectedOption.value)}
        options={options}
        styles={customStyles}
        placeholder="Select a device..."
      />
    </div>
  );
};

export default DeviceDropdown;