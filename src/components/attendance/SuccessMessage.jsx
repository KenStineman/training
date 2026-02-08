import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import config from '../../config';

export function SuccessMessage({
  course,
  day,
  attendeeName,
  isLastDay = false,
}) {
  return (
    <div className="text-center py-8 animate-fade-in">
      {/* Success Icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 
                      flex items-center justify-center">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Message */}
      <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2">
        Attendance Recorded!
      </h2>
      
      <p className="text-gray-600 mb-6">
        Thank you, <span className="font-medium">{attendeeName}</span>!
        <br />
        Your attendance for <span className="font-medium">Day {day.day_number}</span> has been recorded.
      </p>

      {/* Next Steps */}
      {isLastDay ? (
        <div className="bg-helix-light rounded-lg p-6 text-left max-w-md mx-auto">
          <h3 className="font-medium text-helix-primary mb-2">
            🎉 Congratulations!
          </h3>
          <p className="text-sm text-gray-600">
            You've completed the final day of <strong>{course.name}</strong>. 
            Your certificate will be sent to your email address shortly.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
          <h3 className="font-medium text-gray-900 mb-2">
            See you tomorrow!
          </h3>
          <p className="text-sm text-gray-600">
            Don't forget to check in again tomorrow for Day {day.day_number + 1}.
          </p>
        </div>
      )}

      {/* Links */}
      <div className="mt-8 space-y-3">
        <a
          href={config.companyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-helix-primary hover:underline"
        >
          Visit {config.companyName} →
        </a>
      </div>
    </div>
  );
}

export default SuccessMessage;
