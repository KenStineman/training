import React, { useState, useEffect } from 'react';
import { Input, Textarea, Select, Checkbox, Button } from '../ui';
import { generateSlug } from '../../utils/helpers';

export function CourseForm({ initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    num_days: 1,
    certificate_type: 'completion',
    min_days_for_participation: 1,
    requires_all_days_for_completion: true,
    default_organization: '',
    active: true,
  });

  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        num_days: initialData.num_days || 1,
        certificate_type: initialData.certificate_type || 'completion',
        min_days_for_participation: initialData.min_days_for_participation || 1,
        requires_all_days_for_completion: initialData.requires_all_days_for_completion ?? true,
        default_organization: initialData.default_organization || '',
        active: initialData.active ?? true,
      });
      setAutoSlug(false);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };

      // Auto-generate slug from name
      if (name === 'name' && autoSlug) {
        updated.slug = generateSlug(value);
      }

      return updated;
    });
  };

  const handleSlugChange = (e) => {
    setAutoSlug(false);
    handleChange(e);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Course Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., ISO 27001 Security Fundamentals"
        />

        <Input
          label="URL Slug"
          name="slug"
          value={formData.slug}
          onChange={handleSlugChange}
          required
          placeholder="e.g., iso-27001-fundamentals"
          helpText="Used in attendance URLs"
        />
      </div>

      <Textarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        rows={3}
        placeholder="Brief description of the course..."
      />

      <Input
        label="Default Organization"
        name="default_organization"
        value={formData.default_organization}
        onChange={handleChange}
        placeholder="e.g., Cytek Biosciences"
        helpText="If set, pre-fills and locks organization for all attendees"
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
          required
        />

        <Select
          label="Certificate Type"
          name="certificate_type"
          value={formData.certificate_type}
          onChange={handleChange}
          options={[
            { value: 'completion', label: 'Completion Only' },
            { value: 'participation', label: 'Participation Only' },
            { value: 'both', label: 'Both Types' },
          ]}
        />

        <Input
          label="Min Days for Participation"
          name="min_days_for_participation"
          type="number"
          min="1"
          max={formData.num_days}
          value={formData.min_days_for_participation}
          onChange={handleChange}
          helpText="For participation certificates"
        />
      </div>

      <div className="space-y-3">
        <Checkbox
          label="Require all days for completion certificate"
          name="requires_all_days_for_completion"
          checked={formData.requires_all_days_for_completion}
          onChange={handleChange}
        />

        <Checkbox
          label="Course is active"
          name="active"
          checked={formData.active}
          onChange={handleChange}
          helpText="Inactive courses won't accept attendance"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Save Changes' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}

export default CourseForm;