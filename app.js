// ============================================================
//  買い物メモ — アプリ本体
//  すべての品物を items テーブルで管理します。
//   - status:   'buy'（買い物リスト）/ 'fridge'（冷蔵庫）/ 'home'（家にあるもの・日用品）
//   - category: 品物のカテゴリー（野菜・肉魚・日用品 など）
//  買い物リストでチェックすると、カテゴリーに応じて
//  「冷蔵庫」または「家にあるもの」へ自動で移動します。
// ============================================================

// ------------------------------------------------------------
//  カテゴリー定義
//  key   : データベースに保存する値
//  label : 画面に出す日本語
//  emoji : 見出しのアイコン
//  dest  : チェックしたときの移動先 status（'fridge' または 'home'）
//  ★ ここに新しいカテゴリーを足せば、そのまま拡張できます。
// ------------------------------------------------------------
const CATEGORIES = [
  { key: "vegetable", label: "野菜",     emoji: "🥬", dest: "fridge" },
  { key: "fruit",     label: "果物",     emoji: "🍎", dest: "fridge" },
  { key: "dairy",     label: "乳製品",   emoji: "🥛", dest: "fridge" },
  { key: "frozen",    label: "冷凍食品", emoji: "🧊", dest: "fridge" },
  { key: "meat_fish", label: "肉・魚",   emoji: "🍖", dest: "fridge" },
  { key: "daily",     label: "日用品",   emoji: "🧴", dest: "home"   },
  { key: "other",     label: "その他",   emoji: "🛒", dest: "fridge" },
];

// カテゴリー key から定義を引くための辞書
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

// カテゴリーが未設定・不明なときの扱い（食材として冷蔵庫へ）
const FALLBACK_CATEGORY = "other";

// カテゴリー key から移動先 status を求める
function destOf(categoryKey) {
  const c = CATEGORY_MAP[categoryKey] || CATEGORY_MAP[FALLBACK_CATEGORY];
  return c.dest;
}
// カテゴリー key から表示用の { label, emoji } を求める
function labelOf(categoryKey) {
  return CATEGORY_MAP[categoryKey] || CATEGORY_MAP[FALLBACK_CATEGORY];
}

// ------------------------------------------------------------
//  カテゴリー自動判定の辞書
//  品名に含まれるキーワードから、カテゴリーを推測します。
//  上から順に照合し、最初に一致したカテゴリーを採用します。
//  （「冷凍」を先に見るので「冷凍野菜」は冷凍食品になります）
//  ★ 母がよく買う物に合わせて、ここに単語を足していけます。
//  ※ 判定できない品物は FALLBACK_CATEGORY（＝その他→冷蔵庫）になります。
// ------------------------------------------------------------
const CATEGORY_KEYWORDS = [
  ["frozen", [
    "冷凍", "アイス", "シャーベット", "ハーゲンダッツ", "ジェラート",
  ]],
  ["daily", [
    // 洗剤・掃除・洗濯
    "洗剤", "柔軟剤", "漂白剤", "洗濯", "重曹", "クエン酸",
    // 紙もの
    "ティッシュ", "ティシュ", "トイレットペーパー", "トイレット", "トイレ",
    "キッチンペーパー", "ペーパータオル", "キッチンタオル", "ウェットティッシュ",
    // バス・ヘアケア・スキンケア
    "シャンプー", "リンス", "コンディショナー", "トリートメント",
    "ボディソープ", "ボディーソープ", "ハンドソープ", "石鹸", "石けん", "せっけん",
    "洗顔", "クレンジング", "化粧水", "乳液", "美容液", "日焼け止め",
    "コットン", "綿棒", "めんぼう", "化粧",
    // オーラルケア
    "歯ブラシ", "歯磨き", "はみがき", "デンタル", "マウスウォッシュ", "フロス",
    // 髭・カミソリ
    "髭剃り", "ひげそり", "カミソリ", "シェーバー",
    // 衛生・医療
    "マスク", "消毒", "除菌", "アルコール", "絆創膏", "ばんそうこう",
    "生理用品", "ナプキン", "タンポン", "オムツ", "おむつ", "おしりふき",
    // ラップ・保存
    "ラップ", "サランラップ", "アルミホイル", "ホイル", "クッキングシート",
    "ジップロック", "保存袋", "フリーザーバッグ", "キッチンバサミ",
    // 袋・ゴミ
    "ゴミ袋", "ごみ袋", "レジ袋", "ポリ袋",
    // 掃除道具
    "スポンジ", "たわし", "ふきん", "布巾", "雑巾", "ぞうきん",
    "掃除", "そうじ", "掃除機", "フィルター",
    // 日用雑貨
    "電池", "乾電池", "電球", "蛍光灯", "ライター", "ハンガー", "洗濯ばさみ",
    "虫除け", "虫よけ", "殺虫剤", "蚊取り", "消臭", "芳香剤", "カイロ",
    "ゴム手袋", "手袋", "タオル", "つめきり", "爪切り", "耳かき",
  ]],
  ["meat_fish", [
    // 肉
    "肉", "牛肉", "豚肉", "鶏肉", "鳥肉", "ひき肉", "挽肉", "ミンチ", "合挽",
    "鶏", "鶏むね", "鶏もも", "とりむね", "とりもも", "ささみ",
    "手羽", "手羽先", "手羽元", "ステーキ", "焼肉", "しゃぶしゃぶ",
    "こま切れ", "切り落とし", "もも肉", "ロース", "バラ肉", "豚バラ",
    "ベーコン", "ハム", "ソーセージ", "ウインナー", "ウィンナー",
    // 魚介
    "魚", "さかな", "鮭", "サーモン", "まぐろ", "マグロ", "鮪",
    "ぶり", "ブリ", "さば", "サバ", "鯖", "あじ", "アジ", "鯵",
    "いわし", "イワシ", "さんま", "サンマ", "たら", "タラ", "鱈",
    "ほっけ", "かれい", "カレイ", "鯛", "うなぎ",
    "えび", "エビ", "海老", "イカ", "するめ", "たこ", "タコ", "蛸",
    "ほたて", "ホタテ", "帆立", "あさり", "しじみ", "牡蠣", "カキ",
    "かに", "カニ", "蟹", "貝", "刺身", "切り身",
    "明太子", "たらこ", "数の子", "ツナ", "かまぼこ", "ちくわ",
    "はんぺん", "さつま揚げ", "練り物",
  ]],
  ["dairy", [
    "牛乳", "ミルク", "ヨーグルト", "チーズ", "バター", "生クリーム",
    "ホイップ", "練乳", "マーガリン", "カマンベール", "モッツァレラ",
    "豆乳", "アーモンドミルク", "オーツミルク",
  ]],
  ["vegetable", [
    "野菜", "にんじん", "人参", "キャベツ", "レタス", "玉ねぎ", "玉葱", "たまねぎ",
    "ねぎ", "ネギ", "長ねぎ", "青ねぎ", "万能ねぎ", "大根", "だいこん",
    "じゃがいも", "ジャガイモ", "いも", "さつまいも", "きゅうり", "キュウリ",
    "トマト", "なす", "ナス", "ピーマン", "パプリカ", "ほうれん草", "ほうれんそう",
    "小松菜", "ブロッコリー", "もやし", "きのこ", "しめじ", "えのき",
    "しいたけ", "まいたけ", "エリンギ", "にんにく", "しょうが", "生姜",
    "かぼちゃ", "ごぼう", "れんこん", "セロリ", "アスパラ", "とうもろこし",
    "コーン", "白菜", "はくさい", "春菊", "にら", "ニラ", "豆苗",
    "枝豆", "えだまめ", "オクラ", "かぶ", "三つ葉", "みつば", "パセリ",
    "大葉", "しそ", "紫蘇", "アボカド",
    "レタス", "サニーレタス", "水菜", "豆腐", "納豆",
  ]],
  ["fruit", [
    "果物", "フルーツ", "りんご", "リンゴ", "みかん", "オレンジ", "バナナ",
    "いちご", "イチゴ", "苺", "ぶどう", "ブドウ", "葡萄", "桃", "もも",
    "梨", "なし", "柿", "キウイ", "レモン", "ゆず", "柚子", "グレープフルーツ",
    "メロン", "すいか", "スイカ", "西瓜", "パイナップル", "パイン",
    "マンゴー", "さくらんぼ", "ブルーベリー", "ラフランス", "洋梨",
    "デコポン", "はっさく", "いよかん", "きんかん",
  ]],
];

// 品名からカテゴリーを推測する（見つからなければ FALLBACK_CATEGORY）
function guessCategory(name) {
  const s = (name || "").trim();
  if (!s) return FALLBACK_CATEGORY;
  for (const [cat, words] of CATEGORY_KEYWORDS) {
    for (const w of words) {
      if (s.includes(w)) return cat;
    }
  }
  return FALLBACK_CATEGORY;
}

// --- 設定チェック ---
// config.js の貼り替えがまだなら、やさしい案内を出して止まる。
const CONFIG_READY =
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.startsWith("http") &&
  typeof SUPABASE_ANON_KEY === "string" &&
  SUPABASE_ANON_KEY.length > 20;

// --- Supabase クライアントを作成 ---
// ※ 変数名は「sb」にしています。CDN が作るグローバル変数「supabase」と
//    同じ名前にすると「already been declared」で衝突し、アプリ全体が
//    動かなくなるためです（window.supabase は CDN のライブラリ本体）。
const sb = CONFIG_READY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// --- 画面の要素をまとめて取得 ---
const el = {
  buyForm:     document.getElementById("buy-form"),
  buyInput:    document.getElementById("buy-input"),
  buyCategory: document.getElementById("buy-category"),
  buyGroups:   document.getElementById("buy-groups"),
  buyEmpty:    document.getElementById("buy-empty"),
  buyCount:    document.getElementById("buy-count"),

  fridgeForm:   document.getElementById("fridge-form"),
  fridgeInput:  document.getElementById("fridge-input"),
  fridgeGroups: document.getElementById("fridge-groups"),
  fridgeEmpty:  document.getElementById("fridge-empty"),
  fridgeCount:  document.getElementById("fridge-count"),

  homeForm:    document.getElementById("home-form"),
  homeInput:   document.getElementById("home-input"),
  homeList:    document.getElementById("home-list"),
  homeEmpty:   document.getElementById("home-empty"),
  homeCount:   document.getElementById("home-count"),

  banner:      document.getElementById("status-banner"),
  lamp:        document.getElementById("connection-lamp"),
};

// --- 手元のデータ（サーバーの内容をここに保持して描画する） ---
let items = [];

// 買い物フォームのカテゴリーを、母が自分で変えたかどうか。
// true の間は自動判定でドロップダウンを上書きしません。
let buyCategoryTouched = false;

// ============================================================
//  カテゴリー選択メニューを作る
// ============================================================
function buildCategorySelect() {
  for (const c of CATEGORIES) {
    const opt = document.createElement("option");
    opt.value = c.key;
    opt.textContent = `${c.emoji} ${c.label}`;
    el.buyCategory.appendChild(opt);
  }
  // 初期選択は「その他」（迷ったときの既定）
  el.buyCategory.value = FALLBACK_CATEGORY;
}

// ============================================================
//  状態表示のヘルパー
// ============================================================
function showBanner(text, kind) {
  el.banner.textContent = text;
  el.banner.className = "status-banner is-" + kind; // is-loading / is-error
  el.banner.hidden = false;
}
function hideBanner() {
  el.banner.hidden = true;
}
function setLamp(state) {
  el.lamp.classList.remove("is-online", "is-offline");
  if (state) el.lamp.classList.add("is-" + state);
}

// ============================================================
//  データの読み込み
//  silent=true のときは「読み込み中」を出さずに静かに更新する
//  （アプリを開き直したときの、さりげない同期に使う）。
// ============================================================
async function loadItems(silent = false) {
  if (!silent) showBanner("読み込み中…", "loading");
  const { data, error } = await sb
    .from("items")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    if (!silent) {
      showBanner("うまく読み込めませんでした。通信を確認して、画面を更新してね。", "error");
      setLamp("offline");
    }
    return;
  }

  items = data || [];
  if (!silent) hideBanner();
  render();
}

// ============================================================
//  描画（items の中身から画面を組み立てる）
// ============================================================
function render() {
  const buyItems    = items.filter((it) => it.status === "buy");
  const fridgeItems = items.filter((it) => it.status === "fridge");
  const homeItems   = items.filter((it) => it.status === "home");

  renderGroups(el.buyGroups, buyItems, buildBuyRow);
  renderGroups(el.fridgeGroups, fridgeItems, buildStorageRow);
  renderFlatList(el.homeList, homeItems);

  // 件数バッジ
  el.buyCount.textContent    = buyItems.length || "";
  el.fridgeCount.textContent = fridgeItems.length || "";
  el.homeCount.textContent   = homeItems.length || "";

  // 空リストの案内
  el.buyEmpty.hidden    = buyItems.length > 0;
  el.fridgeEmpty.hidden = fridgeItems.length > 0;
  el.homeEmpty.hidden   = homeItems.length > 0;
}

// カテゴリーごとに見出しを付けてグループ表示する（買い物リスト・冷蔵庫で共用）
//   container : グループを入れる箱（el.buyGroups / el.fridgeGroups）
//   list      : 表示する品物の配列
//   rowBuilder: 1行を組み立てる関数（buildBuyRow / buildStorageRow）
function renderGroups(container, list, rowBuilder) {
  container.innerHTML = "";

  // CATEGORIES の順番でグループを並べる
  for (const cat of CATEGORIES) {
    const inCat = list.filter(
      (it) => (it.category || FALLBACK_CATEGORY) === cat.key
    );
    if (inCat.length === 0) continue; // 中身が無いカテゴリーは見出しごと省略

    const group = document.createElement("div");
    group.className = "cat-group";

    const head = document.createElement("h3");
    head.className = "cat-head";
    head.innerHTML =
      `<span class="cat-emoji" aria-hidden="true">${cat.emoji}</span>` +
      `<span>${cat.label}</span>` +
      `<span class="cat-count">${inCat.length}</span>`;

    const ul = document.createElement("ul");
    ul.className = "item-list";
    for (const item of inCat) ul.appendChild(rowBuilder(item));

    group.append(head, ul);
    container.appendChild(group);
  }
}

// 冷蔵庫・家にあるもの：カテゴリー分けせずそのまま並べる
function renderFlatList(ul, list) {
  ul.innerHTML = "";
  for (const item of list) ul.appendChild(buildStorageRow(item));
}

// 買い物リストの1行：[✓チェック] 品名 [×削除]
function buildBuyRow(item) {
  const li = document.createElement("li");
  li.className = "item";

  const dest = destOf(item.category);
  const destName = dest === "home" ? "家にあるもの" : "冷蔵庫";

  const check = document.createElement("button");
  check.className = "check-btn";
  check.type = "button";
  check.textContent = "✓";
  check.setAttribute("aria-label", `「${item.name}」を${destName}へ移す`);
  check.addEventListener("click", () => moveItem(item, dest));

  const name = document.createElement("span");
  name.className = "item-name";
  name.textContent = item.name;

  const actions = document.createElement("div");
  actions.className = "item-actions";
  actions.appendChild(makeDeleteBtn(item));

  li.append(check, name, actions);
  return li;
}

// 保管リスト（冷蔵庫・家にあるもの）の1行：品名 [また買う] [×削除]
function buildStorageRow(item) {
  const li = document.createElement("li");
  li.className = "item";

  const name = document.createElement("span");
  name.className = "item-name";
  name.textContent = item.name;

  const actions = document.createElement("div");
  actions.className = "item-actions";

  const rebuy = document.createElement("button");
  rebuy.className = "mini-btn rebuy-btn";
  rebuy.type = "button";
  rebuy.textContent = "また買う";
  rebuy.setAttribute("aria-label", `「${item.name}」を買い物リストに戻す`);
  rebuy.addEventListener("click", () => moveItem(item, "buy"));

  actions.append(rebuy, makeDeleteBtn(item));

  li.append(name, actions);
  return li;
}

// 「×」削除ボタン（共通）
function makeDeleteBtn(item) {
  const del = document.createElement("button");
  del.className = "mini-btn del-btn";
  del.type = "button";
  del.textContent = "×";
  del.setAttribute("aria-label", `「${item.name}」を削除`);
  del.addEventListener("click", () => deleteItem(item));
  return del;
}

// ============================================================
//  操作：追加 / 移動 / 削除
//  方針：サーバーを更新したら、自分の画面はその場で更新する（楽観的更新）。
//  Realtime は「相手の端末の変更」を受け取る役割。applyChange は重複を
//  防ぐので、Realtime で同じ変更がもう一度来ても二重にはなりません。
//  → これで Realtime が届かなくても、必ず自分の画面に反映されます。
// ============================================================

// 品物を追加（status と category を指定）
async function addItem(name, status, category) {
  const trimmed = name.trim();
  if (!trimmed) return;

  // insert したら、その行を返してもらう（.select()）
  const { data, error } = await sb
    .from("items")
    .insert({ name: trimmed, status, category })
    .select();

  if (error) {
    console.error(error);
    showBanner("追加できませんでした。通信を確認して、もう一度ためしてね。", "error");
    return;
  }
  // 返ってきた行を自分の画面に反映
  if (data && data[0]) {
    applyChange({ eventType: "INSERT", new: data[0] });
    render();
  }
}

// 品物を移動（status を付け替える。category はそのまま保持）
async function moveItem(item, newStatus) {
  const { data, error } = await sb
    .from("items")
    .update({ status: newStatus })
    .eq("id", item.id)
    .select();

  if (error) {
    console.error(error);
    showBanner("移動できませんでした。もう一度ためしてね。", "error");
    return;
  }
  const updated = (data && data[0]) || { ...item, status: newStatus };
  applyChange({ eventType: "UPDATE", new: updated });
  render();
}

// 品物を削除
async function deleteItem(item) {
  const { error } = await sb
    .from("items")
    .delete()
    .eq("id", item.id);

  if (error) {
    console.error(error);
    showBanner("削除できませんでした。もう一度ためしてね。", "error");
    return;
  }
  applyChange({ eventType: "DELETE", old: { id: item.id } });
  render();
}

// ============================================================
//  フォーム送信
// ============================================================
// エンターで追加できるようにする（入力欄で Enter → フォーム送信）。
// 日本語変換中（IME）の Enter は「確定」なので、送信しない。
function submitOnEnter(input, form) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }
  });
}
submitOnEnter(el.buyInput, el.buyForm);
submitOnEnter(el.fridgeInput, el.fridgeForm);
submitOnEnter(el.homeInput, el.homeForm);

// 入力に合わせてカテゴリーを自動で選ぶ（母が手で変えていない間だけ）
el.buyInput.addEventListener("input", () => {
  if (!buyCategoryTouched) {
    el.buyCategory.value = guessCategory(el.buyInput.value);
  }
});
// 母がドロップダウンを操作したら、その選択を尊重する
el.buyCategory.addEventListener("change", () => {
  buyCategoryTouched = true;
});

// 買い物リストに追加（エンター or「追加」ボタンで実行）
el.buyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addItem(el.buyInput.value, "buy", el.buyCategory.value);
  // 次の入力に備えてリセット（自動判定に戻す）
  el.buyInput.value = "";
  el.buyCategory.value = FALLBACK_CATEGORY;
  buyCategoryTouched = false;
  el.buyInput.focus();
});

// 冷蔵庫に直接追加（品名からカテゴリーを自動判定して振り分ける）
el.fridgeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addItem(el.fridgeInput.value, "fridge", guessCategory(el.fridgeInput.value));
  el.fridgeInput.value = "";
  el.fridgeInput.focus();
});

// 家にあるもの（日用品）に直接追加（category は「日用品」）
el.homeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addItem(el.homeInput.value, "home", "daily");
  el.homeInput.value = "";
  el.homeInput.focus();
});

// ============================================================
//  タブ ＋ 横スワイプの切り替え
//  ・タブをタップ → 対応するパネルへ横スクロール
//  ・指で横にスワイプ → スクロール位置に合わせてタブの見た目を更新
//  ・左右の矢印キーでも切り替えできる（アクセシビリティ）
// ============================================================
function setupTabs() {
  const panels = document.getElementById("panels");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  if (!panels || tabs.length === 0) return;

  let current = 0; // いま表示中のタブ番号

  // 指定の番号のパネルへ移動する
  function goTo(i, smooth = true) {
    current = Math.max(0, Math.min(i, tabs.length - 1));
    panels.scrollTo({
      left: current * panels.clientWidth,
      behavior: smooth ? "smooth" : "auto",
    });
  }

  tabs.forEach((tab) => {
    // タップで切り替え
    tab.addEventListener("click", () => goTo(Number(tab.dataset.index)));
    // 左右キーで切り替え
    tab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(current + 1);
        tabs[current].focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(current - 1);
        tabs[current].focus();
      }
    });
  });

  // スクロール位置から「いま何番目か」を求めて、タブの見た目をそろえる
  function syncActive() {
    const w = panels.clientWidth || 1;
    current = Math.round(panels.scrollLeft / w);
    tabs.forEach((tab, idx) => {
      const on = idx === current;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  // スワイプ中に何度も呼ばれるので、描画に合わせて間引く
  let ticking = false;
  panels.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      syncActive();
      ticking = false;
    });
  });

  // 画面回転・リサイズ時は、いまのタブの位置に合わせ直す
  window.addEventListener("resize", () => goTo(current, false));

  syncActive();
}
setupTabs();

// ============================================================
//  リアルタイム同期
// ============================================================
function subscribeRealtime() {
  sb
    .channel("items-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "items" },
      (payload) => {
        applyChange(payload);
        render();
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setLamp("online");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        setLamp("offline");
      }
    });
}

// 受け取った変更を手元の items に反映する
function applyChange(payload) {
  const { eventType, new: newRow, old: oldRow } = payload;

  if (eventType === "INSERT") {
    items = items.filter((it) => it.id !== newRow.id); // 二重防止
    items.push(newRow);
    items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (eventType === "UPDATE") {
    items = items.map((it) => (it.id === newRow.id ? newRow : it));
  } else if (eventType === "DELETE") {
    items = items.filter((it) => it.id !== oldRow.id);
  }
}

// ============================================================
//  起動
// ============================================================
buildCategorySelect();

if (CONFIG_READY) {
  loadItems();
  subscribeRealtime();

  // アプリを開き直した／通信が復活したときに、静かに最新へ更新する。
  // （Realtime が万一届かなくても、これで相手の変更が取り込めます）
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") loadItems(true);
  });
  window.addEventListener("online", () => loadItems(true));
} else {
  showBanner("設定がまだです：config.js に Supabase の URL とキーを貼ってください。", "error");
  setLamp("offline");
}

// service worker を登録（PWA / オフライン対応）
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("service worker 登録に失敗:", err);
    });
  });
}
