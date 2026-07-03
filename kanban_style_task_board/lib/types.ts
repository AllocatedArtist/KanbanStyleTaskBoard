
export type Status = 'To Do' | 'In Progress' | 'In Review' | 'Done';
export type Priority = 'Low' | 'Normal' | 'High'
export type DueDateBadgeState = 'warning' | 'today' | 'overdue'

export function getDayOffset(dueDate: Date) {
  const now = new Date()
  const dueDay = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  const currentDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((dueDay - currentDay) / 86400000)
}

export function getDueDateBadgeState(dueDate: Date): DueDateBadgeState | null {
  const dayOffset = getDayOffset(dueDate)
  if (dayOffset < 0) return 'overdue'
  if (dayOffset === 0) return 'today'
  if (dayOffset === 1) return 'warning'
  return null
}

export interface Label {
  id: string
  name: string
  color: string
  userId: string
}

export interface LabelContextValue {
  labelPool: Label[]
  labelsForTask: (taskId: string) => Label[]
  tasksForLabel: (tasks: Task[], labelId: string) => Task[]
  attachLabel: (taskId: string, labelId: string) => Promise<boolean>
  detachLabel: (taskId: string, labelId: string) => void
  createLabel: (id: string, name: string, color: string) => Promise<boolean>
  updateLabel: (labelId: string, name: string, color: string) => void
  deleteLabel: (labelId: string) => void
}

export interface Task {
  id: string
  title: string
  status: Status
  userId: string
  createdAt: Date
  position: number
  description: string
  priority: Priority
  dueDate: Date
  assigneeId: string
};
