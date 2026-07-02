import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensors,
  useSensor,
  DragStartEvent,
  DragOverlay,
  Active,
  Over
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable'


import Column from '../components/Column'
import TaskCard from '../components/TaskCard'
import TaskModal from './TaskModal'
import { Task, Status, Priority } from '@/lib/types'

interface BoardProps {
  tasks: Task[]
  userId: string
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  removeTask: (taskId: string) => void
  computeDropPosition: (status: Status, overId: string | null, dragId: string) => number
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
    "To Do": [],
    "In Progress": [],
    "In Review": [],
    "Done": []
  });

  useEffect(() => {
    setColumns({
      "To Do": prop.tasks.filter(task => task.status == "To Do"),
      "In Progress": prop.tasks.filter(task => task.status == "In Progress"),
      "In Review": prop.tasks.filter(task => task.status == "In Review"),
      "Done": prop.tasks.filter(task => task.status == "Done")
    });
  }, [prop.tasks]);

  // Update global task list when a task is moved
  useEffect(() => {
    if (!selectedTaskId) return;
    let taskId = selectedTaskId[0];
    if (taskId) {
      let column = findColumn(selectedTaskId[0]);
      let task = columns[column].find(task => task.id == taskId);
      if (task) editTask(task);
    }
    setSelectedTaskId(null);
  }, [columns]);

  const findColumn = (taskId: string) => {
    return Object
      .keys(columns)
      .find(status => columns[status as Status].some(task => task.id == taskId)) as Status;
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setSelectedTaskId([active.id as string, active.data.current?.status]);
  }

  function getLowerNeighborId(
    overId: string,
    edge: 'top' | 'bottom',
    visibleTasks: Task[]   // the filtered/visible list currently rendered in this column
  ): string | null {
    const overIndex = visibleTasks.findIndex(t => t.id === overId)

    if (edge === 'bottom') {
      return overId   // inserting after `over` → `over` IS the lower neighbor
    }

    // edge === 'top' → inserting before `over` → the lower neighbor is whatever's
    // visually above `over`, or null if `over` is the first card in view
    return overIndex > 0 ? visibleTasks[overIndex - 1].id : null
  }


  function getDropEdge(active: Active, over: Over): 'top' | 'bottom' {
    const overRect = over.rect
    const activeRect = active.rect.current.translated
    if (!overRect || !activeRect) return 'bottom'

    const overCenterY = overRect.top + overRect.height / 2
    const activeCenterY = activeRect.top + activeRect.height / 2

    return activeCenterY < overCenterY ? 'top' : 'bottom'
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!(over && over.id)) {
      return;
    }

    let newColumn = columns[over.id as Status] ? over.id as Status : findColumn(over.id as string);
    let taskId = selectedTaskId?.[0];
    let prevColumn = selectedTaskId?.[1] as Status;
    const activeTaskIndex = columns[prevColumn].findIndex((t) => t.id === taskId);
    if (activeTaskIndex == -1) {
      return;
    }

    // Move task from previous column to new column
    setColumns(prev => {
      const edge = getDropEdge(active, over)

      // Move task within the same column
      if (prevColumn == newColumn) {
        const tasks = prev[prevColumn];
        const prevIndex = activeTaskIndex;
        const nextIndex = tasks.findIndex(task => task.id == over.id);
        if (nextIndex == -1) return prev;
        const lowerNeighborId = getLowerNeighborId(over.id as string, edge, tasks)
        tasks[prevIndex].position = prop.computeDropPosition(prevColumn, lowerNeighborId, tasks[prevIndex].id);
        return { ...prev, [prevColumn]: arrayMove(tasks, prevIndex, nextIndex) };
      }

      // Move task to a different column
      const sourceColumn = [...prev[prevColumn]];
      const [activeTask] = sourceColumn.splice(activeTaskIndex, 1);

      const destColumn = [...prev[newColumn]];
      const nextIndex = destColumn.findIndex(task => task.id == over.id);
      const insertIndex = nextIndex == -1 ? destColumn.length : nextIndex;

      const lowerNeighborId = getLowerNeighborId(over.id as string, edge, destColumn)

      destColumn.splice(
        insertIndex,
        0,
        {
          ...activeTask,
          status: newColumn,
          position: prop.computeDropPosition(newColumn, lowerNeighborId, activeTask.id)
        }
      );

      return { ...prev, [prevColumn]: sourceColumn, [newColumn]: destColumn };
    });
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
    prop.addTask(task);
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

    prop.updateTask(task);
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

    prop.removeTask(task.id);
  }

  const handleDelete = (task: Task) => {
    deleteTask(task)
    setIsCreateModalOpen(false)
    setEditingTask(null)
  }

  return (
    <div className="h-full bg-[#282740] p-4 overflow-hidden">
      <DndContext
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        sensors={sensors}
      >
        <div className="flex gap-4 h-full min-h-0">
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
