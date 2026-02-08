import React, { useState } from 'react';
import { Button, Input } from '../ui';
import QuestionsEditor from './QuestionsEditor';
import { formatDateForInput } from '../../utils/helpers';

export function DaysEditor({
  days = [],
  onChange,
  numDays = 1,
}) {
  const [expandedDay, setExpandedDay] = useState(null);

  // Ensure we have entries for all days
  const ensureDays = () => {
    const existingDays = [...days];
    for (let i = 1; i <= numDays; i++) {
      if (!existingDays.find(d => d.day_number === i)) {
        existingDays.push({
          id: `new_${i}`,
          day_number: i,
          title: '',
          date: null,
          questions: [],
        });
      }
    }
    // Remove days that exceed numDays
    return existingDays
      .filter(d => d.day_number <= numDays)
      .sort((a, b) => a.day_number - b.day_number);
  };

  const sortedDays = ensureDays();

  const handleUpdate = (dayNumber, field, value) => {
    const updated = sortedDays.map(d => {
      if (d.day_number === dayNumber) {
        return { ...d, [field]: value };
      }
      return d;
    });
    onChange(updated);
  };

  const handleQuestionsChange = (dayNumber, questions) => {
    handleUpdate(dayNumber, 'questions', questions);
  };

  const toggleExpand = (dayNumber) => {
    setExpandedDay(expandedDay === dayNumber ? null : dayNumber);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Course Days & Survey Questions</h4>
      
      <div className="space-y-3">
        {sortedDays.map((day) => (
          <div
            key={day.day_number}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Day Header */}
            <div
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
              onClick={() => toggleExpand(day.day_number)}
            >
              <div className="flex items-center gap-4">
                <span className="font-medium text-helix-primary">
                  Day {day.day_number}
                </span>
                {day.title && (
                  <span className="text-gray-600">— {day.title}</span>
                )}
                {day.questions?.length > 0 && (
                  <span className="text-sm text-gray-400">
                    ({day.questions.length} question{day.questions.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <span className="text-gray-400">
                {expandedDay === day.day_number ? '▼' : '▶'}
              </span>
            </div>

            {/* Day Details */}
            {expandedDay === day.day_number && (
              <div className="p-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Day Title (Optional)"
                    value={day.title || ''}
                    onChange={(e) => handleUpdate(day.day_number, 'title', e.target.value)}
                    placeholder={`e.g., Day ${day.day_number}: Foundations`}
                  />
                  <Input
                    label="Date (Optional)"
                    type="date"
                    value={formatDateForInput(day.date)}
                    onChange={(e) => handleUpdate(day.day_number, 'date', e.target.value || null)}
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <QuestionsEditor
                    questions={day.questions || []}
                    onChange={(questions) => handleQuestionsChange(day.day_number, questions)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DaysEditor;
