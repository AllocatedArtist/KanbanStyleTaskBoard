'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Page() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    async function test() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) await supabase.auth.signInAnonymously()

      const { data, error } = await supabase.from('tasks').select('*')
      setStatus(error ? `Error: ${error.message}` : `Connected. Tasks: ${data?.length}`)
    }
    test()
  }, [])

  return <main className="p-8 text-lg">{status}</main>
}
