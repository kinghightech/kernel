// Per-user checklist. The Checklist page is where items are created (each with a
// day). The dashboard "Today's to-do" shows only items due today and is check-off
// only. Items with no due_date are treated as always showing.
import { supabase } from './supabase';

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  due_date: string | null; // YYYY-MM-DD
  created_at: string;
}

// Local YYYY-MM-DD (not UTC) so "today" matches the user's calendar day.
export function todayStr(): string {
  return new Date().toLocaleDateString('en-CA'); // en-CA formats as YYYY-MM-DD
}

const COLS = 'id, text, done, due_date, created_at';

// Everything, for the Checklist page.
export async function loadTodos(): Promise<Todo[]> {
  const { data } = await supabase.from('todos').select(COLS).order('due_date', { ascending: true, nullsFirst: true }).order('created_at', { ascending: true });
  return (data as Todo[]) ?? [];
}

// Just today's items (plus undated), for the dashboard home.
export async function loadTodayTodos(): Promise<Todo[]> {
  const today = todayStr();
  const { data } = await supabase
    .from('todos')
    .select(COLS)
    .or(`due_date.eq.${today},due_date.is.null`)
    .order('created_at', { ascending: true });
  return (data as Todo[]) ?? [];
}

export async function addTodo(text: string, dueDate: string | null): Promise<Todo | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('todos')
    .insert({ user_id: user.id, text, due_date: dueDate })
    .select(COLS)
    .single();
  if (error) { console.error('addTodo failed', error); return null; }
  return data as Todo;
}

export async function toggleTodo(id: string, done: boolean): Promise<void> {
  await supabase.from('todos').update({ done }).eq('id', id);
}

export async function deleteTodo(id: string): Promise<void> {
  await supabase.from('todos').delete().eq('id', id);
}
