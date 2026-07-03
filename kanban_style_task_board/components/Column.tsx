import { useEffect, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Status, Task } from '@/lib/types'
import TaskCard from './TaskCard'

interface ColumnProps {
  status: Status
  tasks: Task[]
  onAddTask: () => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function Droppable(props: { id: string, children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: props.id,
  });

  return (
    <div ref={setNodeRef} className="h-full">
      {props.children}
    </div>
  );
}

function DoneCounter({ count }: { count: number }) {
  const [displayCount, setDisplayCount] = useState(count)
  const [showSplash, setShowSplash] = useState(false)
  const previousCount = useRef(count)
  const splashTimer = useRef<number | null>(null)

  useEffect(() => {
    if (count > previousCount.current) {
      setDisplayCount(count)
      setShowSplash(true)
      if (splashTimer.current) {
        window.clearTimeout(splashTimer.current)
      }
      splashTimer.current = window.setTimeout(() => {
        setShowSplash(false)
      }, 520)
    } else {
      setDisplayCount(count)
    }
    previousCount.current = count

    return () => {
      if (splashTimer.current) {
        window.clearTimeout(splashTimer.current)
      }
    }
  }, [count])

  return (
    <span className="relative inline-flex items-center justify-center min-w-6">
      {showSplash && (
        <span className="absolute inset-0 rounded-full bg-[#6FCF97]/30 done-splash" />
      )}
      <span className={`relative z-10 ${showSplash ? 'done-pop' : ''}`}>
        {displayCount}
      </span>
    </span>
  )
}

export default function Column({ status, tasks, onAddTask, onEdit, onDelete }: ColumnProps) {
  let sortedTasks = tasks.sort((a, b) => a.position - b.position);
  const isDone = status === 'Done'
  return (
    <Droppable id={status}>
      <div className={`flex flex-col h-full min-h-0 rounded-lg border overflow-hidden ${isDone ? 'bg-[#18211c] border-[#355244]' : 'bg-[#1a1a2e] border-[#282740]'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isDone ? 'border-[#355244]' : 'border-[#282740]'}`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-xs font-medium ${isDone ? 'text-[#B7D8C0]' : 'text-[#AD9BBF]'}`}>{status}</h2>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDone ? 'text-[#D5E2DE] bg-[#355244]/50' : 'text-[#A3A4CC] bg-[#282740]'}`}>
              {isDone ? <DoneCounter count={tasks.length} /> : tasks.length}
            </span>
          </div>
          <button
            onClick={() => onAddTask()}
            className={`p-1 rounded transition-colors ${isDone ? 'text-[#7CA88C] hover:text-[#B7D8C0] hover:bg-[#223126]' : 'text-[#A3A4CC] hover:text-[#AD9BBF] hover:bg-[#282740]'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Task List */}
        <SortableContext items={sortedTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-1.5">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </Droppable>
  );
}
