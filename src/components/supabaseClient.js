import { createClient } from '@supabase/supabase-js'

// 環境変数からSupabaseのURLとキーを読み込みます
// Viteを使用している場合は import.meta.env.VITE_SUPABASE_URL などになります

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Check your .env file.');
  alert('エラー: SupabaseのURLまたはキーが設定されていません。.envファイルを確認し、サーバーを再起動してください。');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // これをfalseにすると、リロードするたびにログインが必要になります
  },
})