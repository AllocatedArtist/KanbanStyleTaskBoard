import { createContext, useState, ReactNode, useContext } from 'react'
import { Label, LabelContextValue, Task } from '@/lib/types'

const LabelContext = createContext<LabelContextValue | null>(null)

export function LabelProvider({ userId, children }: { userId: string; children: ReactNode }) {

  // All labels that belong to active user
  const [labelPool, setLabelPool] = useState<Label[]>([])

  // Array of id pairs connecting labels to tasks
  const [taskLabels, setTaskLabels] = useState<{ taskId: string; labelId: string }[]>([])

  function labelsForTask(taskId: string) {
    const ids = taskLabels.filter(tl => tl.taskId === taskId).map(tl => tl.labelId)
    return labelPool.filter(l => ids.includes(l.id))
  }

  function tasksForLabel(tasks: Task[], labelId: string) {
    const ids = taskLabels.filter(tl => tl.labelId === labelId).map(tl => tl.taskId)
    return tasks.filter(t => ids.includes(t.id));
  }

  function attachLabel(taskId: string, labelId: string) {
    setTaskLabels(prev => [...prev, { taskId, labelId }])
  }

  function detachLabel(taskId: string, labelId: string) {
    setTaskLabels(prev => prev.filter(tl => !(tl.taskId === taskId && tl.labelId === labelId)))
  }

  function createLabel(id: string, name: string, color: string) {
    const newLabel: Label = { id, name, color, userId }
    setLabelPool(prev => [...prev, newLabel])
  }

  function updateLabel(labelId: string, name: string, color: string) {
    let labelIndex = labelPool.findIndex(label => label.id == labelId);
    if (labelIndex == -1) return;
    labelPool[labelIndex].name = name;
    labelPool[labelIndex].color = color;
    setLabelPool(prev => {
      return prev.map(label => label.id == labelId ? { ...label, name, color } : label);
    });
  }

  function deleteLabel(labelId: string) {
    setTaskLabels(prev => prev.filter(tl => tl.labelId !== labelId))
    setLabelPool(prev => prev.filter(label => label.id !== labelId))
  }

  return (
    <LabelContext.Provider value={{ labelPool, labelsForTask, attachLabel, detachLabel, createLabel, updateLabel, deleteLabel, tasksForLabel }}>
      {children}
    </LabelContext.Provider>
  )
}

export function useLabels() {
  const ctx = useContext(LabelContext)
  if (!ctx) throw new Error('useLabels must be used within a LabelProvider')
  return ctx
}
