// Application constants

export const QUESTION_TYPES = {
  TEXT: 'text',
  RATING: 'rating',
  MULTIPLE_CHOICE: 'multiple_choice',
  YES_NO: 'yes_no',
};

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.TEXT]: 'Text (Free Response)',
  [QUESTION_TYPES.RATING]: 'Rating (1-5 Stars)',
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QUESTION_TYPES.YES_NO]: 'Yes / No',
};

export const CERTIFICATE_TYPES = {
  COMPLETION: 'completion',
  PARTICIPATION: 'participation',
  BOTH: 'both',
};

export const CERTIFICATE_TYPE_LABELS = {
  [CERTIFICATE_TYPES.COMPLETION]: 'Certificate of Completion',
  [CERTIFICATE_TYPES.PARTICIPATION]: 'Certificate of Participation',
  [CERTIFICATE_TYPES.BOTH]: 'Both (Completion & Participation)',
};

export const CERTIFICATE_TEMPLATES = {
  STANDARD: 'standard',
  MINIMAL: 'minimal',
  FORMAL: 'formal',
};

export const CERTIFICATE_TEMPLATE_LABELS = {
  [CERTIFICATE_TEMPLATES.STANDARD]: 'Standard',
  [CERTIFICATE_TEMPLATES.MINIMAL]: 'Minimal',
  [CERTIFICATE_TEMPLATES.FORMAL]: 'Formal',
};

// Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SLUG_REGEX: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MAX_QUESTION_LENGTH: 1000,
  MAX_RESPONSE_LENGTH: 5000,
};

// Messages
export const MESSAGES = {
  ATTENDANCE_SUCCESS: 'Thank you! Your attendance has been recorded.',
  ATTENDANCE_ERROR: 'There was a problem recording your attendance. Please try again.',
  ALREADY_CHECKED_IN: 'You have already checked in for this day.',
  COURSE_NOT_FOUND: 'Course not found.',
  DAY_NOT_FOUND: 'This day is not available for check-in.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  REQUIRED_FIELD: 'This field is required.',
};
