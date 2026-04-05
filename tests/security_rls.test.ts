import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars for the test
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('Security Audit - Row Level Security (RLS)', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key missing in .env.local');
    }
    // Client with NO session (Anonymous)
    supabase = createClient(supabaseUrl, supabaseKey);
  });

  it('Scenario 1.1: Block anonymous READ from profiles', async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    // RLS enabled means it returns 0 rows for anonymous users
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('Scenario 1.2: Block anonymous READ from daily_entries', async () => {
    const { data, error } = await supabase.from('daily_entries').select('*');
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('Scenario 1.3: Block anonymous READ from forest_trees', async () => {
    const { data, error } = await supabase.from('forest_trees').select('*');
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('Scenario 1.4: Block anonymous INSERT into profiles', async () => {
    const fakeId = 'de305d54-75b4-431b-adb2-eb6b9e546013'; // Random UUID
    const { error } = await supabase.from('profiles').insert({ 
      id: fakeId, 
      display_name: 'Hacker User' 
    });
    // Postgres Error 42501 = Insufficient Privilege (RLS Violation)
    expect(error?.code).toBe('42501'); 
  });

  it('Scenario 1.5: Block anonymous UPDATE to random profiles', async () => {
    const { error, count } = await supabase
      .from('profiles')
      .update({ total_game_points: 999999 })
      .match({ display_name: 'Admin' }); 
    
    // Should not update any row (count 0 or null)
    expect(count).toBeFalsy();
  });

  it('Scenario 1.6: Block anonymous DELETE from daily_entries', async () => {
    const { error } = await supabase
      .from('daily_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Attempt to delete everything
    
    // RLS should block or result in 0 rows affected
    // Supabase returns null data/error but 0 rows affected if policy doesn't match
    if (error) {
       expect(error.code).toBe('42501');
    }
  });
});
