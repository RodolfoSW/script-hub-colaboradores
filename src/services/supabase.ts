
import { createClient } from '@supabase/supabase-js';

// For Lovable's native Supabase integration, use the automatic configuration
const supabaseUrl = "https://kxfqbfcqfczfkwcxxngd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZnFiZmNxZmN6ZmtXY3h4bmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MjI1MjUsImV4cCI6MjA0ODk5ODUyNX0.CrJw9t9A1djV02Hpkk8yFJhMLhvuMVRmKQUZzEhgXx4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
