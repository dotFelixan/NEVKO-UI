// NEVKO LastSeen (Label Only) — replaces Steam's prefix ("В сети:", "Last Online:", …)
// with the localised "Last seen" prefix, keeping the relative time intact ("30 мин. назад").
//
// Works on both client (steamloopback.host) and web (steamcommunity.com).

;(function nevkoLastSeenLabelOnly() {
  "use strict"

  const IS_WEB = /(^|\.)(steampowered|steamcommunity)\.com$/.test(location.hostname)

  // ── Locale ────────────────────────────────────────────────────────────────

  const STEAM_LANG_MAP = {
    arabic:"ar", bulgarian:"bg", schinese:"zh-Hans", tchinese:"zh-Hant",
    czech:"cs", danish:"da", dutch:"nl", english:"en", finnish:"fi",
    french:"fr", german:"de", greek:"el", hungarian:"hu", indonesian:"id",
    italian:"it", japanese:"ja", koreana:"ko", norwegian:"no", polish:"pl",
    portuguese:"pt-PT", brazilian:"pt-BR", romanian:"ro", russian:"ru",
    spanish:"es", latam:"es-419", swedish:"sv", thai:"th", turkish:"tr",
    ukrainian:"uk", vietnamese:"vi",
  }

  function detectLocale() {
    if (IS_WEB) { const l = document.documentElement.lang; if (l) return l }
    try {
      const m = location.search.match(/[?&]LANGUAGE=([^&]+)/i)
      if (m) return STEAM_LANG_MAP[m[1].toLowerCase()] ?? navigator.language
    } catch {}
    return navigator.language
  }

  const LOCALE = detectLocale()

  // ── Prefix table ──────────────────────────────────────────────────────────

  const PREFIX = {
    ru:"Был(а) в сети",            uk:"Був(ла) в мережі",           bg:"Бил(а) онлайн",
    en:"Last seen",                de:"Zuletzt gesehen",            fr:"Vu(e) le",
    es:"Visto(a) el",              "es-419":"Visto(a) el",          "pt-PT":"Visto(a) em",
    "pt-BR":"Visto(a) em",         pt:"Visto(a) em",                it:"Visto(a) il",
    nl:"Laatst gezien",            pl:"Ostatnio widziany(a)",       cs:"Naposledy viděn(a)",
    sk:"Naposledy videný(á)",      hu:"Utoljára látva",             ro:"Văzut(ă) ultima dată",
    hr:"Zadnji put viđen(a)",      da:"Sidst set",                  fi:"Nähty viimeksi",
    sv:"Senast sedd",              no:"Sist sett",                  el:"Τελευταία εμφάνιση",
    ar:"آخر ظهور",                 tr:"Son görülme",                th:"เห็นล่าสุด",
    vi:"Lần cuối thấy",            id:"Terakhir dilihat",           ja:"最終確認",
    ko:"마지막으로 본 시간",          "zh-Hans":"最后上线时间",           "zh-Hant":"最後上線",
    zh:"最后上线时间",
  }

  const PREFIX_STR = PREFIX[LOCALE] ?? PREFIX[LOCALE.split("-")[0]] ?? "Last seen"

  // Steam's own prefix patterns to strip before prepending ours.
  // Covers all known localisations of "Last Online:" / "В сети:" etc.
  const STEAM_PREFIX_RE = new RegExp(
    "^(" + [
      // Russian / Ukrainian / Bulgarian
      "В сети\\s*:", "в сети\\s*:", "Онлайн\\s*:", "онлайн\\s*:", "Бил\\(а\\) онлайн\\s*:",
      // English
      "Last Online\\s*:", "Last online\\s*:",
      // German
      "Zuletzt online\\s*:",
      // French
      "Dernière connexion\\s*:", "dernière connexion\\s*:",
      // Spanish
      "Última vez\\s*:", "última vez\\s*:",
      // Portuguese
      "Visto pela última vez\\s*:",
      // Polish
      "Ostatnio online\\s*:",
      // Turkish
      "Son Çevrimiçi\\s*:", "son çevrimiçi\\s*:",
      // Czech
      "Naposledy online\\s*:",
      // Hungarian
      "Utoljára online\\s*:",
      // Romanian
      "Ultima dată online\\s*:",
      // Bulgarian
      "Последно онлайн\\s*:",
      // Croatian
      "Zadnji put online\\s*:",
      // CJK
      "最后上线时间[：:]?", "最後上線[：:]?",
      "마지막 접속[：:]?",
      "最終オンライン[：:]?",
      "ออนไลน์ล่าสุด[：:]?",
    ].join("|") + ")\\s*",
    "i"
  )

  // ── Guards ────────────────────────────────────────────────────────────────

  const RELATIVE_RE = new RegExp([
    "мин\\.?|ч\\.|дн\\.?|нед\\.?|мес\\.?|час|день|дня|дней|год|недел",
    "min|hour|day|week|month|year",
    "Std\\.|Min\\.|Tag|Woche|Monat|Jahr",
    "heure|jour|semaine|mois",
    "hora|día|dia|semana|mes|año|ano",
    "godz|dzień|dni|tyg|rok",
    "dk|sa|gün|hafta|ay|yıl",
    "[分時日週月年时]",
  ].join("|"), "i")

  const PLAYTIME_RE = new RegExp([
    "за последнее время|за всё время|за все время|в игре|наиграно",
    "in the last|all time|on record|hours? played|hrs? on record|hrs? total|recently played",
    "in den letzten|gesamt|insgesamt|Stunden gespielt",
    "ces dernières|au total|en tout|heures? jouées?",
    "en los últimos|en total|horas? jugadas?|horas? no total|nas últimas",
    "w ostatnim|łącznie|godzin ogółem",
    "son .* içinde|toplam",
    "時間|时间|시간",
  ].join("|"), "i")

  function isOfflineLabel(text) {
    return !PLAYTIME_RE.test(text) && RELATIVE_RE.test(text) && /\d/.test(text)
  }

  function isInGame(el) {
    if (IS_WEB) return false
    return !!el.closest("[class*='ingame'],[class*='inGame'],.ingame")
  }

  // ── DOM patching ──────────────────────────────────────────────────────────

  const OWNED_ATTR = "data-nevko-ls-label"
  // Other NEVKO LastSeen variants use these attrs — skip elements they already own
  // data-nevko-ls       → NEVKO LastSeen.js
  // data-nevko-ls-sec   → NEVKO LastSeen Seconds.js
  // data-nevko-ls-label → this script
  const OTHER_OWNED_ATTRS = ["data-nevko-ls", "data-nevko-ls-sec", "data-nevko-ls-label"]
  const writing = new WeakSet()
  const patched = new WeakSet()

  function setOwnedText(el, text) {
    writing.add(el)
    el.textContent = text
    Promise.resolve().then(() => writing.delete(el))
  }

  function patchLabel(labelEl) {
    if (patched.has(labelEl)) return
    if (isInGame(labelEl)) return

    const raw = (labelEl.textContent ?? "").trim()
    if (!raw) return
    // Skip if already owned by this script or any other NEVKO LastSeen variant
    if (OTHER_OWNED_ATTRS.some(a => labelEl.hasAttribute(a))) return
    if (!isOfflineLabel(raw)) return

    // Strip Steam's own prefix, keep the relative time part ("30 мин. назад")
    const withoutPrefix = raw.replace(STEAM_PREFIX_RE, "").trim()
    const newText = withoutPrefix ? `${PREFIX_STR}: ${withoutPrefix}` : PREFIX_STR

    patched.add(labelEl)
    labelEl.setAttribute(OWNED_ATTR, "1")
    setOwnedText(labelEl, newText)
  }

  // ── Selectors ─────────────────────────────────────────────────────────────

  const CLIENT_SELECTOR = "[class*='richPresenceLabel'],[class*='awayStatusLabel']"
  const WEB_SELECTOR = [
    "span.friend_last_online_text",
    ".friend_block_content .friend_last_online_text",
    ".friend_block_content .friend_small_text",
    ".friendBlock .friend_last_online_text",
    ".friendBlock .friendSmallText",
    ".persona.offline .friend_last_online_text",
    "span.friendSmallText",
    "span.friend_small_text",
    ".miniprofile_container .friend_status_offline",
    ".miniprofile_container span.friend_status_offline",
    ".profile_in_game.persona.offline .profile_in_game_name",
    "div.profile_in_game_name",
    ".persona.offline span",
    ".offline span.friend_last_online_text",
  ].join(",")
  const LABEL_SELECTOR = IS_WEB ? WEB_SELECTOR : CLIENT_SELECTOR

  function patchAllLabels() {
    document.querySelectorAll(LABEL_SELECTOR).forEach(patchLabel)
  }

  // ── MutationObserver ──────────────────────────────────────────────────────

  function patchNode(node) {
    if (!(node instanceof Element)) return
    try {
      if (node.matches(LABEL_SELECTOR)) patchLabel(node)
      node.querySelectorAll(LABEL_SELECTOR).forEach(patchLabel)
    } catch {}
  }

  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === "childList") {
        m.addedNodes.forEach(node => {
          if (node instanceof Element) {
            patchNode(node)
          } else if (node.nodeType === Node.TEXT_NODE) {
            const el = node.parentElement
            if (el && !writing.has(el) && !el.hasAttribute(OWNED_ATTR)) patchNode(el)
          }
        })
      } else if (m.type === "characterData") {
        const el = m.target.parentElement
        if (!el || writing.has(el) || el.hasAttribute(OWNED_ATTR)) return
        patchNode(el)
      }
    }
  })

  function init() {
    patchAllLabels()
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true })
  } else {
    init()
  }
})()
