import { createClient } from '@supabase/supabase-js';

// SUBSTITUA A URL ABAIXO PELA URL DO SEU PROJETO SUPABASE
// Você encontra isso no painel do Supabase em: Settings > API > Project URL
const supabaseUrl = 'https://qosgrqdfeqzxnzhmwomv.supabase.co';

// Chave Pública (segura para usar no front-end graças ao RLS que configuramos)
const supabaseAnonKey = 'sb_publishable_zoJXnL-UHMj20tx_ml0O7A_tXG29lOZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
