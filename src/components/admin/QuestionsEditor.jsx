import React, { useState } from 'react';
import { Button, Input, Textarea, Select, Checkbox } from '../ui';
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from '../../config/constants';

const questionTypeOptions = Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function QuestionsEditor({
  questions = [],
  onChange,
}) {
  const [editingId, setEditingId] = useState(null);

  const handleAdd = () => {
    const newQuestion = {
      id: `new_${Date.now()}`,
      question_text: '',
      question_type: QUESTION_TYPES.TEXT,
      options: [],
      required: true,
      display_order: questions.length,
    };
    onChange([...questions, newQuestion]);
    setEditingId(newQuestion.id);
  };

  const handleUpdate = (id, field, value) => {
    const updated = questions.map(q => {
      if (q.id === id) {
        return { ...q, [field]: value };
      }
      return q;
    });
    onChange(updated);
  };

  const handleRemove = (id) => {
    const updated = questions.filter(q => q.id !== id);
    updated.forEach((q, i) => (q.display_order = i));
    onChange(updated);
    setEditingId(null);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...questions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated.forEach((q, i) => (q.display_order = i));
    onChange(updated);
  };

  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    const updated = [...questions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((q, i) => (q.display_order = i));
    onChange(updated);
  };

  const handleOptionsChange = (id, optionsText) => {
    const options = optionsText.split('\n').filter(o => o.trim());
    handleUpdate(id, 'options', options);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h5 className="text-sm font-medium text-gray-700">Survey Questions</h5>
        <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
          + Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          No survey questions for this day. Add questions to collect feedback.
        </p>
      ) : (
        <div className="space-y-3">
          {questions
            .sort((a, b) => a.display_order - b.display_order)
            .map((question, index) => (
              <div
                key={question.id}
                className="p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 text-gray-400">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-0.5 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === questions.length - 1}
                      className="p-0.5 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>

                  <div className="flex-1 space-y-3">
                    <Textarea
                      label={`Question ${index + 1}`}
                      value={question.question_text}
                      onChange={(e) => handleUpdate(question.id, 'question_text', e.target.value)}
                      placeholder="Enter your question..."
                      rows={2}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Question Type"
                        value={question.question_type}
                        onChange={(e) => handleUpdate(question.id, 'question_type', e.target.value)}
                        options={questionTypeOptions}
                      />

                      <div className="flex items-end">
                        <Checkbox
                          label="Required"
                          checked={question.required}
                          onChange={(e) => handleUpdate(question.id, 'required', e.target.checked)}
                        />
                      </div>
                    </div>

                    {question.question_type === QUESTION_TYPES.MULTIPLE_CHOICE && (
                      <Textarea
                        label="Options (one per line)"
                        value={(question.options || []).join('\n')}
                        onChange={(e) => handleOptionsChange(question.id, e.target.value)}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={3}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(question.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Remove question"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default QuestionsEditor;
