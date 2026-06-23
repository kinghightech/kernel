// Frontend helpers for social connections via Composio (Instagram/TikTok/YouTube).
//
// Mirrors src/square.ts: the connect flow lives in the `composio-connect` edge
// function addressed by sub-path (/start, /status, /disconnect), so we use raw
// fetch and attach the user's token by hand. Posting goes through `composio-post`.
//
// Connect UX: Composio hosts the OAuth callback, so we open its URL in a popup
// and poll /status until the account turns active, then close the popup. This
// keeps the owner inside our app instead of stranding them on Composio's page.

import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';

export type Platform = 'instagram' | 'tiktok' | 'youtube';

const CONNECT_BASE = `${supabaseUrl}/functions/v1/composio-connect`;
const POST_BASE = `${supabaseUrl}/functions/v1/composio-post`;

async function authedFetch(base: string, action: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';
  return fetch(`${base}/${action}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
}

export interface SocialConnection {
  platform: Platform;
  status: 'pending' | 'active' | string;
  connected_account_id?: string;
  label?: string | null;
}

// --- Simple in-memory cache so the status doesn't refetch on every page nav ---
// Persists for the life of the SPA session. Invalidated on connect/disconnect.
let statusCache: SocialConnection[] | null = null;
let inflight: Promise<SocialConnection[]> | null = null;

// Synchronous peek at the cache (null if never loaded). Lets the UI render
// instantly on remount instead of showing "Checking…" again.
export function getCachedStatus(): SocialConnection[] | null {
  return statusCache;
}

// Read which platforms this business has connected (source of truth: Composio).
// Returns the cache immediately when warm; pass force=true to revalidate.
export async function getSocialStatus(force = false): Promise<SocialConnection[]> {
  if (!force && statusCache) return statusCache;
  if (!force && inflight) return inflight; // de-dupe concurrent callers
  inflight = (async () => {
    try {
      const res = await authedFetch(CONNECT_BASE, 'status', { method: 'POST', body: '{}' });
      const data = await res.json();
      if (!res.ok) return statusCache ?? [];
      statusCache = (data?.connections ?? []) as SocialConnection[];
      return statusCache;
    } catch (e) {
      console.error('social status error:', e);
      return statusCache ?? [];
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

// Start connecting a platform. Opens Composio's OAuth page in a popup and
// resolves true once the account is active (or false on timeout/cancel).
export async function connectPlatform(platform: Platform): Promise<boolean> {
  const res = await authedFetch(CONNECT_BASE, 'start', {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });
  const data = await res.json();
  if (!res.ok || !data?.url) {
    console.error('social connect start error:', data);
    alert(`Could not start the ${platform} connection. Please try again.`);
    return false;
  }

  const popup = window.open(data.url as string, '_blank', 'width=600,height=800');

  // Poll status until this platform reports active (max ~2 minutes).
  // force=true so each poll actually hits the server (and refreshes the cache).
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const conns = await getSocialStatus(true);
    if (conns.some((c) => c.platform === platform && c.status === 'active')) {
      popup?.close();
      return true;
    }
    if (popup?.closed) break; // user closed the window
  }
  popup?.close();
  return false;
}

export async function disconnectPlatform(platform: Platform): Promise<boolean> {
  const res = await authedFetch(CONNECT_BASE, 'disconnect', {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });
  if (res.ok && statusCache) {
    statusCache = statusCache.filter((c) => c.platform !== platform); // keep cache in sync
  }
  return res.ok;
}

export interface ComposioTool {
  slug: string;
  name: string;
  description: string;
}

// Discover the available action slugs for a platform (use these for postAction).
export async function listActions(platform: Platform): Promise<ComposioTool[]> {
  const res = await authedFetch(POST_BASE, 'tools', {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('listActions error:', data);
    return [];
  }
  return (data?.tools ?? []) as ComposioTool[];
}

// Run an approved action (e.g. publish a post). Call this AFTER the owner
// approves in your UI. `tool` is a slug from listActions().
export async function postAction(tool: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await authedFetch(POST_BASE, 'execute', {
    method: 'POST',
    body: JSON.stringify({ tool, arguments: args }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('postAction error:', data);
    throw new Error(data?.error ?? 'Action failed.');
  }
  return data.result;
}

// Publish a single-image Instagram post (handles the 2-step create+publish
// server-side). `imageUrl` must be publicly reachable. `igUserId` is the
// Instagram Business Account ID — pass it the first time; it's then remembered.
export async function publishInstagramPost(opts: {
  caption: string;
  imageUrl: string;
  igUserId?: string;
}): Promise<unknown> {
  const res = await authedFetch(POST_BASE, 'instagram-publish', {
    method: 'POST',
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('publishInstagramPost error:', data);
    throw new Error(data?.error ?? 'Post failed.');
  }
  return data.result;
}
