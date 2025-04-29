import React from 'react';

const AppointmentStatusBadge = ({ status }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let statusText = status;

  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'scheduled':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      statusText = 'Confirmed';
      break;
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      statusText = 'Pending';
      break;
    case 'pending_reschedule':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-800';
      statusText = 'Awaiting Approval';
      break;
    case 'cancelled':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      statusText = 'Cancelled';
      break;
    case 'completed':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      statusText = 'Completed';
      break;
    case 'rescheduled':
      bgColor = 'bg-indigo-100';
      textColor = 'text-indigo-800';
      statusText = 'Rescheduled';
      break;
    case 'missed':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      statusText = 'Missed';
      break;
    default:
      statusText = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  }

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
      {statusText}
    </span>
  );
};

export default AppointmentStatusBadge;