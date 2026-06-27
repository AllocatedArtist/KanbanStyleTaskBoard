import { useState } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensors, useSensor, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable'


import Column from '../components/Column'
import TaskCard from '../components/TaskCard'
import TaskModal from './TaskModal'
import { Task, Status, Priority } from '@/lib/types'

interface BoardProps {
  tasks: Task[]
  userId: string
  onTaskUpdate: (task: Task) => void
}


export default function Board(prop: BoardProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<[string, Status] | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 10 }
  }));

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [currentStatus, setCurrentStatus] = useState<Status | null>(null)

  const [columns, setColumns] = useState<Record<Status, Task[]>>({
    "To Do": prop.tasks.filter(task => task.status == "To Do"),
    "In Progress": prop.tasks.filter(task => task.status == "In Progress"),
    "In Review": prop.tasks.filter(task => task.status == "In Review"),
    "Done": prop.tasks.filter(task => task.status == "Done")
  });

  const onDragStart = ({ active }: DragStartEvent) => {
    setSelectedTaskId([active.id as string, active.data.current?.status]);
  }

  const onDragEnd = ({ over }: DragEndEvent) => {
    if (!(over && over.id)) {
      return;
    }

    const findColumn = (taskId: string) => {
      return Object
        .keys(columns)
        .find(status => columns[status as Status].some(task => task.id == taskId)) as Status;
    };

    let newColumn = columns[over.id as Status] ? over.id as Status : findColumn(over.id as string);
    let taskId = selectedTaskId?.[0];
    let prevColumn = selectedTaskId?.[1] as Status;
    const activeTaskIndex = columns[prevColumn].findIndex((t) => t.id === taskId);
    if (activeTaskIndex == -1) {
      return;
    }

    const computeNewPosition = (tasks: Task[], newIndex: number) => {
      const prev = tasks[newIndex - 1];
      const next = tasks[newIndex + 1];
      if (prev == null && next == null) return 1000.0;
      if (prev == null) return next.position / 2;
      if (next == null) return prev.position + 1000.0;
      return (prev.position + next.position) / 2;
    };

    // Move task from previous column to new column
    setColumns(prev => {
      // Move task within the same column
      if (prevColumn == newColumn) {
        const tasks = prev[prevColumn];
        const prevIndex = activeTaskIndex;
        const nextIndex = tasks.findIndex(task => task.id == over.id);
        if (nextIndex == -1) return prev;
        tasks[prevIndex].position = computeNewPosition(tasks, nextIndex);
        return { ...prev, [prevColumn]: arrayMove(tasks, prevIndex, nextIndex) };
      }

      // Move task to a different column
      const sourceColumn = [...prev[prevColumn]];
      const [activeTask] = sourceColumn.splice(activeTaskIndex, 1);

      const destColumn = [...prev[newColumn]];
      const nextIndex = destColumn.findIndex(task => task.id == over.id);
      const insertIndex = nextIndex == -1 ? destColumn.length : nextIndex;
      destColumn.splice(
        insertIndex,
        0,
        {
          ...activeTask,
          status: newColumn,
          position: computeNewPosition(destColumn, insertIndex)
        }
      );

      return { ...prev, [prevColumn]: sourceColumn, [newColumn]: destColumn };
    });

    setSelectedTaskId(null);
  };

  const handleAddTask = () => {
    setEditingTask(null)
    setIsCreateModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsCreateModalOpen(true)
  }

  const handleCancel = () => {
    setIsCreateModalOpen(false)
    setEditingTask(null)
    setCurrentStatus(null)
  }

  function addTask(task: Task) {
    task.userId = prop.userId;
    task.assigneeId = prop.userId;
    setColumns(prev => {
      return {
        ...prev,
        [task.status]: [...prev[task.status], task]
      };
    });
  }

  function editTask(task: Task) {
    setColumns(prev => {
      let currentColumn = [...prev[task.status]];
      let taskIndex = currentColumn.findIndex(t => t.id == task.id);
      if (taskIndex == -1) return prev;
      currentColumn[taskIndex] = task;
      return {
        ...prev,
        [task.status]: currentColumn
      };
    });
  }

  const handleConfirm = (task: { taskId: string, title: string; description: string; dueDate: string; label: string; priority: Priority }) => {
    let [year, month, day] = task.dueDate.split("-").map(Number);
    let dueDateObj = new Date(year, month - 1, day);
    let status = currentStatus;
    if (!status) return;

    let tasks = columns[status];

    if (editingTask) {
      editTask({ ...editingTask, title: task.title, description: task.description, dueDate: dueDateObj, priority: task.priority })
    } else {
      addTask({
        id: task.taskId,
        userId: "",
        assigneeId: "",
        position: (tasks[tasks.length - 1]?.position ?? 0) + 1000,
        status: status,
        createdAt: new Date(),
        title: task.title,
        description: task.description,
        dueDate: dueDateObj,
        priority: task.priority
      })
    }
    setIsCreateModalOpen(false)
    setCurrentStatus(null)
    setEditingTask(null)
  }

  function deleteTask(task: Task) {
    setColumns(prev => {
      let currentColumn = [...prev[task.status]];
      let taskIndex = currentColumn.findIndex(t => t.id == task.id);
      if (taskIndex == -1) return prev;
      currentColumn.splice(taskIndex, 1);
      return {
        ...prev,
        [task.status]: currentColumn
      };
    });
  }

  const handleDelete = (task: Task) => {
    deleteTask(task)
    setIsCreateModalOpen(false)
    setEditingTask(null)
  }

  return (
    <div className="min-h-screen bg-[#282740] p-4">
      <DndContext
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        sensors={sensors}
      >
        <div className="flex gap-4 h-[calc(100vh-2rem)]">
          {Object.keys(columns).map((status) => (
            <div key={status as Status} className="flex-1 min-w-0">
              <Column
                status={status as Status}
                tasks={columns[status as Status]}
                onAddTask={() => {
                  handleAddTask();
                  setCurrentStatus(status as Status);
                }}
                onEdit={(task: Task) => {
                  handleEditTask(task);
                  setCurrentStatus(status as Status);
                }}
                onDelete={(task: Task) => {
                  handleDelete(task);
                  setCurrentStatus(status as Status);
                }}
              />
            </div>
          ))}
        </div>

        {selectedTaskId ? columns[selectedTaskId[1]].filter((task) => task.id == selectedTaskId[0]).map((task) => (
          <DragOverlay key={"overlay_" + task.id}>
            <TaskCard
              task={task}
              onEdit={() => { }}
              onDelete={() => { }}
              isDragging={true}
            />
          </DragOverlay>
        )) : null}
      </DndContext>

      <TaskModal
        isOpen={isCreateModalOpen}
        mode={editingTask ? 'view-edit' : 'create'}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        editingTask={editingTask}
        onDelete={handleDelete}
      />
    </div >
  );
}
