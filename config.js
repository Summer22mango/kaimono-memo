// ============================================================
//  Supabase 接続設定
//  ↓ Supabase の「Settings → API」からコピーして貼ってください
// ============================================================

// プロジェクトの URL（例: https://xxxxxxxx.supabase.co）
const SUPABASE_URL = "https://ongrifhggruaywwsglcb.supabase.co";

// anon public キー（eyJ... で始まる長い文字列）
const SUPABASE_ANON_KEY = "sb_publishable_Fow8y1RGIcREfy_OtVC8mQ_YRFa5W-e";

// ------------------------------------------------------------
//  メモ：
//  この anon キーは「公開されても良い前提」のキーです。
//  ただし家族用アプリなので、URL（GitHub Pages のアドレス）は
//  家族だけに教えて、他の人に広めないようにしてください。
//  データベース側は RLS を allow-all（誰でも読み書き可）に
//  している前提です。もし将来きちんと保護したくなったら、
//  Supabase の RLS ポリシーとログイン機能の追加を検討してください。
// ------------------------------------------------------------
