import { useEffect, useMemo, useState } from 'react';
import { ListChecks, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import {
  loadTodos, addTodo, toggleTodo, deleteTodo, todayStr, type Todo,
} from '../todos';

const card = 'rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]';

function groupLabel(date: string | null): string {
  if (!date) return 'Anytime';
  const today = todayStr();
  if (date === today) return 'Today';
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function Checklist() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [date, setDate] = useState(todayStr());

  useEffect(() => { loadTodos().then((t) => { setTodos(t); setLoading(false); }); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    const created = await addTodo(t, date || null);
    if (created) setTodos((p) => [...p, created]);
  };

  const handleToggle = async (t: Todo) => {
    setTodos((p) => p.map((x) => x.id === t.id ? { ...x, done: !x.done } : x));
    await toggleTodo(t.id, !t.done);
  };

  const handleDelete = async (id: string) => {
    setTodos((p) => p.filter((x) => x.id !== id));
    await deleteTodo(id);
  };

  // Group by due_date, ordered: Today, upcoming, anytime, past.
  const groups = useMemo(() => {
    const map = new Map<string, Todo[]>();
    for (const t of todos) {
      const key = t.due_date ?? 'none';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    const today = todayStr();
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 'none') return 1;
      if (b === 'none') return -1;
      // today first
      if (a === today) return -1;
      if (b === today) return 1;
      return a < b ? -1 : 1;
    });
  }, [todos]);

  return (
    <div className="relative h-full overflow-y-auto bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white">
      <div className="absolute inset-0 pointer-events-none opacity-30 hidden dark:block" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2.5 mb-1">
          <ListChecks className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">Checklist</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-white/50 mb-8">
          Add tasks for any day — each one shows up in "Today's to-do" on your home page when its day arrives.
        </p>

        {/* Add task */}
        <form onSubmit={handleAdd} className={`${card} p-4 flex flex-col sm:flex-row gap-3 mb-8`}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs to get done?"
            className="flex-1 rounded-xl px-4 py-3 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors placeholder:text-neutral-400 dark:placeholder:text-white/30"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl px-3 py-3 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-black/30 dark:focus:border-white/30"
          />
          <button type="submit" className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {loading ? (
          <div className="flex items-center gap-2 text-neutral-500 dark:text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : todos.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-white/30">No tasks yet. Add your first one above.</p>
        ) : (
          <div className="space-y-8">
            {groups.map(([key, items]) => (
              <div key={key}>
                <h2 className="text-sm font-semibold text-neutral-500 dark:text-white/60 mb-3">{groupLabel(key === 'none' ? null : key)}</h2>
                <div className={`${card} divide-y divide-black/5 dark:divide-white/5`}>
                  {items.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 group px-4 py-3">
                      <button
                        onClick={() => handleToggle(t)}
                        className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-black/20 dark:border-white/20 hover:border-emerald-500'
                        }`}
                      >
                        {t.done && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <span className={`flex-1 text-sm ${t.done ? 'line-through text-neutral-400 dark:text-white/30' : ''}`}>{t.text}</span>
                      <button onClick={() => handleDelete(t.id)} className="shrink-0 text-neutral-300 hover:text-red-500 dark:text-white/20 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
