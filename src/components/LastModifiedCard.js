import React from 'react';
import { format } from 'date-fns';
import { FaClock } from 'react-icons/fa';

const LastModifiedCard = ({ lastModified }) => {
  const formattedDate = format(new Date(lastModified), "eeee, MMMM d, yyyy h:mm:ss a");

  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center">
      <FaClock className="text-gray-500 text-3xl mb-2" />
      <h3 className="text-gray-700 font-semibold text-lg">Last Modified</h3>
      <p className="mt-2 text-gray-600 text-sm text-center">{formattedDate}</p>
    </div>
  );
};

export default LastModifiedCard;
