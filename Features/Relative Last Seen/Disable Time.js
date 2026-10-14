// Last Seen (label only) | "Online: 30 min ago" -> "Last seen: 30 min ago"

;(() => {
  "use strict"

  const IS_WEB = /(^|\.)(steampowered|steamcommunity)\.com$/.test(location.hostname)
  const OWNED_ATTR = "data-nevko-ls-label"
  const OTHER_SCRIPT_ATTR = "data-nevko-ls" // LastSeen.js marker


  // Language

  const STEAM_LANGUAGES = {
    arabic: "ar", bulgarian: "bg", schinese: "zh-Hans", tchinese: "zh-Hant",
    czech: "cs", danish: "da", dutch: "nl", english: "en", finnish: "fi",
    french: "fr", german: "de", greek: "el", hungarian: "hu", indonesian: "id",
    italian: "it", japanese: "ja", koreana: "ko", norwegian: "no", polish: "pl",
    portuguese: "pt-PT", brazilian: "pt-BR", romanian: "ro", russian: "ru",
    spanish: "es", latam: "es-419", swedish: "sv", thai: "th", turkish: "tr",
    ukrainian: "uk", vietnamese: "vi",
  }

  function detectLocale() {
    if (IS_WEB && document.documentElement.lang) return document.documentElement.lang
    const steamName = new URLSearchParams(location.search).get("LANGUAGE")
    return STEAM_LANGUAGES[steamName?.toLowerCase()] || navigator.language
  }

  const LOCALE = detectLocale()
  const pick = table => table[LOCALE] ?? table[LOCALE.split("-")[0]] ?? table.en

  const PREFIX = pick({
    ru: "Был(а) в сети", uk: "Був(ла) в мережі", bg: "Бил(а) онлайн",
    en: "Last seen", de: "Zuletzt gesehen", fr: "Vu(e) le",
    es: "Visto(a) el", pt: "Visto(a) em", it: "Visto(a) il",
    nl: "Laatst gezien", pl: "Ostatnio widziany(a)", cs: "Naposledy viděn(a)",
    sk: "Naposledy videný(á)", hu: "Utoljára látva", ro: "Văzut(ă) ultima dată",
    hr: "Zadnji put viđen(a)", da: "Sidst set", fi: "Nähty viimeksi",
    sv: "Senast sedd", no: "Sist sett", el: "Τελευταία εμφάνιση",
    ar: "آخر ظهور", tr: "Son görülme", th: "เห็นล่าสุด",
    vi: "Lần cuối thấy", id: "Terakhir dilihat", ja: "最終確認",
    ko: "마지막으로 본 시간", zh: "最后上线时间", "zh-Hant": "最後上線",
  })

  // Steam prefixes
  const STEAM_PREFIX = new RegExp("^(" + [
    "В сети\\s*:", "Онлайн\\s*:", "Бил\\(а\\) онлайн\\s*:", "Последно онлайн\\s*:",
    "Last Online\\s*:", "Zuletzt online\\s*:", "Dernière connexion\\s*:",
    "Última vez\\s*:", "Visto pela última vez\\s*:", "Ostatnio online\\s*:",
    "Son Çevrimiçi\\s*:", "Naposledy online\\s*:", "Utoljára online\\s*:",
    "Ultima dată online\\s*:", "Zadnji put online\\s*:",
    "最后上线时间[：:]?", "最後上線[：:]?", "마지막 접속[：:]?",
    "最終オンライン[：:]?", "ออนไลน์ล่าสุด[：:]?",
  ].join("|") + ")\\s*", "i")


  // Checks

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

  const looksLikeLastSeen = text => /\d/.test(text) && TIME_WORDS.test(text) && !PLAYTIME_WORDS.test(text)
  const isOnline = label => !IS_WEB && label.closest(".friend")?.classList.contains("offline") === false
  const isInGame = label => !IS_WEB && !!label.closest("[class*='ingame'],[class*='inGame']")
  // Skip own status
  const isMyOwnStatus = label => !!label.closest(".currentUserContainer")


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

  function patchLabel(label) {
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
    if (isInGame(label)) return

    const text = label.textContent.trim()
    if (!text || text.startsWith(PREFIX)) return

    // Replaced by Steam
    label.removeAttribute(OWNED_ATTR)
    if (!looksLikeLastSeen(text)) return

    const ago = text.replace(STEAM_PREFIX, "").trim()
    label.setAttribute(OWNED_ATTR, "1")
    writeText(label, ago ? `${PREFIX}: ${ago}` : PREFIX)
  }


  // Observer

  // + the chat header (Chat.js)
  const CLIENT_LABELS = "[class*='richPresenceLabel'],[class*='awayStatusLabel'],#nk-chat-header .nk-chat-header-status"
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

  function patchInside(node) {
    if (node?.nodeType !== Node.ELEMENT_NODE || writing.has(node)) return
    if (node.matches(LABELS)) patchLabel(node)
    node.querySelectorAll(LABELS).forEach(patchLabel)
  }

  function onMutations(records) {
    for (const record of records) {
      if (record.type === "childList") {
        // Text only changed -> check parent
        record.addedNodes.forEach(node => patchInside(node.nodeType === Node.TEXT_NODE ? node.parentElement : node))
      } else if (record.type === "characterData") {
        patchInside(record.target.parentElement)
      } else if (record.target.classList.contains("friend")) {
        // Status changed
        patchInside(record.target)
      }
    }
  }

  function init() {
    patchInside(document.body)
    new MutationObserver(onMutations).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: !IS_WEB,
      attributeFilter: IS_WEB ? undefined : ["class"],
    })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
