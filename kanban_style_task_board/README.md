# Kanban Board

A guest-friendly kanban board for managing tasks visually. No sign-up required — open the app and start working immediately.

## Features

- **Drag and drop** tasks across four fixed columns: To Do, Doing, Review, and Done
- **Guest accounts** — anonymous sign-in on first visit, session persists across refreshes in the same browser
- **Task details** — title, description, priority, due date, assignee, and labels
- **Labels** — create a reusable label pool, assign multiple labels per task, filter by label
- **Search and filter** — filter by title, label, priority, or due date
- **Due date indicators** — visual badges for overdue and upcoming tasks

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Supabase](https://supabase.com) — Postgres database, anonymous auth, row-level security
- [Tailwind CSS](https://tailwindcss.com)
- [@dnd-kit](https://dndkit.com) — drag and drop

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <your-repo-url>
   cd <project-folder>
   npm install
   ```

2. Create a `.env.local` file in the project root:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. Run the SQL schema in your Supabase SQL editor (see `schema.sql` in the repo root).

4. In your Supabase dashboard, enable **Anonymous Sign-Ins** under Authentication → Sign In / Providers.

5. Start the dev server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deployment

The app is deployed on [Vercel](https://vercel.com). Set the same two environment variables from step 2 under **Project Settings → Environment Variables**, and set the **Root Directory** to the project subfolder if applicable.

## Notes

- Each guest's data is private — row-level security ensures users can only read and modify their own tasks.
- A guest's session is tied to their browser. Opening the app in a new browser or private window creates a new guest account.
- Supabase free-tier projects pause after 7 days of inactivity. If the board appears empty on first load, check that your Supabase project is active in the dashboard.
