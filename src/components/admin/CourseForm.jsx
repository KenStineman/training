import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Select, Checkbox, Alert } from '../ui';
import { CERTIFICATE_TYPES, CERTIFICATE_TYPE_LABELS, CERTIFICATE_TEMPLATES, CERTIFICATE_TEMPLATE_LABELS } from '../../config/constants';
import { generateSlug } from '../../utils/helpers';

const certificateTypeOptions = Object.entries(CERTIFICATE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const templateOptions = Object.entries(CERTIFICATE_TEMPLATE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function CourseForm({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    num_days: 1,
    certificate_type: CERTIFICATE_TYPES.COMPLETION,
    min_days_for_participation: 1,
    requires_all_days_for_completion: true,
    certificate_template: CERTIFICATE_TEMPLATES.STANDARD,
    logo_url: '',
    active: true,
  });
  const [errors, setErrors] = useState({});
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        num_days: initialData.num_days || 1,
        certificate_type: initialData.certificate_type || CERTIFICATE_TYPES.COMPLETION,
        min_days_for_participation: initialData.min_days_for_participation || 1,
        requires_all_days_for_completion: initialData.requires_all_days_for_completion ?? true,
        certificate_template: initialData.certificate_template || CERTIFICATE_TEMPLATES.STANDARD,
        logo_url: initialData.logo_url || '',
        active: initialData.active ?? true,
      });
      setAutoSlug(false);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };
      
      // Auto-generate slug from name if not editing
      if (name === 'name' && autoSlug) {
        updated.slug = generateSlug(value);
      }
      
      // Ensure min_days doesn't exceed num_days
      if (name === 'num_days') {
        const numDays = parseInt(value) || 1;
        if (prev.min_days_for_participation > numDays) {
          updated.min_days_for_participation = numDays;
        }
      }
      
      return updated;
    });
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSlugChange = (e) => {
    setAutoSlug(false);
    handleChange(e);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must be lowercase with hyphens only';
    }
    
    if (formData.num_days < 1) {
      newErrors.num_days = 'Must have at least 1 day';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        num_days: parseInt(formData.num_days),
        min_days_for_participation: parseInt(formData.min_days_for_participation),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Course Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g., Regulated Agile and TIR-45 Training"
          required
        />

        <Input
          label="URL Slug"
          name="slug"
          value={formData.slug}
          onChange={handleSlugChange}
          error={errors.slug}
          placeholder="e.g., regulated-agile-2025"
          required
        />
      </div>

      <Textarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Brief description of the course..."
        rows={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="Number of Days"
          name="num_days"
          type="number"
          min="1"
          max="30"
          value={formData.num_days}
          onChange={handleChange}
          error={errors.num_days}
          required
        />

        <Select
          label="Certificate Type"
          name="certificate_type"
          value={formData.certificate_type}
          onChange={handleChange}
          options={certificateTypeOptions}
        />

        <Select
          label="Certificate Template"
          name="certificate_template"
          value={formData.certificate_template}
          onChange={handleChange}
          options={templateOptions}
        />
      </div>

      {/* Participation Settings */}
      {(formData.certificate_type === CERTIFICATE_TYPES.PARTICIPATION || 
        formData.certificate_type === CERTIFICATE_TYPES.BOTH) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Participation Settings</h4>
          <Input
            label="Minimum Days for Participation Certificate"
            name="min_days_for_participation"
            type="number"
            min="1"
            max={formData.num_days}
            value={formData.min_days_for_participation}
            onChange={handleChange}
          />
        </div>
      )}

      {/* Completion Settings */}
      {(formData.certificate_type === CERTIFICATE_TYPES.COMPLETION || 
        formData.certificate_type === CERTIFICATE_TYPES.BOTH) && (
        <Checkbox
          label="Require all days for completion certificate"
          name="requires_all_days_for_completion"
          checked={formData.requires_all_days_for_completion}
          onChange={handleChange}
        />
      )}

      <Input
        label="Custom Logo URL (Optional)"
        name="logo_url"
        type="url"
        value={formData.logo_url}
        onChange={handleChange}
        placeholder="https://example.com/logo.png"
      />

      <Checkbox
        label="Course is active and accepting attendance"
        name="active"
        checked={formData.active}
        onChange={handleChange}
      />

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {initialData ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}

export default CourseForm;
