// Generating, saving, loading, and deleting social media campaigns.
// Generation is transient (nothing saved). Only "liked" campaigns are inserted.

import { supabase } from './supabase';

export interface CampaignInputs {
  product: string;
  platforms: string[];
  goal: string;
  tone: string;
  postCount: number;
  audience: string;
  extra: string;
}

export interface CampaignPost {
  platform: string;
  day: string;
  caption: string;
  hashtags: string[];
  imageIdea: string;
  generatedImage?: string; // data URL of the AI-generated image, if created
}

export interface Campaign {
  campaignName: string;
  overview: string;
  targetAudience: string;
  posts: CampaignPost[];
  tips: string[];
}

export interface SavedCampaign {
  id: string;
  name: string;
  inputs: CampaignInputs;
  content: Campaign;
  images: string[];
  created_at: string;
}

// Ask the AI edge function to write a campaign. Throws on failure.
export async function generateCampaign(inputs: CampaignInputs): Promise<Campaign> {
  const { data, error } = await supabase.functions.invoke('generate-campaign', { body: { inputs } });
  if (error || !data?.campaign) {
    console.error('generate-campaign failed:', error, data);
    throw new Error('Could not generate the campaign. Please try again.');
  }
  return data.campaign as Campaign;
}

// Generate a real image from a text prompt. Returns a data URL.
export async function generateImage(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-image', { body: { prompt } });
  if (error || !data?.image) {
    console.error('generate-image failed:', error, data);
    const backendErr = error?.message || data?.error || 'Unknown error';
    throw new Error(`Could not generate the image: ${backendErr}`);
  }
  return data.image as string;
}

// Save a liked campaign (with its uploaded images).
export async function saveCampaign(args: { inputs: CampaignInputs; content: Campaign; images: string[] }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      user_id: user.id,
      name: args.content.campaignName,
      inputs: args.inputs,
      content: args.content,
      images: args.images,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SavedCampaign;
}

export async function loadCampaigns(): Promise<SavedCampaign[]> {
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as SavedCampaign[]) ?? [];
}

export async function deleteCampaign(id: string) {
  await supabase.from('campaigns').delete().eq('id', id);
}
