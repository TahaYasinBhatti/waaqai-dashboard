// src/data/users.js
export const users = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      devices: Array.from({ length: 20 }, (_, i) => `Device ${i + 1}`), // All devices
    },
    {
      username: 'user1',
      password: 'user123',
      role: 'user',
      devices: ['Device 1', 'Device 11'], // Only 2 devices
    },
    {
      username: 'user2',
      password: 'user123',
      role: 'user',
      devices: ['Device 2', 'Device 12'], // Only 2 devices
    },
    {
        username: 'user3',
        password: 'user123',
        role: 'user',
        devices: ['Device 3', 'Device 13'], // Only 2 devices
      },
      {
        username: 'user4',
        password: 'user123',
        role: 'user',
        devices: ['Device 4', 'Device 14'], // Only 2 devices
      },
      {
        username: 'user5',
        password: 'user123',
        role: 'user',
        devices: ['Device 5', 'Device 15'], // Only 2 devices
      },
      {
        username: 'user6',
        password: 'user123',
        role: 'user',
        devices: ['Device 6', 'Device 16'], // Only 2 devices
      },
      {
        username: 'user7',
        password: 'user123',
        role: 'user',
        devices: ['Device 7', 'Device 17'], // Only 2 devices
      },

      {
        username: 'user8',
        password: 'user123',
        role: 'user',
        devices: ['Device 8', 'Device 18'], // Only 2 devices
      },
      {
        username: 'user9',
        password: 'user123',
        role: 'user',
        devices: ['Device 9', 'Device 19'], // Only 2 devices
      },
      {
        username: 'user10',
        password: 'user123',
        role: 'user',
        devices: ['Device 10', 'Device 20'], // Only 2 devices
      },
    // Add more users as needed...
  ];