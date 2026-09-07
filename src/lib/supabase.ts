import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cubtybdctiqrcfcqufxh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RxRgtD3jTOkRLBPRgAagUg_eFkxc1To';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
