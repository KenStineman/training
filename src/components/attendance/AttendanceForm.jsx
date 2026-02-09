import React, { useState } from 'react';
import { Input, Button, Alert } from '../ui';
import { SurveyQuestion } from './SurveyQuestion';
import { isValidEmail } from '../../utils/helpers';

export function AttendanceForm({ course, day, questions, onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    organization: course?.default_organization || '',
  });
  const [responses, setResponses] = useState({});
  const [validationError, setValidationError] = useState(null);

  const organizationLocked = !!course?.default_organization;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    // Validate
    if (!formData.email || !formData.fullName) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    // Check required questions
    const requiredQuestions = questions?.filter(q => q.required) || [];
    for (const q of requiredQuestions) {
      if (!responses[q.id]) {
        setValidationError(`Please answer: "${q.question_text}"`);
        return;
      }
    }

    onSubmit({
      ...formData,
      responses,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || validationError) && (
        <Alert variant="error">
          {error || validationError}
        </Alert>
      )}

      <div className="space-y-4">
        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="you@example.com"
        />

        <Input
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          placeholder="Your full name"
        />

        <Input
          label="Organization"
          name="organization"
          value={formData.organization}
          onChange={handleChange}
          placeholder="Your company or organization"
          disabled={organizationLocked}
          helpText={organizationLocked ? "Set by course administrator" : "Optional"}
        />
      </div>

      {questions && questions.length > 0 && (
        <div className="space-y-6 pt-6 border-t">
          <h3 className="font-medium text-gray-900">Survey Questions</h3>
          {questions.map(question => (
            <SurveyQuestion
              key={question.id}
              question={question}
              value={responses[question.id] || ''}
              onChange={(value) => handleResponseChange(question.id, value)}
            />
          ))}
        </div>
      )}

      <Button type="submit" className="w-full" loading={loading}>
        Check In for Day {day?.day_number}
      </Button>
    </form>
  );
}

export default AttendanceForm;