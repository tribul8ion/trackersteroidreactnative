import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kzompunxcslxxboyoqdp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6b21wdW54Y3NseHhib3lvcWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzkxMjUsImV4cCI6MjA2Mzc1NTEyNX0.PjYVsu3h_MOFYNCUdORJGnr28s0_h-6M1T8t4uppjhA';
 
export const supabase = createClient(supabaseUrl, supabaseKey); 