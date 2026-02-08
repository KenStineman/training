import React from 'react';
import { Badge } from '../ui';
import { formatDateTime, percentage } from '../../utils/helpers';

export function AttendanceTable({
  attendees = [],
  days = [],
  course,
}) {
  const getAttendanceStatus = (attendee) => {
    const attended = attendee.days_attended || 0;
    const total = course.num_days;
    const pct = percentage(attended, total);
    
    if (attended === total) {
      return { label: 'Complete', variant: 'success' };
    } else if (pct >= 50) {
      return { label: `${attended}/${total} days`, variant: 'warning' };
    } else if (attended > 0) {
      return { label: `${attended}/${total} days`, variant: 'danger' };
    }
    return { label: 'No attendance', variant: 'default' };
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Attendee
            </th>
            {days.map((day) => (
              <th
                key={day.day_number}
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Day {day.day_number}
              </th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {attendees.length === 0 ? (
            <tr>
              <td
                colSpan={days.length + 2}
                className="px-4 py-8 text-center text-gray-500"
              >
                No attendance records yet.
              </td>
            </tr>
          ) : (
            attendees.map((attendee) => {
              const status = getAttendanceStatus(attendee);
              return (
                <tr key={attendee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {attendee.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attendee.email}
                      </div>
                      {attendee.organization && (
                        <div className="text-xs text-gray-400">
                          {attendee.organization}
                        </div>
                      )}
                    </div>
                  </td>
                  {days.map((day) => {
                    const attendance = attendee.attendance?.find(
                      (a) => a.day_number === day.day_number
                    );
                    return (
                      <td
                        key={day.day_number}
                        className="px-4 py-3 text-center"
                      >
                        {attendance ? (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 
                                       rounded-full bg-green-100 text-green-600"
                            title={formatDateTime(attendance.checked_in_at)}
                          >
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 
                                          rounded-full bg-gray-100 text-gray-400">
                            –
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AttendanceTable;
