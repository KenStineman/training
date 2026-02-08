import React from 'react';
import { Input, Textarea } from '../ui';
import { QUESTION_TYPES } from '../../config/constants';

export function SurveyQuestion({
  question,
  value,
  onChange,
  error,
}) {
  const renderQuestion = () => {
    switch (question.question_type) {
      case QUESTION_TYPES.TEXT:
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer..."
            rows={3}
          />
        );

      case QUESTION_TYPES.RATING:
        return (
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star.toString())}
                className={value && parseInt(value) >= star ? 'filled' : ''}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
            {value && (
              <span className="ml-2 text-sm text-gray-500">
                {value}/5
              </span>
            )}
          </div>
        );

      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return (
          <div className="space-y-2">
            {(question.options || []).map((option, index) => (
              <label
                key={index}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-4 w-4 text-helix-primary border-gray-300 
                             focus:ring-helix-primary cursor-pointer"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case QUESTION_TYPES.YES_NO:
        return (
          <div className="flex space-x-4">
            {['Yes', 'No'].map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-4 w-4 text-helix-primary border-gray-300 
                             focus:ring-helix-primary cursor-pointer"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer..."
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {question.question_text}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderQuestion()}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default SurveyQuestion;
