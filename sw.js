// ============================================================
//  買い物メモ — service worker
//  「ホーム画面に追加」で全画面アプリとして開けるようにし、
//  画面の枠組み（HTML/CSS/JS/アイコン）をキャッシュして、
//  電波が弱いときでもすぐ開けるようにします。
//  ※ 品物データは Supabase から毎回オンラインで取得します。
// ============================================================

// キャッシュ名。ファイルを更新したら末尾の数字を上げると、
// 各端末で新しい内容に更新されます（例: v2 → v3）。
const CACHE_NAME = "kaimono-memo-v3";

// 事前にキャッシュしておくファイル（アプリの「殻」）
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

// インストール時：殻をキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 有効化時：古いキャッシュを掃除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 取得時の方針：「ネットワーク優先」
//  - Supabase など外部への通信（API / Realtime）はキャッシュせず素通し。
//  - 自分のファイル（同じオリジン）は、まずネットワークから最新を取得し、
//    成功したらキャッシュも更新。オフラインのときだけキャッシュを使う。
//  → これで、GitHub に上げ直した内容がすぐ反映されます
//    （キャッシュ優先だと、古いファイルが残り続ける問題があるため）。
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // GET 以外、または別オリジン（Supabase / CDN）は素通し
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 取得できたら、その最新版をキャッシュにも保存しておく
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req)) // オフライン時はキャッシュから
  );
});
