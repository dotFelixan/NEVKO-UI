// Last Seen: exact time | "Online: 3 h ago" -> "Last seen: Today at 14:00"
// Time from friendStore (client), else from Steam text
// 12/24h detected from page clock, else locale

;(() => {
  "use strict"

  const IS_WEB = /(^|\.)(steampowered|steamcommunity)\.com$/.test(location.hostname)
  const OWNED_ATTR = "data-nevko-ls"
  const OTHER_SCRIPT_ATTR = "data-nevko-ls-label" // Disable Time.js marker


  // Language

  const STEAM_LANGUAGES = {
    russian: "ru", ukrainian: "uk", bulgarian: "bg", english: "en", german: "de",
    french: "fr", spanish: "es", latam: "es-419", brazilian: "pt-BR", portuguese: "pt-PT",
    italian: "it", dutch: "nl", polish: "pl", czech: "cs", hungarian: "hu",
    romanian: "ro", danish: "da", finnish: "fi", swedish: "sv", norwegian: "no",
    greek: "el", turkish: "tr", thai: "th", vietnamese: "vi", indonesian: "id",
    japanese: "ja", koreana: "ko", schinese: "zh-Hans", tchinese: "zh-Hant", arabic: "ar",
  }

  function detectLocale() {
    if (IS_WEB && document.documentElement.lang) return document.documentElement.lang
    const steamName = new URLSearchParams(location.search).get("LANGUAGE")
    return STEAM_LANGUAGES[steamName?.toLowerCase()] || navigator.language
  }

  const LOCALE = detectLocale()
  const pick = table => table[LOCALE] ?? table[LOCALE.split("-")[0]] ?? table.en

  const PREFIX = pick({
    ru: "Был(а) в сети:", uk: "Був(ла) в мережі:", bg: "Бил(а) онлайн:",
    en: "Last seen:", de: "Zuletzt gesehen:", fr: "Vu(e) le :",
    es: "Visto(a) el:", pt: "Visto(a) em:", it: "Visto(a) il:",
    nl: "Laatst gezien:", pl: "Ostatnio widziany(a):", cs: "Naposledy viděn(a):",
    sk: "Naposledy videný(á):", hu: "Utoljára látva:", ro: "Văzut(ă) ultima dată:",
    hr: "Zadnji put viđen(a):", da: "Sidst set:", fi: "Nähty viimeksi:",
    sv: "Senast sedd:", no: "Sist sett:", el: "Τελευταία εμφάνιση:",
    ar: "آخر ظهور:", tr: "Son görülme:", th: "เห็นล่าสุด:",
    vi: "Lần cuối thấy:", id: "Terakhir dilihat:", ja: "最終確認:",
    ko: "마지막으로 본 시간:", zh: "最后上线时间：", "zh-Hant": "最後上線：",
  })

  // Word between date and time
  const AT = pick({
    ru: "в", uk: "о", bg: "в", en: "at", de: "um", fr: "à", es: "a las",
    pt: "às", it: "alle", nl: "om", pl: "o", cs: "v", sk: "o", hu: "",
    ro: "la", hr: "u", da: "kl.", fi: "klo", sv: "kl.", no: "kl.", el: "στις",
    ar: "في", tr: "saat", th: "", vi: "lúc", id: "pukul", ja: "", ko: "", zh: "",
  })

  const TODAY = pick({
    ru: "Сегодня в", uk: "Сьогодні о", bg: "Днес в", en: "Today at", de: "Heute um",
    fr: "Aujourd'hui à", es: "Hoy a las", pt: "Hoje às", it: "Oggi alle",
    nl: "Vandaag om", pl: "Dzisiaj o", cs: "Dnes v", sk: "Dnes o", hu: "Ma",
    ro: "Astăzi la", hr: "Danas u", da: "I dag kl.", fi: "Tänään klo",
    sv: "Idag kl.", no: "I dag kl.", el: "Σήμερα στις", ar: "اليوم في",
    tr: "Bugün saat", th: "วันนี้", vi: "Hôm nay lúc", id: "Hari ini pukul",
    ja: "今日", ko: "오늘", zh: "今天",
  })

  const YESTERDAY = pick({
    ru: "Вчера в", uk: "Учора о", bg: "Вчера в", en: "Yesterday at", de: "Gestern um",
    fr: "Hier à", es: "Ayer a las", pt: "Ontem às", it: "Ieri alle",
    nl: "Gisteren om", pl: "Wczoraj o", cs: "Včera v", sk: "Včera o", hu: "Tegnap",
    ro: "Ieri la", hr: "Jučer u", da: "I går kl.", fi: "Eilen klo",
    sv: "Igår kl.", no: "I går kl.", el: "Χθες στις", ar: "أمس في",
    tr: "Dün saat", th: "เมื่อวาน", vi: "Hôm qua lúc", id: "Kemarin pukul",
    ja: "昨日", ko: "어제", zh: "昨天",
  })


  // Parse Steam Text

  // Number + time unit
  const TIME_WORDS = new RegExp([
    "мин\\.?|ч\\.|дн\\.?|нед\\.?|мес\\.?|час|день|дня|дней|год|недел",
    "min|hour|day|week|month|year",
    "Std\\.|Min\\.|Tag|Woche|Monat|Jahr",
    "heure|jour|semaine|mois",
    "hora|día|dia|semana|mes|año|ano",
    "godz|dzień|dni|tyg|rok",
    "dk|sa|gün|hafta|ay|yıl",
    "[分時日週月年时]",
  ].join("|"), "i")

  // Not playtime
  const PLAYTIME_WORDS = new RegExp([
    "за последнее время|за последние|за всё время|за все время|в игре|наиграно",
    "in the last|all time|on record|hours? played|hrs? on record|hrs? total|recently played",
    "in den letzten|gesamt|insgesamt|Stunden gespielt",
    "ces dernières|au total|en tout|heures? jouées?",
    "en los últimos|en total|horas? jugadas?|horas? no total|nas últimas",
    "w ostatnim|łącznie|godzin ogółem",
    "son .* içinde|toplam",
    "時間|时间|시간",
  ].join("|"), "i")

  const NUMBER_THEN_UNIT = new RegExp(`\\d\\s*(?:${TIME_WORDS.source})`, "i")

  const looksLikeLastSeen = text => /\d/.test(text) && TIME_WORDS.test(text) && !PLAYTIME_WORDS.test(text)

  const UNITS = [
    { seconds: 60,       word: /^(min(ute)?s?|мин(ут[аыу])?)\.?$/i },
    { seconds: 3600,     word: /^(h(ou)?rs?|hours?|час(а|ов|у)?|ч)\.?$/i },
    { seconds: 86400,    word: /^(days?|дн(ей|я)?|день)\.?$/i },
    { seconds: 604800,   word: /^(weeks?|нед(ель|ели|елю)?)\.?$/i },
    { seconds: 2592000,  word: /^(months?|мес(яц(ев|а)?)?)\.?$/i },
    { seconds: 31536000, word: /^(y(ea)?rs?|years?|год(а|ов|у)?|лет|jahre?|ans?|années?|años?|anos?|rok(u|ów)?|lata|yıl)\.?$/i },
  ]

  // "1 h 29 min ago" -> { seconds: 5340, precision: "minute" }
  function parseAgo(text) {
    if (!text || text.length > 48) return null

    let seconds = 0
    let smallest = Infinity
    for (const [, count, word] of text.matchAll(/(\d{1,4})\s*([a-zA-Zа-яА-ЯёЁ]+)\.?/g)) {
      const unit = UNITS.find(u => u.word.test(word))
      if (!unit || Number(count) <= 0) continue
      seconds += Number(count) * unit.seconds
      smallest = Math.min(smallest, unit.seconds)
    }

    if (smallest === Infinity) return null
    const precision = smallest < 3600 ? "minute" : smallest === 3600 ? "hour" : "day"
    return { seconds, precision }
  }


  // 12/24h

  const isLocale24h = () => {
    try {
      return !new Intl.DateTimeFormat(LOCALE, { hour: "numeric" })
        .formatToParts(new Date(2000, 0, 1, 13))
        .some(part => part.type === "dayPeriod")
    } catch {
      return true
    }
  }

  let use24h = isLocale24h()

  // Element with only time | 3 same hits in a row, 1 min timeout -> locale
  const H24_TIME = /^(1[3-9]|2[0-3]):[0-5]\d$/
  const AMPM_TIME = /^\d{1,2}:[0-5]\d\s*(AM|PM|a\.m\.|p\.m\.)$/i
  const clock = { last: null, streak: 0, tries: 0, timer: null }

  function sampleClockFormat() {
    let sawAmPm = false
    for (const doc of getDocuments()) {
      for (const el of leaves(doc.body)) {
        const text = el.textContent.trim()
        if (H24_TIME.test(text)) return true
        if (AMPM_TIME.test(text)) sawAmPm = true
      }
    }
    return sawAmPm ? false : null
  }

  function detectClockFormat() {
    const found = sampleClockFormat()
    if (++clock.tries >= 20) clearInterval(clock.timer)
    if (found === null) return

    clock.streak = found === clock.last ? clock.streak + 1 : 1
    clock.last = found
    if (clock.streak < 3) return

    clearInterval(clock.timer)
    if (found !== use24h) {
      use24h = found
      reformatAll()
    }
  }

  function* leaves(root) {
    if (!root) return
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: el => ["SCRIPT", "STYLE", "svg"].includes(el.tagName)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
    })
    for (let el = walker.nextNode(); el; el = walker.nextNode()) {
      if (!el.firstElementChild) yield el
    }
  }


  // Format

  const TIME_24 = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
  const TIME_12 = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", hour12: true })
  const formatTime = date => (use24h ? TIME_24 : TIME_12).format(date)

  // For Friends Tabs.js (chat list times): this option is on + the same 12/24h
  // And for Chat.js (status in the chat header): the whole line by the time the friend was last online
  window.__nevkoExactTime = { formatTime, lastSeenText: timestamp => formatLastSeen(timestamp, "minute") }

  const sameDay = (a, b) => a.toDateString() === b.toDateString()

  function formatDate(date) {
    const options = { day: "numeric", month: "short" }
    if (date.getFullYear() !== new Date().getFullYear()) options.year = "numeric"
    return date.toLocaleDateString(LOCALE, options)
  }

  function formatLastSeen(timestamp, precision) {
    const date = new Date(timestamp)

    // Days only -> date
    if (precision === "day") return `${PREFIX} ${formatDate(date)}`

    // Hours only -> :00
    if (precision === "hour") date.setMinutes(0, 0, 0)

    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const time = formatTime(date)

    if (sameDay(date, now)) return `${PREFIX} ${TODAY} ${time}`
    if (sameDay(date, yesterday)) return `${PREFIX} ${YESTERDAY} ${time}`
    return `${PREFIX} ${formatDate(date)} ${AT} ${time}`.replace(/ {2,}/g, " ") // AT can be empty
  }


  // friendStore

  // Match by avatar hash | Several avatars on one level -> give up
  function findAvatarHash(label) {
    for (let node = label, depth = 0; node && depth < 8; node = node.parentElement, depth++) {
      const hashes = new Set()
      for (const img of node.querySelectorAll?.("img[src*='avatar']") || []) {
        const hash = img.src.match(/[a-f0-9]{40}/i)?.[0]
        if (hash) hashes.add(hash.toLowerCase())
      }
      if (hashes.size === 1) return [...hashes][0]
      if (hashes.size > 1) return null
    }
    return null
  }

  // Rebuild every 2s max
  let lastSeenByAvatar = new Map()
  let lastSeenBuiltAt = 0

  function getLastSeenByAvatar() {
    if (Date.now() - lastSeenBuiltAt < 2000) return lastSeenByAvatar
    lastSeenBuiltAt = Date.now()
    lastSeenByAvatar = new Map()

    try {
      for (const { persona } of window.opener?.friendStore?.allFriends || []) {
        const hash = persona?.m_strAvatarHash ?? persona?.avatarHash
        if (hash && typeof persona.m_rtLastSeenOnline === "number") {
          lastSeenByAvatar.set(hash.toLowerCase(), persona)
        }
      }
    } catch { /* no main window */ }

    return lastSeenByAvatar
  }

  function exactLastSeen(label) {
    if (IS_WEB) return null
    const persona = getLastSeenByAvatar().get(findAvatarHash(label))
    // Back online
    if (!persona || persona.m_ePersonaState !== 0 || persona.m_rtLastSeenOnline <= 0) return null
    return persona.m_rtLastSeenOnline * 1000
  }


  // Stability

  // Count from first time we saw this text
  const firstSeenAt = new Map()

  function capturedAt(text) {
    if (!firstSeenAt.has(text)) {
      if (firstSeenAt.size > 500) firstSeenAt.clear()
      firstSeenAt.set(text, Date.now())
    }
    return firstSeenAt.get(text)
  }

  // Keep shown time if diff < 1.5 min
  const shownTime = new Map()

  function stabilize(label, timestamp, precision) {
    if (precision !== "minute") return timestamp
    const key = (IS_WEB && label.closest("[data-steamid]")?.dataset.steamid) || findAvatarHash(label)
    if (!key) return timestamp

    const shown = shownTime.get(key)
    if (shown && Math.abs(shown - timestamp) < 90 * 1000) return shown
    if (shownTime.size > 500) shownTime.clear()
    shownTime.set(key, timestamp)
    return timestamp
  }


  // Labels

  const writing = new WeakSet()

  // Edit text inside the same node (React keeps it)
  function writeText(label, text) {
    writing.add(label)
    const textNode = label.childNodes.length === 1 && label.firstChild.nodeType === Node.TEXT_NODE
      ? label.firstChild
      : null
    if (textNode) textNode.nodeValue = text
    else label.textContent = text
    queueMicrotask(() => writing.delete(label))
  }

  function showLastSeen(label, timestamp, precision) {
    writeText(label, formatLastSeen(timestamp, precision))
    // Keep source for 12/24h change
    label.setAttribute(OWNED_ATTR, `${timestamp}:${precision}`)
  }

  function reformatAll() {
    for (const doc of getDocuments()) {
      for (const label of doc.querySelectorAll(`[${OWNED_ATTR}]`)) {
        const [timestamp, precision] = label.getAttribute(OWNED_ATTR).split(":")
        if (Number(timestamp)) showLastSeen(label, Number(timestamp), precision)
      }
    }
  }

  const isOnline = label => !IS_WEB && label.closest(".friend")?.classList.contains("offline") === false
  const isInGame = label => !IS_WEB && !!label.closest("[class*='ingame'],[class*='inGame']")
  // "Recently played" = playtime
  const isRecentlyPlayed = label => !!label.closest("[class*='Recent']")
  // Skip own status
  const isMyOwnStatus = label => !!label.closest(".currentUserContainer")

  // byText: found by its text, not by class (may be a nickname like "1ts...dk...")
  function patchLabel(label, byText = false) {
    if (writing.has(label) || label.hasAttribute(OTHER_SCRIPT_ATTR)) return
    if (isMyOwnStatus(label)) return

    // Back online, clear our old text
    if (isOnline(label)) {
      if (label.hasAttribute(OWNED_ATTR)) {
        label.removeAttribute(OWNED_ATTR)
        if (label.textContent.trim().startsWith(PREFIX)) writeText(label, "")
      }
      return
    }
    if (isInGame(label) || isRecentlyPlayed(label)) return

    const text = label.textContent.trim()
    if (!text || text.startsWith(PREFIX)) return

    // The unit must follow the number ("3 h"), not just be somewhere in the text
    if (byText && !NUMBER_THEN_UNIT.test(text)) return

    const exact = exactLastSeen(label)
    if (exact) return showLastSeen(label, stabilize(label, exact, "minute"), "minute")

    if (!looksLikeLastSeen(text)) return
    const ago = parseAgo(text)
    if (!ago) return

    const timestamp = capturedAt(text) - ago.seconds * 1000
    showLastSeen(label, stabilize(label, timestamp, ago.precision), ago.precision)
  }


  // Where to Find

  const CLIENT_LABELS = "[class*='richPresenceLabel'],[class*='awayStatusLabel']"
  const WEB_LABELS = [
    ".friend_last_online_text",
    ".friend_block_content .friend_small_text",
    ".friendBlock .friendSmallText",
    "span.friendSmallText",
    "span.friend_small_text",
    ".miniprofile_container .friend_status_offline",
    ".profile_in_game.persona.offline .profile_in_game_name",
    "div.profile_in_game_name",
    ".persona.offline span",
  ].join(",")
  const LABELS = IS_WEB ? WEB_LABELS : CLIENT_LABELS

  // Linux build without classes: search by text in friends window only
  const FRIENDS_WINDOW = "[class*='friendsui-container'],[class*='MillenniumWindow_FriendsList'],[class*='client_chat_frame']"

  const NAMES = "[class*='playerName'],[class*='PlayerName'],[class*='playerNickname']"

  // Messages and the message field: "back in 10 min" written by a friend is not a status
  const CHAT_TEXT = ".chatHistory, .chatEntry"

  function patchByText(root) {
    // The node itself can be the label: only its text was replaced (chat header status)
    const candidates = root.firstElementChild ? leaves(root) : [root]
    for (const el of candidates) {
      if (writing.has(el) || el.closest(NAMES) || el.closest(CHAT_TEXT)) continue
      if (looksLikeLastSeen(el.textContent.trim())) patchLabel(el, true)
    }
  }

  function patchInside(node) {
    if (node?.nodeType !== Node.ELEMENT_NODE || writing.has(node)) return
    if (node.matches(LABELS)) patchLabel(node)
    // Not forEach(patchLabel): the index would come as "byText", and a text without a number ("over a year ago")
    // was skipped for every label but the first
    node.querySelectorAll(LABELS).forEach(label => patchLabel(label))

    if (IS_WEB) return
    if (node.closest(FRIENDS_WINDOW)) patchByText(node)
    else node.querySelectorAll(FRIENDS_WINDOW).forEach(patchByText)
  }


  // Observer

  // Friends list in iframe
  function getDocuments() {
    const docs = [document]
    for (let i = 0; i < window.frames.length; i++) {
      try {
        const doc = window.frames[i].document
        if (doc?.body) docs.push(doc)
      } catch { /* cross-origin */ }
    }
    return docs
  }

  function onMutations(records) {
    for (const record of records) {
      if (record.type === "childList") {
        // Text only changed -> check parent
        record.addedNodes.forEach(node => patchInside(node.nodeType === Node.TEXT_NODE ? node.parentElement : node))
      } else if (record.type === "characterData") {
        const label = record.target.parentElement
        if (label && !writing.has(label)) patchInside(label)
      } else if (record.target.classList.contains("friend")) {
        // Status changed
        patchInside(record.target)
      }
    }
  }

  const watched = new WeakSet()

  function watchDocuments() {
    for (const doc of getDocuments()) {
      if (watched.has(doc)) continue
      watched.add(doc)
      patchInside(doc.body)
      new MutationObserver(onMutations).observe(doc.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: !IS_WEB,
        attributeFilter: IS_WEB ? undefined : ["class"],
      })
    }
  }

  function init() {
    watchDocuments()
    setInterval(watchDocuments, 1000)

    const found = sampleClockFormat()
    if (found !== null) use24h = found
    clock.timer = setInterval(detectClockFormat, 3000)
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
