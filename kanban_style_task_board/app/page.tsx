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
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        session = data.session;
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
      return false;
    }
    return true;
  }

  async function loadTasks() {
    const { data, error } = await supabase.from('tasks').select('*')

    if (error) {
      console.error(error.message);
      return;
    }

    let tasks = data.map<Task>(task => {
      return {
        ...task,
        dueDate: new Date(task.due_date),
        createdAt: new Date(task.created_at),
        userId: task.user_id,
        assigneeId: task.assignee_id
      };
    });

    setAllTasks(tasks);
    setFilteredTasks(tasks);
    setSearchedTasks(tasks);
  }

  useEffect(() => {
    async function start() {
      let ok = await init();
      if (ok) {
        await loadTasks();
      }
    }
    start();
  }, []);

  if (!signedIn) {
    return (
      <div className="h-screen overflow-hidden bg-[#282740] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12 animate-spin">
            <div className="absolute inset-0 rounded-full border-4 border-[#555673] border-t-[#A6445E] border-r-[#F25C5C]" />
            <div className="absolute inset-2 rounded-full bg-[#1a1a2e] flex items-center justify-center">
              <div className="h-3 w-7 rounded-full border border-[#AD9BBF]/40 bg-[#282740] flex items-center px-0.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#F25C5C] shadow-[0_0_10px_rgba(242,92,92,0.65)]" />
              </div>
            </div>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#AD9BBF]">
            Signing you in
          </span>
        </div>
      </div>
    );
  }

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
                task.userId = userId;
                task.assigneeId = userId;

                setAllTasks(prev => [...prev, task]);
                setSearchedTasks(prev => [...prev, task]);
                setFilteredTasks(prev => [...prev, task]);
                async function addTask() {
                  const { error } = await supabase
                    .from('tasks')
                    .insert({
                      id: task.id,
                      title: task.title,
                      description: task.description,
                      status: task.status,
                      priority: task.priority,
                      position: task.position,
                      due_date: task.dueDate.toISOString(),
                      user_id: task.userId,
                      assignee_id: task.assigneeId,
                      created_at: task.createdAt.toISOString(),
                    })
                    .select()   // returns the inserted row(s) back — otherwise insert returns nothing
                    .single()   // collapses array → single object (use only when you expect exactly 1 row)
                  if (error) console.error(error.message);
                }
                addTask();
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

                async function updateTask() {
                  const { error } = await supabase
                    .from('tasks')
                    .update({
                      id: task.id,
                      title: task.title,
                      description: task.description,
                      status: task.status,
                      priority: task.priority,
                      position: task.position,
                      due_date: task.dueDate.toISOString(),
                      user_id: task.userId,
                      assignee_id: task.assigneeId,
                      created_at: task.createdAt.toISOString(),
                    })
                    .eq('id', task.id)
                  if (error) console.error(error.message);
                }

                updateTask();
              }}
              removeTask={(taskId: string) => {
                setAllTasks(prev => prev.filter(task => task.id !== taskId));
                setSearchedTasks(prev => prev.filter(task => task.id !== taskId));
                setFilteredTasks(prev => prev.filter(task => task.id !== taskId));
                async function removeTask() {
                  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
                  if (error) console.error(error.message);
                }
                removeTask();
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
