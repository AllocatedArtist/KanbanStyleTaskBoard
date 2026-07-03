import { createContext, useState, ReactNode, useContext, useEffect } from 'react'
import { Label, LabelContextValue, Task } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

const LabelContext = createContext<LabelContextValue | null>(null)

export function LabelProvider({ userId, children }: { userId: string; children: ReactNode }) {

  // All labels that belong to active user
  const [labelPool, setLabelPool] = useState<Label[]>([])

  // Array of id pairs connecting labels to tasks
  const [taskLabels, setTaskLabels] = useState<{ taskId: string; labelId: string }[]>([])

  useEffect(() => {
    async function loadLabels() {
      const { data, error } = await supabase.from('labels').select('*')

      if (error) {
        console.error(error.message);
        return;
      }

      let labels = data.map<Label>(label => {
        return {
          id: label.id,
          userId: label.user_id,
          name: label.name,
          color: label.color
        };
      });

      setLabelPool(labels);
    }

    async function loadTaskLabels() {
      const { data, error } = await supabase.from('task_labels').select('*')

      if (error) {
        console.error(error.message);
        return;
      }

      let taskLabelData = data.map<{ taskId: string; labelId: string }>(taskLabel => {
        return {
          taskId: taskLabel.task_id,
          labelId: taskLabel.label_id
        };
      });

      setTaskLabels(taskLabelData);
    }

    loadLabels();
    loadTaskLabels();
  }, []);

  function labelsForTask(taskId: string) {
    const ids = taskLabels.filter(tl => tl.taskId === taskId).map(tl => tl.labelId)
    return labelPool.filter(l => ids.includes(l.id))
  }

  function tasksForLabel(tasks: Task[], labelId: string) {
    const ids = taskLabels.filter(tl => tl.labelId === labelId).map(tl => tl.taskId)
    return tasks.filter(t => ids.includes(t.id));
  }

  async function attachLabel(taskId: string, labelId: string) {
    setTaskLabels(prev => [...prev, { taskId, labelId }])
    const { error } = await supabase
      .from('task_labels')
      .insert({ task_id: taskId, label_id: labelId })
      .select()
      .single()
    if (error) {
      console.error(error.message);
      return false
    }
    return true
  }

  function detachLabel(taskId: string, labelId: string) {
    setTaskLabels(prev => prev.filter(tl => !(tl.taskId === taskId && tl.labelId === labelId)))
    async function detachLabelEntry() {
      const { error } = await supabase
        .from('task_labels')
        .delete()
        .eq('task_id', taskId)
        .eq('label_id', labelId)
      if (error) console.error(error.message);
    }
    detachLabelEntry();
  }

  async function createLabel(id: string, name: string, color: string) {
    const newLabel: Label = { id, name, color, userId }
    setLabelPool(prev => [...prev, newLabel])
    const { error } = await supabase
      .from('labels')
      .insert({ id: id, user_id: userId, name: name, color: color })
      .select()
      .single()
    if (error) {
      console.error(error.message);
      return false
    }
    return true
  }

  function updateLabel(labelId: string, name: string, color: string) {
    let labelIndex = labelPool.findIndex(label => label.id == labelId);
    if (labelIndex == -1) return;
    labelPool[labelIndex].name = name;
    labelPool[labelIndex].color = color;
    setLabelPool(prev => {
      return prev.map(label => label.id == labelId ? { ...label, name, color } : label);
    });
    async function updateLabelEntry() {
      const { error } = await supabase
        .from('labels')
        .update({ name: name, color: color })
        .eq('id', labelId)
      if (error) console.error(error.message);
    }
    updateLabelEntry();
  }

  function deleteLabel(labelId: string) {
    setTaskLabels(prev => prev.filter(tl => tl.labelId !== labelId))
    setLabelPool(prev => prev.filter(label => label.id !== labelId))
    async function deleteLabelEntry() {
      const { error } = await supabase.from('labels').delete().eq('id', labelId)
      if (error) console.error(error.message);
    }
    deleteLabelEntry();
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
