import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwxmmkiwvhsjdztenwfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3eG1ta2l3dmhzamR6dGVud2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDI3MzUsImV4cCI6MjA5NzM3ODczNX0.uIyexlT9xPLgXLCvvHzjyjKNb7nMQgCEVtZl1rHLr6g';

export const supabase = createClient(supabaseUrl, supabaseKey);
