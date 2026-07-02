'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

import dynamic from 'next/dynamic'
const Board = dynamic(() => import('@/components/Board'), { ssr: false })

import FilterBar from "@/components/FilterBar"
import { Task } from '@/lib/types'
import { LabelProvider } from '@/lib/LabelContext'

export default function Page() {
  const [signedIn, setSignedIn] = useState(false);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [searchedTasks, setSearchedTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string>("");

  async function init() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }
      if (!session?.user?.id) {
        throw new Error("Unable to fetch user id.");
      } else {
        setUserId(session.user.id);
      }

      const { error } = await supabase.from('tasks').select('id').limit(1);
      if (error) throw error;

      setSignedIn(true);
    } catch (err: any) {
      console.error(err.message);
    }
  }

  let defaultTask: Task = {
    id: "blah",
    title: "Dishes",
    status: "To Do",
    userId: "johnwick",
    createdAt: new Date(2026, 5, 21),
    position: 1000.0,
    description: "Wash those diry dishes!",
    priority: "Normal",
    dueDate: new Date(2026, 6, 21),
    assigneeId: ""
  };

  let defaultTask2: Task = {
    id: "blah2",
    title: "Shower",
    status: "To Do",
    userId: "johnwick",
    createdAt: new Date(2026, 5, 21),
    position: 2000.0,
    description: "Shower dude!!!",
    priority: "Low",
    dueDate: new Date(2026, 6, 21),
    assigneeId: ""
  };

  let defaultTask3: Task = {
    id: "blah3",
    title: "Code",
    status: "To Do",
    userId: "johnwick",
    createdAt: new Date(2026, 5, 21),
    position: 3000.0,
    description: "Write the app man!",
    priority: "High",
    dueDate: new Date(2026, 6, 21),
    assigneeId: ""
  };

  useEffect(() => {
    init();
    setAllTasks([defaultTask, defaultTask2, defaultTask3]);
    setFilteredTasks([defaultTask, defaultTask2, defaultTask3]);
    setSearchedTasks([defaultTask, defaultTask2, defaultTask3]);
  }, []);

  return (
    <div className="h-screen overflow-hidden">
      <LabelProvider userId={userId}>
        <div className="flex h-full flex-col overflow-hidden">
          <FilterBar
            allTasks={searchedTasks}
            onSearch={(queries) => {
              if (queries.length == 0) {
                setSearchedTasks(allTasks);
                setFilteredTasks(allTasks);
                return;
              }

              let filteredTasks = allTasks
                .filter(task =>
                  queries.some(
                    query => task.title.toLowerCase().includes(query.toLowerCase())
                  )
                );

              setSearchedTasks(filteredTasks);
              setFilteredTasks(filteredTasks);
            }}
            onToggleLabel={tasks => {
              setFilteredTasks([...tasks]);
            }}
          />
          <div className="flex-1 min-h-0 overflow-hidden">
            <Board
              tasks={filteredTasks}
              userId={userId}
              addTask={(task: Task) => {
                setAllTasks(prev => [...prev, task]);
                setSearchedTasks(prev => [...prev, task]);
                setFilteredTasks(prev => [...prev, task]);
              }}
              updateTask={(task: Task) => {
                const update = (prev: Task[]) => {
                  let allTaskCopy = [...prev];
                  let taskIndex = allTaskCopy.findIndex(t => t.id == task.id);
                  if (taskIndex == -1) return allTaskCopy;
                  allTaskCopy[taskIndex] = task;
                  return allTaskCopy;
                }
                setAllTasks(prev => update(prev));
                setSearchedTasks(prev => update(prev));
                setFilteredTasks(prev => update(prev));
              }}
              removeTask={(taskId: string) => {
                setAllTasks(prev => prev.filter(task => task.id !== taskId));
                setSearchedTasks(prev => prev.filter(task => task.id !== taskId));
                setFilteredTasks(prev => prev.filter(task => task.id !== taskId));
              }}
              computeDropPosition={(status, overId, dragId) => {
                const others = allTasks
                  .filter(t => t.id !== dragId && t.status == status)
                  .sort((a, b) => a.position - b.position)

                const lowerIndex = overId
                  ? others.findIndex(t => t.id === overId)
                  : -1

                const prev = lowerIndex >= 0 ? others[lowerIndex] : null
                const next = lowerIndex >= 0 ? others[lowerIndex + 1] : others[0]   // true next in full order — may be hidden

                if (!prev && !next) return 1000
                if (!prev) return next.position / 2
                if (!next) return prev.position + 1000
                return (prev.position + next.position) / 2
              }}
            />
          </div>
        </div>
      </LabelProvider >
    </div>
  );
}
