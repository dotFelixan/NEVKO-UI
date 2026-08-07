// NEVKO LastSeen (with seconds) — same as LastSeen.js but shows HH:MM:SS
// and ticks every second using a per-element WeakMap cache.
//
// CLIENT (steamloopback.host) — reads persona.m_rtLastSeenOnline from React fiber
// WEB    (steamcommunity.com) — parses relative text string (~±1 min accuracy)

;(function nevkoLastSeenSeconds() {
  "use strict"

  // ── Context ───────────────────────────────────────────────────────────────

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

  // ── Time format ───────────────────────────────────────────────────────────

  const USE_24H = (() => {
    try {
      return !new Intl.DateTimeFormat(LOCALE, { hour: "numeric" })
        .formatToParts(new Date(2000, 0, 1, 13))
        .some(p => p.type === "dayPeriod")
    } catch { return true }
  })()

  function formatTime(date) {
    if (USE_24H) {
      return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}:${String(date.getSeconds()).padStart(2,"0")}`
    }
    return date.toLocaleTimeString(LOCALE, { hour:"numeric", minute:"2-digit", second:"2-digit", hour12:true })
  }

  // ── Prefix table ──────────────────────────────────────────────────────────

  const PREFIX = {
    ru:"Был(а) в сети:",           uk:"Був(ла) в мережі:",          bg:"Бил(а) онлайн:",
    en:"Last seen:",               de:"Zuletzt gesehen:",           fr:"Vu(e) le :",
    es:"Visto(a) el:",             "es-419":"Visto(a) el:",         "pt-PT":"Visto(a) em:",
    "pt-BR":"Visto(a) em:",        pt:"Visto(a) em:",               it:"Visto(a) il:",
    nl:"Laatst gezien:",           pl:"Ostatnio widziany(a):",      cs:"Naposledy viděn(a):",
    sk:"Naposledy videný(á):",     hu:"Utoljára látva:",            ro:"Văzut(ă) ultima dată:",
    hr:"Zadnji put viđen(a):",     da:"Sidst set:",                 fi:"Nähty viimeksi:",
    sv:"Senast sedd:",             no:"Sist sett:",                 el:"Τελευταία εμφάνιση:",
    ar:"آخر ظهور:",                tr:"Son görülme:",               th:"เห็นล่าสุด:",
    vi:"Lần cuối thấy:",           id:"Terakhir dilihat:",          ja:"最終確認:",
    ko:"마지막으로 본 시간:",         "zh-Hans":"最后上线时间：",          "zh-Hant":"最後上線：",
    zh:"最后上线时间：",
  }

  const PREFIX_STR = PREFIX[LOCALE] ?? PREFIX[LOCALE.split("-")[0]] ?? "Last seen:"

  function formatLastSeen(unixSec) {
    const date = new Date(unixSec * 1000)
    const now  = new Date()
    const time = formatTime(date)
    if (date.toDateString() === now.toDateString()) return `${PREFIX_STR} ${time}`
    const dateStr = date.toLocaleDateString(LOCALE, {
      day:"numeric", month:"short",
      ...(date.getFullYear() !== now.getFullYear() ? { year:"numeric" } : {}),
    })
    return `${PREFIX_STR} ${dateStr} ${time}`
  }

  // ── CLIENT: fiber reader ──────────────────────────────────────────────────

  const fiberKeyCache = new WeakMap()

  function getFiberKey(el) {
    if (fiberKeyCache.has(el)) return fiberKeyCache.get(el)
    const k = Object.keys(el).find(k => k.startsWith("__reactFiber")) ?? null
    fiberKeyCache.set(el, k)
    return k
  }

  function tsFromPersona(obj) {
    if (!obj || typeof obj !== "object") return null
    const ts = obj.m_rtLastSeenOnline ?? obj.m_rtLastLogOff ?? obj.m_nLastLogoff ?? null
    return ts > 0 ? ts : null
  }

  function getTimestampFromFiber(el) {
    const fk = getFiberKey(el)
    if (!fk) return null
    let fiber = el[fk], depth = 0
    while (fiber && depth < 40) {
      const p = fiber.memoizedProps
      if (p && typeof p === "object") {
        const ts =
          tsFromPersona(p.persona)    ??
          tsFromPersona(p.member)     ??
          tsFromPersona(p.chatMember) ??
          tsFromPersona(p.friend)     ??
          tsFromPersona(p.user)       ??
          tsFromPersona(p.steamUser)  ??
          null
        if (ts) return ts
      }
      const sn = fiber.stateNode
      if (sn && typeof sn === "object" && !(sn instanceof Element)) {
        const ts =
          tsFromPersona(sn.m_persona) ??
          tsFromPersona(sn.persona)   ??
          null
        if (ts) return ts
      }
      fiber = fiber.return
      depth++
    }
    return null
  }

  const domTsCache = new WeakMap()

  function findTimestampForEl(el) {
    if (domTsCache.has(el)) return domTsCache.get(el)
    let node = el
    while (node && node !== document.body) {
      const ts = getTimestampFromFiber(node)
      if (ts) { domTsCache.set(el, ts); return ts }
      node = node.parentElement
    }
    return null
  }

  // ── WEB: relative time parser ─────────────────────────────────────────────

  const UNITS = [
    { ms:          1_000, re:/сек|sec|sek|seg|วิ|초|秒/ },
    { ms:         60_000, re:/мин|min|minuto|minut|นาที|분|分/ },
    { ms:      3_600_000, re:/ч\b|час|hour|std|heure|uur|godz|ora|hora|ชั่วโมง|시간|時間|时间|saat|tim|giờ|jam/ },
    { ms:     86_400_000, re:/дн|день|дня|дней|day|tag|dag|jour|día|dia|dzień|dni|gün|วัน|일\b|日/ },
    { ms:    604_800_000, re:/нед|week|woche|wek|semaine|semana|tyg|สัปดาห์|주\b|週/ },
    { ms:  2_592_000_000, re:/мес|month|monat|maand|mois|mes|mês|miesiąc|hónap|luna|ay|เดือน|개월|月/ },
    { ms: 31_536_000_000, re:/год|лет|year|jahr|jaar|año|ano|rok|lat|év|ani|yıl|ปี|년\b|年/ },
  ]

  function parseRelativeTime(text) {
    const re = /(\d+[\d.,]*)\s*([^\d,،.]+)/g
    let totalMs = 0, found = false, m
    while ((m = re.exec(text)) !== null) {
      const num = parseFloat(m[1].replace(",", "."))
      const unit = m[2].trim()
      for (const u of UNITS) {
        if (u.re.test(unit)) { totalMs += num * u.ms; found = true; break }
      }
    }
    if (!found || totalMs === 0) return null
    return Math.floor((Date.now() - totalMs) / 1000)
  }

  // ── Guards ───────────────────────────────────────────��────────────────────

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

  // ── DOM patching ──────────────────────────────────────────────────────────

  const OWNED_ATTR = "data-nevko-ls-sec"

  // WeakSet of elements currently being written to by us
  const writing = new WeakSet()

  // Map: element → fixed unixSec (set once on first patch). Must be Map (not WeakMap) for forEach.
  const tsMap = new Map()

  function setOwnedText(el, text) {
    writing.add(el)
    el.textContent = text
    Promise.resolve().then(() => writing.delete(el))
  }

  function isInGame(el) {
    if (IS_WEB) return false
    return !!el.closest("[class*='ingame'], [class*='inGame'], .ingame")
  }

  function patchLabel(labelEl) {
    // Already tracked — just refresh the displayed seconds
    if (tsMap.has(labelEl)) {
      setOwnedText(labelEl, formatLastSeen(tsMap.get(labelEl)))
      return
    }

    if (isInGame(labelEl)) return

    const raw = (labelEl.textContent ?? "").trim()
    if (!raw || labelEl.hasAttribute(OWNED_ATTR)) return
    if (!isOfflineLabel(raw)) return

    const ts = IS_WEB ? parseRelativeTime(raw) : findTimestampForEl(labelEl)
    if (!ts) return

    tsMap.set(labelEl, ts)
    labelEl.setAttribute(OWNED_ATTR, String(ts))
    setOwnedText(labelEl, formatLastSeen(ts))
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

  // Tick: refresh only already-tracked elements — no full DOM scan
  function tickAll() {
    tsMap.forEach((ts, el) => {
      if (document.contains(el)) setOwnedText(el, formatLastSeen(ts))
    })
  }

  // ── MutationObserver ──────────────────────────────────────────────────────

  function patchNode(node) {
    if (!(node instanceof Element)) return
    try {
      if (node.matches(LABEL_SELECTOR)) patchLabel(node)
      node.querySelectorAll(LABEL_SELECTOR).forEach(patchLabel)
    } catch {}
  }

  // Observer runs permanently — never disconnected
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
      // Always true: on web Steam fills span text in a separate mutation after adding the node,
      // so characterData is required to catch the fill. The writing WeakSet prevents feedback loops.
      characterData: true,
    })
    // Tick every second — only touches elements already in tsMap
    setInterval(tickAll, 1000)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true })
  } else {
    init()
  }
})()
