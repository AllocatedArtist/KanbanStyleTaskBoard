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

export default function Column({ status, tasks, onAddTask, onEdit, onDelete }: ColumnProps) {
  return (
    <Droppable id={status}>
      <div className="flex flex-col h-full bg-[#1a1a2e] rounded-lg border border-[#282740] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#282740]">
          <div className="flex items-center gap-2">
            <h2 className={"text-xs font-medium text-[#AD9BBF]"}>{status}</h2>
            <span className="text-[10px] text-[#A3A4CC] bg-[#282740] px-1.5 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => onAddTask()}
            className="p-1 rounded text-[#A3A4CC] hover:text-[#AD9BBF] hover:bg-[#282740] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Task List */}
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {tasks.map((task) => (
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
