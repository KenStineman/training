import React, { useState } from 'react';
import { Button, Input, Alert } from '../ui';
import SurveyQuestion from './SurveyQuestion';
import { isValidEmail } from '../../utils/helpers';
import { MESSAGES } from '../../config/constants';

export function AttendanceForm({
  course,
  day,
  questions = [],
  onSubmit,
  loading = false,
  error = null,
}) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    organization: '',
  });
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = MESSAGES.REQUIRED_FIELD;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = MESSAGES.INVALID_EMAIL;
    }
    
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name';
    }
    
    // Validate required questions
    questions.forEach((q) => {
      if (q.required && !responses[q.id]) {
        newErrors[`question_${q.id}`] = MESSAGES.REQUIRED_FIELD;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSubmit({
      ...formData,
      email: formData.email.toLowerCase().trim(),
      fullName: formData.fullName.trim(),
      organization: formData.organization.trim(),
      responses,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    if (errors[`question_${questionId}`]) {
      setErrors((prev) => ({ ...prev, [`question_${questionId}`]: null }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Attendee Info */}
      <div className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          placeholder="you@example.com"
          required
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Full Name"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          error={errors.fullName}
          placeholder="John Smith"
          required
          autoComplete="name"
        />

        <Input
          label="Organization (Optional)"
          type="text"
          name="organization"
          value={formData.organization}
          onChange={handleInputChange}
          placeholder="Company or organization"
          autoComplete="organization"
        />
      </div>

      {/* Survey Questions */}
      {questions.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900">
            Quick Survey
          </h3>
          
          {questions.map((question) => (
            <SurveyQuestion
              key={question.id}
              question={question}
              value={responses[question.id] || ''}
              onChange={(value) => handleResponseChange(question.id, value)}
              error={errors[`question_${question.id}`]}
            />
          ))}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={loading}
      >
        Record Attendance
      </Button>
    </form>
  );
}

export default AttendanceForm;
