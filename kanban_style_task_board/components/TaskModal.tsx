import { useState, useEffect } from 'react'

import { Priority, Task, Label } from '@/lib/types'
import LabelPicker from '@/components/LabelPicker'
import { useLabels } from '@/lib/LabelContext'

interface TaskModalProps {
  isOpen: boolean
  mode: 'create' | 'view-edit'
  onCancel: () => void
  onConfirm: (task: { taskId: string, title: string; description: string; dueDate: string; label: string; priority: Priority }) => void
  editingTask?: Task | null
  onDelete?: (task: Task) => void
}

export default function TaskModal({ isOpen, mode, onCancel, onConfirm, editingTask, onDelete }: TaskModalProps) {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [label, setLabel] = useState('')
  const [priority, setPriority] = useState<Priority>('Normal')
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details')

  const [pendingLabels, setPendingLabels] = useState<Label[]>([]);
  const [assignedLabels, setAssignedLabels] = useState<{ taskId: string, labelId: string }[]>([])

  const labelContext = useLabels();

  // Populate fields when editing
  useEffect(() => {
    setPendingLabels([...labelContext.labelPool]);
    if (editingTask) {
      setAssignedLabels(
        labelContext
          .labelsForTask(editingTask.id)
          .map(label => { return { taskId: editingTask.id, labelId: label.id } })
      );
      setTitle(editingTask.title)
      setDescription(editingTask.description || '')
      setDueDate(editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '')
      setLabel('')
      setPriority(editingTask.priority)
      setLoading(false);
    }
  }, [editingTask])

  const isEditing = mode === 'view-edit'

  if (!isOpen) return null
  if (isEditing && loading) return null

  const missingFields: string[] = []
  if (title.trim() === '') missingFields.push('Title')
  if (dueDate.trim() === '') missingFields.push('Due Date')

  const isValid = missingFields.length === 0

  const handleConfirm = () => {
    if (!isValid) return
    let newTaskId = editingTask?.id ?? crypto.randomUUID();
    onConfirm({ taskId: newTaskId, title: title.trim(), description, dueDate, label, priority })
    setTitle('')
    setDescription('')
    setDueDate('')
    setLabel('')
    setPriority('Normal')

    labelContext.labelPool.filter(label =>
      pendingLabels.findIndex(value => { return value.id == label.id }) == -1)
      .forEach(label => { labelContext.deleteLabel(label.id); });

    pendingLabels.forEach(label => {
      if (label.userId == "") {
        labelContext.createLabel(label.name, label.color, newTaskId);
      } else {
        labelContext.updateLabel(label.id, label.name, label.color);
      }
    });

    setPendingLabels([]);

    assignedLabels.forEach(pair => {
      labelContext.attachLabel(newTaskId, pair.labelId);
    });

    if (isEditing) {
      labelContext.labelsForTask(newTaskId).filter(label =>
        assignedLabels.findIndex(value => { return value.taskId == newTaskId && value.labelId == label.id }) == -1)
        .forEach(label => { labelContext.detachLabel(newTaskId, label.id); });
    }

    setAssignedLabels([]);
  }

  const handleCancel = () => {
    setTitle('')
    setDescription('')
    setDueDate('')
    setLabel('')
    setPriority('Normal')
    setActiveTab('details')
    setLoading(true);
    onCancel()

    setPendingLabels([]);
    setAssignedLabels([]);
  }

  const renderDetailsTab = () => (
    <>
      {/* Options row: calendar picker, labels button, priority dropdown */}
      <div className="flex items-center gap-3 mb-5">
        {/* Calendar picker */}
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-[#A3A4CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-[#282740] text-[#A3A4CC] text-xs rounded px-2 py-1.5 border border-[#555673] focus:outline-none focus:border-[#A6445E] transition-colors"
          />
        </div>

        {/* Labels picker */}
        <LabelPicker
          taskId={editingTask?.id ?? ""}
          labelPool={pendingLabels}
          labelsForTask={_ => {
            return assignedLabels
              .map(({ labelId }) => pendingLabels.find(label => label.id == labelId))
              .filter(label => label != undefined)
          }}
          createLabel={(name, color, taskId) => {
            let labelId = crypto.randomUUID();
            setPendingLabels(prev => [...prev, { name, color, userId: "", id: labelId }])
            setAssignedLabels(prev => [...prev, { taskId, labelId }]);
          }}
          updateLabel={(labelId, name, color) => {
            let labelIndex = pendingLabels.findIndex(label => label.id == labelId);
            if (labelIndex == -1) return;
            let labelPool = pendingLabels;
            labelPool[labelIndex].name = name;
            labelPool[labelIndex].color = color;
            setPendingLabels(prev => {
              return prev.map(label => label.id == labelId ? { ...label, name, color } : label);
            });
          }}
          detachLabel={(taskId, labelId) => {
            setAssignedLabels(prev => prev.filter(tl => !(tl.taskId === taskId && tl.labelId === labelId)))
          }}
          attachLabel={(taskId, labelId) => {
            setAssignedLabels(prev => [...prev, { taskId, labelId }]);
          }}
          deleteLabel={labelId => {
            setPendingLabels(prev => prev.filter(label => label.id !== labelId));
          }}
        />

        {/* Priority dropdown */}
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-[#A3A4CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="bg-[#282740] text-[#A3A4CC] text-xs rounded px-2 py-1.5 border border-[#555673] focus:outline-none focus:border-[#A6445E] transition-colors cursor-pointer"
          >
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {/* Description field — decently sized box */}
      <textarea
        placeholder="Add a description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        className="w-full bg-[#282740] text-[#A3A4CC] text-sm rounded-md border border-[#555673] p-3 mb-5 resize-none focus:outline-none focus:border-[#A6445E] transition-colors placeholder-[#555673]"
      />

      {/* Cancel / Confirm buttons — bottom right */}
      <div className="flex items-center justify-end gap-3">
        {isEditing && onDelete && editingTask && (
          <button
            onClick={() => onDelete(editingTask)}
            className="px-4 py-2 text-xs font-medium text-[#F25C5C] bg-transparent border border-[#F25C5C]/50 rounded-md hover:bg-[#F25C5C]/10 transition-colors mr-auto"
          >
            Delete
          </button>
        )}
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-xs font-medium text-[#AD9BBF] bg-transparent border border-[#555673] rounded-md hover:bg-[#555673]/30 transition-colors"
        >
          Cancel
        </button>
        <div className="relative">
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${isValid
              ? 'text-white bg-[#A6445E] hover:bg-[#F25C5C] cursor-pointer'
              : 'text-[#555673] bg-[#282740] border border-[#555673] cursor-not-allowed'
              }`}
          >
            Confirm
          </button>
          {!isValid && (
            <div className="absolute right-0 top-full mt-1 bg-[#F25C5C] text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
              Missing: {missingFields.join(', ')}
              <div className="absolute -top-1 right-3 w-2 h-2 bg-[#F25C5C] rotate-45" />
            </div>
          )}
        </div>
      </div>
    </>
  )

  const renderActivityTab = () => (
    <div className="min-h-[200px] flex flex-col items-center justify-center text-[#555673] text-sm">
      <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Activity feed coming soon</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-[#282740]/70 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#1a1a2e] border border-[#555673] rounded-lg shadow-2xl p-6">
        {/* Title field — long narrow strip, top left */}
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value.trimStart())}
          className="w-full bg-transparent border-b border-[#555673] text-[#AD9BBF] placeholder-[#555673] text-sm font-medium py-2 px-1 mb-4 focus:outline-none focus:border-[#A6445E] transition-colors"
        />

        {/* Folder tabs — only shown in view/edit mode */}
        {isEditing && (
          <div className="flex items-center gap-0 mb-5 border-b border-[#282740]">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${activeTab === 'details'
                ? 'text-[#AD9BBF] border-[#A6445E]'
                : 'text-[#555673] border-transparent hover:text-[#A3A4CC]'
                }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${activeTab === 'activity'
                ? 'text-[#AD9BBF] border-[#A6445E]'
                : 'text-[#555673] border-transparent hover:text-[#A3A4CC]'
                }`}
            >
              Activity
            </button>
          </div>
        )}

        {/* Tab content */}
        {isEditing && activeTab === 'details' && renderDetailsTab()}
        {isEditing && activeTab === 'activity' && renderActivityTab()}
        {!isEditing && renderDetailsTab()}
      </div>
    </div>
  )
}
