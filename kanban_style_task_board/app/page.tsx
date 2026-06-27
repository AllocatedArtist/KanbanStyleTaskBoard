'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Task } from '@/lib/types'
import { LabelProvider } from '@/lib/LabelContext'

import dynamic from 'next/dynamic'
const Board = dynamic(() => import('@/components/Board'), { ssr: false })

export default function Page() {
  const [signedIn, setSignedIn] = useState(false);

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

  useEffect(() => {
    init();
  }, []);

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

  return (
    <>
      <LabelProvider userId={userId}>
        <Board tasks={[defaultTask, defaultTask2, defaultTask3]} userId={userId} onTaskUpdate={() => { }} />
      </LabelProvider>
    </>
  );
}
