import React, { useState } from 'react';
import { Button, Input } from '../ui';

export function TrainersEditor({
  trainers = [],
  onChange,
}) {
  const [editingIndex, setEditingIndex] = useState(null);

  const handleAdd = () => {
    const newTrainer = {
      id: `new_${Date.now()}`,
      name: '',
      title: '',
      display_order: trainers.length,
    };
    onChange([...trainers, newTrainer]);
    setEditingIndex(trainers.length);
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...trainers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = trainers.filter((_, i) => i !== index);
    onChange(updated);
    setEditingIndex(null);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...trainers];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated.forEach((t, i) => (t.display_order = i));
    onChange(updated);
  };

  const handleMoveDown = (index) => {
    if (index === trainers.length - 1) return;
    const updated = [...trainers];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((t, i) => (t.display_order = i));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">Trainers</h4>
        <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
          + Add Trainer
        </Button>
      </div>

      {trainers.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No trainers added yet.</p>
      ) : (
        <div className="space-y-3">
          {trainers.map((trainer, index) => (
            <div
              key={trainer.id}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={trainer.name}
                  onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                  placeholder="e.g., Kelly Weyrauch"
                  required
                />
                <Input
                  label="Title (Optional)"
                  value={trainer.title || ''}
                  onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                  placeholder="e.g., Lead Instructor"
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === trainers.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                title="Remove trainer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrainersEditor;
