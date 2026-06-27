import { useState, useRef } from 'react'
import { Label } from '@/lib/types'

interface LabelPickerProps {
  taskId: string
  labelPool: Label[]
  labelsForTask: (taskId: string) => Label[]
  createLabel: (name: string, color: string, taskId: string) => void
  updateLabel: (labelId: string, name: string, color: string) => void
  detachLabel: (taskId: string, labelId: string) => void
  attachLabel: (taskId: string, labelId: string) => void
  deleteLabel: (labelId: string) => void
}

export default function LabelPicker(props: LabelPickerProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#A6445E')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const labels = props.labelPool;

  let assignedLabelCount = props.labelsForTask(props.taskId).length;

  const containerRef = useRef<HTMLDivElement>(null)

  const handleCreate = () => {
    if (newLabelName.trim() === '') return
    props.createLabel(newLabelName.trim(), newLabelColor, props.taskId);
    setNewLabelName('')
    setNewLabelColor('#A6445E')
    setCreating(false)
  }

  const handleStartEdit = (label: Label) => {
    setEditingId(label.id)
    setEditName(label.name)
  }

  const handleDoubleClick = (label: Label, e: React.MouseEvent) => {
    e.stopPropagation()
    handleStartEdit(label)
  }

  const handleEditBlur = (label: Label) => {
    if (editingId !== label.id) return
    if (editName.trim() !== '') {
      props.updateLabel(label.id, editName.trim(), label.color)
    }
    setEditingId(null)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent, label: Label) => {
    if (e.key === 'Enter') {
      if (editName.trim() !== '') {
        props.updateLabel(label.id, editName.trim(), label.color)
      }
      setEditingId(null)
    }
    if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return (
    <div className="relative w-fit" ref={containerRef}>
      {/* Trigger button */}
      <div
        className="flex items-center gap-1.5 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <svg className="w-4 h-4 text-[#A3A4CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <span className="text-xs text-[#A3A4CC]">Labels</span>
        {assignedLabelCount > 0 && (
          <span className="text-[10px] bg-[#555673] text-[#A3A4CC] rounded-full px-1.5">
            {assignedLabelCount}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-64 max-h-72 overflow-y-auto bg-[#282740] border border-[#555673] rounded-lg shadow-xl">
          {/* Label list */}
          <div className="py-1">
            {labels.map((label) => {
              const isAssigned = props.labelsForTask(props.taskId).includes(label);
              const isEditing = editingId === label.id

              function toggleLabel() {
                if (isAssigned) {
                  props.detachLabel(props.taskId, label.id);
                } else {
                  props.attachLabel(props.taskId, label.id);
                }
              }

              return (
                <div
                  key={label.id}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a1a2e] group"
                  onDoubleClick={(e) => handleDoubleClick(label, e)}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleLabel()}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isAssigned
                      ? 'bg-[#A6445E] border-[#A6445E]'
                      : 'border-[#555673] hover:border-[#AD9BBF]'
                      }`}
                  >
                    {isAssigned && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Color strip */}
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />

                  {/* Name (editable on double click) */}
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleEditBlur(label)}
                      onKeyDown={(e) => handleEditKeyDown(e, label)}
                      className="flex-1 bg-transparent text-xs text-[#AD9BBF] border-b border-[#555673] focus:border-[#A6445E] outline-none px-1 py-0.5"
                    />
                  ) : (
                    <span className="flex-1 text-xs text-[#AD9BBF] truncate">
                      {label.name}
                    </span>
                  )}

                  {/* Color picker */}
                  <label className="relative cursor-pointer">
                    <input
                      type="color"
                      value={label.color}
                      onChange={(e) => props.updateLabel(label.id, label.name, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      onClick={(e) => { e.stopPropagation() }}
                    />
                    <div
                      className="w-3.5 h-3.5 rounded border border-[#555673]"
                      style={{ backgroundColor: label.color }}
                    />
                  </label>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      props.deleteLabel(label.id)
                    }}
                    className="p-0.5 rounded text-[#A3A4CC] hover:text-[#F25C5C] hover:bg-[#555673]/30 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Create new label */}
          <div className="border-t border-[#555673] px-2 py-2">
            {creating ? (
              <div className="flex items-center gap-2">
                {/* Color picker for new label */}
                <label className="relative cursor-pointer shrink-0">
                  <input
                    type="color"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor h-full"
                  />
                  <div
                    className="w-3.5 h-3.5 rounded border border-[#555673]"
                    style={{ backgroundColor: newLabelColor }}
                  />
                </label>
                <input
                  autoFocus
                  placeholder="Label name"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') {
                      setCreating(false)
                      setNewLabelName('')
                    }
                  }}
                  className="flex-1 bg-transparent text-xs text-[#AD9BBF] border-b border-[#555673] focus:border-[#A6445E] outline-none px-1 py-0.5 placeholder-[#555673]"
                />
                <button
                  onClick={handleCreate}
                  className="text-[10px] font-medium text-white bg-[#A6445E] hover:bg-[#F25C5C] px-2 py-1 rounded transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setCreating(false)
                    setNewLabelName('')
                  }}
                  className="text-[#A3A4CC] hover:text-[#AD9BBF] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 text-xs text-[#A3A4CC] hover:text-[#AD9BBF] transition-colors w-full"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create new label
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
