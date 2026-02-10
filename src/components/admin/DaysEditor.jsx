import React from 'react';
import { Input, Button } from '../ui';

export function DaysEditor({ days, onChange, numDays }) {
  // Ensure we have entries for all days
  const ensuredDays = Array.from({ length: numDays }, (_, i) => {
    const dayNum = i + 1;
    const existing = days.find(d => d.day_number === dayNum);
    return existing || {
      id: `new_${dayNum}`,
      day_number: dayNum,
      title: '',
      date: '',
      hours: '',
      questions: [],
    };
  });

  const handleDayChange = (dayNumber, field, value) => {
    const updated = ensuredDays.map(day => {
      if (day.day_number === dayNumber) {
        return { ...day, [field]: value };
      }
      return day;
    });
    onChange(updated);
  };

  const handleQuestionChange = (dayNumber, questionIndex, field, value) => {
    const updated = ensuredDays.map(day => {
      if (day.day_number === dayNumber) {
        const questions = [...(day.questions || [])];
        questions[questionIndex] = { ...questions[questionIndex], [field]: value };
        return { ...day, questions };
      }
      return day;
    });
    onChange(updated);
  };

  const addQuestion = (dayNumber) => {
    const updated = ensuredDays.map(day => {
      if (day.day_number === dayNumber) {
        const questions = [...(day.questions || [])];
        questions.push({
          id: `new_${Date.now()}`,
          question_text: '',
          question_type: 'text',
          required: true,
          display_order: questions.length,
        });
        return { ...day, questions };
      }
      return day;
    });
    onChange(updated);
  };

  const removeQuestion = (dayNumber, questionIndex) => {
    const updated = ensuredDays.map(day => {
      if (day.day_number === dayNumber) {
        const questions = [...(day.questions || [])];
        questions.splice(questionIndex, 1);
        return { ...day, questions };
      }
      return day;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-8">
      {ensuredDays.map(day => (
        <div key={day.day_number} className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Day {day.day_number}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              label="Title (optional)"
              value={day.title || ''}
              onChange={(e) => handleDayChange(day.day_number, 'title', e.target.value)}
              placeholder="e.g., Introduction & Overview"
            />
            <Input
              label="Date"
              type="date"
              value={day.date || ''}
              onChange={(e) => handleDayChange(day.day_number, 'date', e.target.value)}
            />
            <Input
              label="Hours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={day.hours || ''}
              onChange={(e) => handleDayChange(day.day_number, 'hours', e.target.value)}
              placeholder="e.g., 8"
            />
          </div>

          {/* Questions */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">Survey Questions</h4>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addQuestion(day.day_number)}
              >
                Add Question
              </Button>
            </div>

            {(day.questions || []).length === 0 ? (
              <p className="text-sm text-gray-500 italic">No questions for this day</p>
            ) : (
              <div className="space-y-3">
                {(day.questions || []).map((question, qIndex) => (
                  <div key={question.id || qIndex} className="flex gap-2 items-start bg-gray-50 p-3 rounded">
                    <div className="flex-1">
                      <Input
                        placeholder="Question text"
                        value={question.question_text || ''}
                        onChange={(e) => handleQuestionChange(day.day_number, qIndex, 'question_text', e.target.value)}
                      />
                    </div>
                    <select
                      value={question.question_type || 'text'}
                      onChange={(e) => handleQuestionChange(day.day_number, qIndex, 'question_type', e.target.value)}
                      className="border rounded px-2 py-2 text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="rating">Rating (1-5)</option>
                      <option value="yes_no">Yes/No</option>
                    </select>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={question.required ?? true}
                        onChange={(e) => handleQuestionChange(day.day_number, qIndex, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeQuestion(day.day_number, qIndex)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DaysEditor;