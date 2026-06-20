// Website Creator: business profile, product catalog, AI generation, and saving.
//
// Logos and product images are uploaded to the public `business-assets` Storage
// bucket under the user's own folder. Generation is transient — the HTML is only
// persisted (one active site per user) when the user clicks "I like this".

import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import { loadOnboarding } from './onboarding';

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

export interface WebsiteInputs {
  businessName: string;
  businessType: string;
  about: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  discounts: string;
  tone: string;
  accentColor: string;
  backgroundColor: string;
  logoUrl: string | null;
  extra: string;
  products: Array<Pick<Product, 'name' | 'price' | 'description' | 'image_url'>>;
}

// A generated site is a set of files (filename -> contents) plus the live URL
// where they are hosted.
export type SiteFiles = Record<string, string>;
export interface GeneratedSite {
  files: SiteFiles;
}

export interface SavedWebsite {
  user_id: string;
  name: string;
  inputs: WebsiteInputs;
  html: string;            // index.html, kept for convenience
  files: SiteFiles | null;
  site_url: string | null;
  created_at: string;
  updated_at: string;
}

// Prefill values from the existing onboarding profile (business name/type/address
// and any logo already uploaded).
export async function loadBusinessProfile() {
  const ob = await loadOnboarding();
  let logoUrl: string | null = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from('onboarding')
      .select('logo_url')
      .eq('user_id', user.id)
      .maybeSingle();
    logoUrl = data?.logo_url ?? null;
  }
  return {
    businessName: ob?.businessName ?? '',
    businessType: ob?.businessType ?? '',
    address: ob?.address ?? '',
    logoUrl,
  };
}

async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');
  return user;
}

// Upload a file through the `upload-asset` edge function.
//
// Direct browser -> storage uploads were rejected by storage RLS even for the
// file's rightful owner. The function authenticates the user via their token and
// writes with the service role (bypassing storage RLS), while still forcing the
// destination into the user's own "<user_id>/" folder. `kind` is 'logo' or
// 'product'; the server decides the final path.
async function uploadAsset(kind: 'logo' | 'product', file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Your session has expired — please sign in again.');

  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);

  const res = await fetch(`${supabaseUrl}/functions/v1/upload-asset`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseAnonKey,
    },
    body: form,
  });

  let body: { url?: string; error?: string } = {};
  try { body = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok || !body.url) {
    throw new Error(body.error || `Upload failed (${res.status}).`);
  }
  return body.url;
}

// Upload a logo, store its public URL on the business profile, and return the URL.
export async function uploadLogo(file: File): Promise<string> {
  const user = await requireUser();
  const publicUrl = await uploadAsset('logo', file);

  // Persist on the onboarding profile so it's reusable across the app.
  await supabase
    .from('onboarding')
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  return publicUrl;
}

// Upload a product image and return its public URL.
export async function uploadProductImage(file: File): Promise<string> {
  return uploadAsset('product', file);
}

export async function loadProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });
  return (data as Product[]) ?? [];
}

export async function addProduct(args: {
  name: string;
  price: string;
  description: string;
  image_url: string | null;
}): Promise<Product> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      name: args.name,
      price: args.price,
      description: args.description,
      image_url: args.image_url,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string) {
  await supabase.from('products').delete().eq('id', id);
}

// Ask the AI edge function to build the multi-file website. It also hosts the
// files and returns them along with the live URL.
export async function generateWebsite(inputs: WebsiteInputs): Promise<GeneratedSite> {
  const { data, error } = await supabase.functions.invoke('generate-website', { body: { inputs } });
  if (error || !data?.files) {
    console.error('generate-website failed:', error, data);
    const backendErr = error?.message || data?.error || 'Unknown error';
    throw new Error(`Could not generate the website: ${backendErr}`);
  }
  return { files: data.files as SiteFiles };
}

// Ask the AI to revise the current (multi-file) website per a plain-English
// instruction. Returns the updated file set.
export async function editWebsite(args: { currentFiles: SiteFiles; instruction: string; inputs: WebsiteInputs }): Promise<GeneratedSite> {
  const { data, error } = await supabase.functions.invoke('generate-website', {
    body: { inputs: args.inputs, currentFiles: args.currentFiles, instruction: args.instruction },
  });
  if (error || !data?.files) {
    console.error('edit-website failed:', error, data);
    const backendErr = error?.message || data?.error || 'Unknown error';
    throw new Error(`Could not update the website: ${backendErr}`);
  }
  return { files: data.files as SiteFiles };
}

// Save (or replace) the user's one active website.
export async function saveWebsite(args: { name: string; inputs: WebsiteInputs; files: SiteFiles }): Promise<SavedWebsite> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('websites')
    .upsert(
      {
        user_id: user.id,
        name: args.name,
        inputs: args.inputs,
        html: args.files['index.html'] ?? '',
        files: args.files,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as SavedWebsite;
}

// Download every file of the site, one at a time (no zip needed).
export function downloadSite(files: SiteFiles) {
  const names = Object.keys(files);
  names.forEach((name, i) => {
    // Stagger slightly so the browser doesn't drop simultaneous downloads.
    setTimeout(() => {
      const type = name.endsWith('.css') ? 'text/css' : name.endsWith('.js') ? 'application/javascript' : 'text/html';
      const blob = new Blob([files[name]], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, i * 350);
  });
}

export async function loadWebsite(): Promise<SavedWebsite | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('websites')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  return (data as SavedWebsite) ?? null;
}

// Trigger a browser download of an HTML string as a .html file.
export function downloadHtml(html: string, filename = 'website.html') {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
