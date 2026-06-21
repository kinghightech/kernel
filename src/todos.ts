// Dead-simple per-user checklist ("Today's to-do" on the dashboard home).
import { supabase } from './supabase';

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
}

export async function loadTodos(): Promise<Todo[]> {
  const { data } = await supabase
    .from('todos')
    .select('id, text, done, created_at')
    .order('created_at', { ascending: true });
  return (data as Todo[]) ?? [];
}

export async function addTodo(text: string): Promise<Todo | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('todos')
    .insert({ user_id: user.id, text })
    .select('id, text, done, created_at')
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
