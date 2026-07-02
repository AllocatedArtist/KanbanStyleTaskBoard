import { useSortable } from "@dnd-kit/sortable"

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Task, Status, DueDateBadgeState, getDueDateBadgeState } from "@/lib/types"
import { useLabels } from "@/lib/LabelContext"

interface TaskProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  isDragging?: boolean
}

const priorityColors = {
  Low: "bg-[#AD9BBF]/20 text-[#AD9BBF] border border-[#AD9BBF]/50",
  Normal: "bg-[#55736A]/50 text-[#D5E2DE] border border-[#55736A]/50",
  High: "bg-[#F25C5C]/20 text-[#F25C5C] border border-[#F25C5C]/50",
};

const dueDateBadgeStyles: Record<DueDateBadgeState, string> = {
  warning: 'bg-[#F5B96B]/15 text-[#F5B96B] border border-[#F5B96B]/35',
  today: 'bg-[#F25C5C]/15 text-[#F25C5C] border border-[#F25C5C]/35',
  overdue: 'bg-[#A6445E]/15 text-[#A6445E] border border-[#A6445E]/35',
}

const dueDateBadgeLabels: Record<DueDateBadgeState, string> = {
  warning: '1 day left',
  today: 'Due today',
  overdue: 'Overdue',
}

interface DraggableProps {
  status: Status
  id: string
  isDragging?: boolean
  children: (isDragging: boolean) => React.ReactNode
}

function Draggable({ status, id, isDragging: isDraggingProp, children }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { status }
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0 : 1,
        pointerEvents: isDragging ? 'none' : undefined
      }}
      {...attributes}
      {...listeners}
    >
      {children(isDragging || (isDraggingProp ?? false))}
    </div>
  );
}

export default function TaskCard({ task, onEdit, onDelete, isDragging: isDraggingProp }: TaskProps) {
  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    : null;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const dueDateBadgeState = dueDate && !Number.isNaN(dueDate.getTime())
    ? getDueDateBadgeState(dueDate)
    : null;

  const labelContext = useLabels();
  const [showMoreLabels, setShowMoreLabels] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showMoreLabels && overflowRef.current) {
      const rect = overflowRef.current.getBoundingClientRect()
      setTooltipPos({ top: rect.top - 4, left: rect.left })
    }
  }, [showMoreLabels]);

  const taskLabels = labelContext.labelsForTask(task.id)
  const visibleLabels = taskLabels.slice(0, 3)
  const overflowCount = taskLabels.length - 3

  const truncateName = (name: string, max = 12) =>
    name.length > max ? name.slice(0, max) + '...' : name

  const labelChip = (label: { id: string; name: string; color: string }) => (
    <span
      key={label.id}
      className="px-1.5 py-0.5 rounded-full text-[10px] text-white truncate max-w-[100px] flex items-center justify-center"
      style={{ backgroundColor: label.color }}
    >
      {truncateName(label.name)}
    </span>
  )

  return (
    <Draggable id={task.id} status={task.status} isDragging={isDraggingProp}>
      {(isDragging) => (
        <div
          className={`group relative flex flex-col gap-2 rounded-lg border border-[#282740] bg-[#282740] p-2.5 shadow-sm transition-all ${isDragging ? '' : 'hover:border-[#AD9BBF] hover:shadow-md'} cursor-pointer`}
        >
          {/* Action buttons — top right */}
          {!isDragging && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                className="p-1 rounded hover:bg-[#555673]/40 text-[#A3A4CC] hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                className="p-1 rounded hover:bg-[#A6445E]/40 text-[#A3A4CC] hover:text-[#F25C5C] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}

          {/* Title */}
          <h3 className={`text-xs font-medium text-[#AD9BBF] ${isDragging ? '' : 'group-hover:text-white'} transition-colors line-clamp-2`}>
            {task.title}
          </h3>

          {/* Footer Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Priority */}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${priorityColors[task.priority]}`}
              style={{ fontFamily: 'var(--font-bold)' }}
            >
              {task.priority}
            </span>

            {/* Labels */}
            {visibleLabels.map((label) => labelChip(label))}
            {overflowCount > 0 && (
              <div className="relative" ref={overflowRef}>
                <button
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => { if (!isDragging) setShowMoreLabels(true) }}
                  onMouseLeave={() => setShowMoreLabels(false)}
                  className="px-1.5 py-0.5 rounded-full text-[10px] text-[#AD9BBF] bg-[#555673]/40 hover:bg-[#555673]/60 transition-colors"
                >
                  +{overflowCount}
                </button>
              </div>
            )}
            {showMoreLabels && !isDragging && createPortal(
              <div
                className="fixed z-[9999] max-h-32 bg-[#282740] border border-[#555673] rounded-lg shadow-xl p-2 grid grid-cols-2 gap-1.5"
                style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateY(-100%)', overflowY: 'auto' }}
              >
                {taskLabels.slice(3).map((label) => (
                  <span
                    key={label.id}
                    className="w-fit px-1.5 py-0.5 rounded-full text-[10px] flex items-center justify-center"
                    style={{ backgroundColor: label.color, color: '#ffffff' }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>,
              document.body
            )}

            {/* Due Date */}
            {formattedDate && (
              <span className="text-[10px] text-[#A3A4CC] flex items-center gap-1">
                {dueDateBadgeState ? (
                  <span
                    className={`px-1.5 py-0.5 rounded-full ${dueDateBadgeStyles[dueDateBadgeState]}`}
                    style={{ fontFamily: 'var(--font-bold)' }}
                  >
                    {dueDateBadgeLabels[dueDateBadgeState]}
                  </span>
                ) : null}
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formattedDate}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
