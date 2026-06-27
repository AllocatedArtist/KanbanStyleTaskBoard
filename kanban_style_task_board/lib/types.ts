
export type Status = 'To Do' | 'In Progress' | 'In Review' | 'Done';
export type Priority = 'Low' | 'Normal' | 'High'

export interface Label {
  id: string
  name: string
  color: string
  userId: string
}

export interface LabelContextValue {
  labelPool: Label[]
  labelsForTask: (taskId: string) => Label[]
  attachLabel: (taskId: string, labelId: string) => void
  detachLabel: (taskId: string, labelId: string) => void
  createLabel: (name: string, color: string, taskId: string) => void
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
