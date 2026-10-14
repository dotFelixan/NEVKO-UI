// Chat window helpers (styles in Chat.css)
// Old game invites: game name and the phrase go to attributes, CSS draws a card from them
// Message time: short time inside every bubble, full date in its tooltip
// Chat kind: personal chats are marked, CSS shows avatars and names only in group chats
// Chat header: avatar, name and status of the open chat in the title bar (chat docked to the friends list)
// Mini profile: opens from the avatar only (tab or header); header backdrop: background of the friend's mini profile
// Panel resize: grip for side panels (the docked emoticon panel); width of the friends list beside a docked chat
// Chat menu: "more" button with the profile, closing the chat and its own background (theme folder "Cache")
// Menus in view: a menu that sticks out of the window is moved back inside, the window never stays scrolled

;(() => {
  "use strict"

  // Address of the theme folder: this script is loaded from it
  const THEME_SCRIPT = document.currentScript?.src
    || [...document.scripts].map(script => script.src).find(src => /\/themes\/[^/]+\/.*Chat\.js/.test(src)) || ""
  const THEME_URL = THEME_SCRIPT.match(/^.*\/themes\/[^/]+\//)?.[0] || ""

  const INVITE = ":is(.gameInviteDismissed, .gameInviteSelf, .gameInviteAccepted) > div"
  const GAME_ATTR = "data-nk-game"
  const TEXT_ATTR = "data-nk-text"


  // Game Invites

  // Message component above the element keeps the invite (appID)
  function inviteOf(el) {
    const key = Object.keys(el).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && el[key], depth = 0; fiber && depth < 8; fiber = fiber.return, depth++) {
      const invite = fiber.memoizedProps?.gameInvite
      if (invite) return invite
    }
    return null
  }

  function gameName(appID) {
    for (const win of [window, window.opener]) {
      try {
        const name = win?.g_FriendsUIApp?.AppInfoStore?.GetAppInfo(appID)?.name
        if (name) return name
      } catch { /* no store in this window */ }
    }
    return ""
  }

  // "ElPipi invited you to play <icon>THE FINALS" -> game "THE FINALS", text "ElPipi invited you to play"
  function describe(el) {
    const whole = [...el.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.nodeValue).join("")
    const invite = inviteOf(el)
    // Without the store: the game name is the text right after the icon
    const game = (invite && gameName(invite.appID)) || el.querySelector("img")?.nextSibling?.nodeValue?.trim() || ""
    if (!game) return null
    const text = whole.replace(game, " ").replace(/\s+/g, " ").trim()
    return { game, text }
  }

  // "... launched fireworks" (a chat effect): drawn as a service line in the middle of the chat, like the date
  // (Chat.css). The message and its block are marked here - no :has() over every message of the chat
  const EFFECT_ATTR = "data-nk-effect"

  function markEffects() {
    for (const el of document.querySelectorAll(`.chatWindow .msg:not([${EFFECT_ATTR}]) > .msgText > .RoomEffectContainer`)) {
      const message = el.closest(".msg")
      message.setAttribute(EFFECT_ATTR, "")
      message.closest(".ChatMessageBlock")?.setAttribute(EFFECT_ATTR, "")
      const button = el.querySelector("button")
      if (button && !button.title) button.title = button.textContent // the button is an icon: its words go to the tooltip
    }
  }

  // Messages are seen behind the message field (as in Telegram): the list of messages goes down to the bottom of the
  // chat, the field lies over its end, a darkening rises from the bottom edge (Chat.css). How much of the list the
  // field covers is told from here: the height of the field, with the reply bar above it when there is one
  const ENTRY_HOST_ATTR = "data-nk-entry-host"
  const watchedEntries = new WeakSet()
  const entrySizes = window.ResizeObserver ? new ResizeObserver(() => markEntryHeight()) : null

  function markEntryHeight() {
    for (const entry of document.querySelectorAll(".chatWindow .chatEntry")) {
      const host = entry.parentElement
      if (!host || !entry.offsetParent) continue // a chat that is not on screen
      if (entrySizes && !watchedEntries.has(entry)) {
        watchedEntries.add(entry)
        entrySizes.observe(entry) // the field grows with the text typed into it
      }
      const bar = host.querySelector(`:scope > #${REPLY_BAR_ID}`)
      const height = `${entry.offsetHeight + (bar ? bar.offsetHeight : 0)}px`
      if (host.style.getPropertyValue("--nk-entry-height") !== height) host.style.setProperty("--nk-entry-height", height)
      if (!host.hasAttribute(ENTRY_HOST_ATTR)) host.setAttribute(ENTRY_HOST_ATTR, "")
    }
  }

  // How many window buttons (minimize, maximize, close) the title bar shows: the buttons of the chat header stand
  // before them, and the Window Buttons option of the theme hides some. Chat.css makes the room by this number
  function markWindowButtons() {
    const count = [...document.querySelectorAll(".title-bar-actions .title-area-icon")].filter(button => button.offsetWidth > 0).length
    if (!count) return // not drawn yet
    const root = document.documentElement
    if (root.style.getPropertyValue("--nk-window-buttons") !== String(count)) root.style.setProperty("--nk-window-buttons", String(count))
  }

  function markInvites() {
    for (const el of document.querySelectorAll(INVITE)) {
      const info = describe(el)
      if (!info) continue
      if (el.getAttribute(GAME_ATTR) !== info.game) el.setAttribute(GAME_ATTR, info.game)
      if (el.getAttribute(TEXT_ATTR) !== info.text) el.setAttribute(TEXT_ATTR, info.text)
    }
  }


  // Message Time

  const TIME_CLASS = "nk-msg-time"
  const TIMES_READY = "nk-chat-times" // on <html>: CSS hides Steam's time in the name line

  const STEAM_LANGUAGES = {
    russian: "ru", ukrainian: "uk", bulgarian: "bg", english: "en", german: "de",
    french: "fr", spanish: "es", latam: "es-419", brazilian: "pt-BR", portuguese: "pt-PT",
    italian: "it", dutch: "nl", polish: "pl", czech: "cs", hungarian: "hu",
    romanian: "ro", danish: "da", finnish: "fi", swedish: "sv", norwegian: "no",
    greek: "el", turkish: "tr", thai: "th", vietnamese: "vi", indonesian: "id",
    japanese: "ja", koreana: "ko", schinese: "zh-Hans", tchinese: "zh-Hant", arabic: "ar",
  }
  const steamLanguage = new URLSearchParams(location.search).get("LANGUAGE")
  const LOCALE = STEAM_LANGUAGES[steamLanguage?.toLowerCase()] || navigator.language

  // 12 / 24h as Steam itself shows it in the name line (the line is hidden by CSS, its text stays)
  let hour12 = null
  function usesHour12() {
    if (hour12 !== null) return hour12
    const sample = document.querySelector(".speakerTimeStamp")?.textContent
    if (!sample) return null
    return (hour12 = /\b(AM|PM)\b|[ap]\.m\./i.test(sample))
  }

  function shortTime(date) {
    const steam = usesHour12()
    // Nothing to compare with yet: as the Last Seen option decides, when it is on
    if (steam === null && window.__nevkoExactTime?.formatTime) return window.__nevkoExactTime.formatTime(date)
    return date.toLocaleTimeString(LOCALE, { hour: steam ? "numeric" : "2-digit", minute: "2-digit", hour12: !!steam })
  }

  function fullDate(date) {
    const day = date.toLocaleDateString(LOCALE, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    return `${day}, ${shortTime(date)}`
  }

  // Seconds, from the message component above the bubble
  function timestampOf(el) {
    const key = Object.keys(el).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && el[key], depth = 0; fiber && depth < 8; fiber = fiber.return, depth++) {
      const stamp = fiber.memoizedProps?.msg?.rtTimestamp
      if (stamp) return stamp
    }
    return 0
  }

  // Date between the messages: Steam always writes it with the year ("Friday, October 9, 2026"). The year is left
  // out while it is the current one (the date without it is put in an attribute and drawn by Chat.css in place of
  // Steam's text); dates of other years stay as Steam writes them. The day is taken from the message under the date
  const DATE_ATTR = "data-nk-date"
  const DATE_SEEN = "data-nk-date-seen"

  function markDates() {
    const dates = `.chatWindow .chatHistory > .msg.timeDivision:not(.new_messages, .time_passes, [${DATE_SEEN}])`
    for (const el of document.querySelectorAll(dates)) {
      const bubble = el.nextElementSibling?.querySelector(":scope > .msg")
      const stamp = bubble ? timestampOf(bubble) : 0
      if (!stamp) continue // the messages under it are not drawn yet
      el.setAttribute(DATE_SEEN, "")
      const date = new Date(stamp * 1000)
      const year = date.getFullYear()
      // Only a text that has that year in it: "Today" and the like are left alone
      if (year !== new Date().getFullYear() || !el.textContent.includes(String(year))) continue
      el.setAttribute(DATE_ATTR, date.toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" }))
    }
  }

  function markTimes() {
    let any = false
    for (const bubble of document.querySelectorAll(".ChatMessageBlock > .msg")) {
      let time = bubble.querySelector(`:scope > .${TIME_CLASS}`)
      // Done already: the time of a message never changes (and this runs on every redraw)
      if (time) {
        any = true
        continue
      }
      const stamp = timestampOf(bubble)
      if (!stamp) continue
      any = true

      if (!time) {
        time = document.createElement("span")
        time.className = TIME_CLASS
        bubble.append(time)
      }
      const date = new Date(stamp * 1000)
      time.dataset.nkStamp = String(stamp)
      time.textContent = shortTime(date)
      time.title = fullDate(date)
    }
    if (any) document.documentElement.classList.add(TIMES_READY)
  }


  // Chat Header

  // Who the open chat is with: avatar, name, status. Lives in the title bar, shown when the chat is docked to the
  // friends list (no tabs there) - with tabs at the top the active tab says the same
  const HEADER_ID = "nk-chat-header"
  const HEADER_REFRESH = 5000 // status text ("... 9 hours ago") changes without any redraw

  function fiberProps(el, depth, pick) {
    const key = Object.keys(el).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && el[key], i = 0; fiber && i < depth; fiber = fiber.return, i++) {
      const value = pick(fiber.memoizedProps || {})
      if (value) return value
    }
    return null
  }

  function activeChat() {
    const tab = document.querySelector(".ChatTabs .ChatTab.Active")
    if (!tab) return null
    let friend = null
    let view = null
    for (const el of [tab, ...tab.querySelectorAll("*")]) {
      friend ??= fiberProps(el, 6, props => props.friend?.persona && props.friend)
      view ??= fiberProps(el, 6, props => props.tab)
      if (friend && view) break
    }
    return { tab, friend, view }
  }

  // Steam's own localized line: "Online", "Last online 9 hours ago", or the game being played
  function statusOf(friend) {
    let game = ""
    let text = ""
    try { game = friend.current_game_name || "" } catch { /* app info not loaded */ }
    try { text = friend.localized_online_status || "" } catch { /* persona not loaded */ }
    const state = friend.persona.m_ePersonaState
    const kind = game ? "ingame" : state === 0 ? "offline" : state === 3 || state === 4 ? "away" : "online"
    // Last Seen option: the exact time, written here. That script finds such lines by a number in them and would
    // leave Steam's "over a year ago" as it is
    const seen = friend.persona.m_rtLastSeenOnline
    const exact = kind === "offline" && seen > 0 && window.__nevkoExactTime?.lastSeenText
    if (exact) {
      try { text = exact(seen * 1000) || text } catch { /* that script changed */ }
    }
    return { kind, text: game || text }
  }

  // "... is typing a message": Steam shows it in a strip above the field (hidden in Chat.css), here it stands in the
  // header in place of the status. Steam's own words, without the name - the header has it
  const TYPING = ".chatWindow .FriendChatTypingNotification.FriendIsTyping"
  const TYPING_DOTS = '<span class="nk-typing-dots"><i></i><i></i><i></i></span>'

  function typingText() {
    // The strip itself is hidden: the shown chat is known by what the strip lies in
    if (![...document.querySelectorAll(TYPING)].some(el => el.parentElement?.offsetParent)) return ""
    const words = steamText("Friend_Chat_Typing", "%1$s is typing a message...")
    return words.replace(/%1\$s/g, "").replace(/[.…\s]+$/, "").replace(/\s+/g, " ").trim()
  }

  function ensureHeader(bar) {
    let header = document.getElementById(HEADER_ID)
    if (header?.parentElement === bar) return header
    header?.remove()
    header = document.createElement("div")
    header.id = HEADER_ID
    header.innerHTML = '<div class="nk-chat-header-avatar"></div><div class="nk-chat-header-text"><div class="nk-chat-header-name"></div><div class="nk-chat-header-status"></div></div>'
    header.addEventListener("click", () => {
      const id = header.dataset.nkSteamid
      hideProfile()
      if (id) location.href = `steam://url/SteamIDPage/${id}`
    })
    bar.append(header)
    return header
  }

  function updateHeader() {
    const bar = document.querySelector(".multiChatDialog > .ChatTabs")
    if (!bar) return
    const chat = activeChat()
    if (!chat) {
      document.getElementById(HEADER_ID)?.remove()
      document.getElementById(BACKDROP_ID)?.remove()
      return
    }
    updateBackdrop(bar, chat.friend)

    const header = ensureHeader(bar)
    const [avatarBox, textBox] = header.children
    const [nameBox, statusBox] = textBox.children
    const { tab, friend, view } = chat

    // Avatar and name are copies of the active tab's: same frame, same badge
    const avatar = tab.querySelector(".avatarHolder, [class*='ChatRoomGroupAvatar'], [class*='MultiFriendAvatar']")
    const avatarHtml = avatar?.outerHTML || ""
    if (avatarBox.dataset.nkSource !== avatarHtml) {
      avatarBox.dataset.nkSource = avatarHtml
      avatarBox.innerHTML = avatarHtml
    }
    const name = tab.querySelector(".playerName")
    let roomName = ""
    try { roomName = view?.GetTabName?.() || "" } catch { /* tab is closing */ }
    const nameHtml = name ? name.innerHTML : roomName.replace(/[&<>]/g, char => `&#${char.charCodeAt(0)};`)
    if (nameBox.dataset.nkSource !== nameHtml) {
      nameBox.dataset.nkSource = nameHtml
      nameBox.innerHTML = nameHtml
    }

    const status = friend ? statusOf(friend) : { kind: "", text: "" }
    const typing = friend ? typingText() : ""
    if (typing) {
      if (statusBox.dataset.nkSource !== `typing:${typing}`) {
        statusBox.dataset.nkSource = `typing:${typing}`
        statusBox.removeAttribute("data-nevko-ls")
        statusBox.setAttribute("data-nevko-ls-label", "") // the Last Seen option keeps away from this line
        statusBox.textContent = typing
        statusBox.insertAdjacentHTML("beforeend", TYPING_DOTS)
      }
    // Written only when Steam's text changes: the Last Seen option may have replaced it with the exact time
    } else if (statusBox.dataset.nkSource !== status.text) {
      statusBox.dataset.nkSource = status.text
      // Last Seen keeps its time in an attribute and puts it back: forget it, and keep that script away
      // from the line while the friend is not offline ("Online", a game name)
      statusBox.removeAttribute("data-nevko-ls")
      statusBox.toggleAttribute("data-nevko-ls-label", status.kind !== "offline")
      statusBox.textContent = status.text
    }
    if (header.dataset.nkStatus !== status.kind) header.dataset.nkStatus = status.kind
    const id = friend?.steamid64 || ""
    if ((header.dataset.nkSteamid || "") !== id) header.dataset.nkSteamid = id
  }


  // Mini Profile

  // Steam opens the mini profile when the cursor enters any part of a tab: it gets in the way of clicking and dragging tabs.
  // Here it opens only from the avatar - of a tab or of the chat header - through the same handler of the tab
  const TAB_ROW = ".ChatTabs .ChatTabRow"
  const TAB_AVATAR = `${TAB_ROW} .friend > div:has(> .avatarHolder)`
  const HEADER_AVATAR = `#${HEADER_ID} .nk-chat-header-avatar`
  let profileShown = null // { row, anchor }: where the mini profile is open from

  const propsOf = el => {
    const key = Object.keys(el).find(name => name.startsWith("__reactProps"))
    return key ? el[key] : null
  }

  // What the handler reads from the event: the element to stand beside, and the window
  const hoverEvent = el => ({ currentTarget: el, target: el, view: window, nativeEvent: {}, preventDefault() {}, stopPropagation() {} })

  function showProfile(row, anchor) {
    if (profileShown?.anchor === anchor) return
    hideProfile()
    try {
      propsOf(row)?.onMouseEnter?.(hoverEvent(anchor))
      profileShown = { row, anchor }
    } catch { /* Steam changed the handler */ }
  }

  function hideProfile() {
    if (!profileShown) return
    const { row, anchor } = profileShown
    profileShown = null
    try { propsOf(row)?.onMouseLeave?.(hoverEvent(anchor)) } catch { /* tab is gone */ }
  }

  function onProfileHover(event) {
    const target = event.target instanceof Element ? event.target : null
    const from = event.relatedTarget instanceof Element ? event.relatedTarget : null
    const entering = event.type === "mouseover"
    const inside = entering ? target : from   // element the cursor is going to
    const outside = entering ? from : target  // element the cursor is leaving

    // Steam must not learn that the cursor entered a tab: its own "show the mini profile" stays silent
    const row = inside?.closest(TAB_ROW)
    if (row && outside?.closest(TAB_ROW) !== row) event.stopPropagation()

    if (!entering) return
    const tabAvatar = target?.closest(TAB_AVATAR)
    const headerAvatar = target?.closest(HEADER_AVATAR)
    if (tabAvatar) showProfile(tabAvatar.closest(TAB_ROW), tabAvatar.closest(TAB_ROW))
    else if (headerAvatar) {
      const active = document.querySelector(".ChatTabs .ChatTab.Active .ChatTabRow")
      if (active) showProfile(active, headerAvatar)
    } else if (profileShown && !target?.closest("[class*='HoverPosition']")) hideProfile() // the popup itself keeps it open
  }

  function watchProfileHover() {
    document.addEventListener("mouseover", onProfileHover, true)
    document.addEventListener("mouseout", onProfileHover, true)
    document.documentElement.addEventListener("mouseleave", hideProfile)
  }


  // Header Background

  // Background of the friend's mini profile behind the chat header (video or picture; nothing when the friend has none)
  // Shown with the chat header, switched off by Options/No Header Background.css
  const BACKDROP_ID = "nk-chat-header-backdrop"

  function backdropOf(friend) {
    try {
      const loader = friend.miniProfileData
      loader.EnsureCommunityDataLoaded()
      // Steam: { image, "video/webm": url, "video/mp4": url } - animated backgrounds come as video only
      const { image, ...videos } = loader.profile_background || {}
      if (image || Object.keys(videos).length) return { kind: "background", image: image || "", videos }
    } catch { /* data is still loading */ }
    return null
  }

  function updateBackdrop(bar, friend) {
    let backdrop = document.getElementById(BACKDROP_ID)
    if (!backdrop || backdrop.parentElement !== bar) {
      backdrop?.remove()
      backdrop = document.createElement("div")
      backdrop.id = BACKDROP_ID
      bar.prepend(backdrop)
    }
    // Hidden by an option: nothing is loaded
    const wanted = friend && getComputedStyle(backdrop).display !== "none" ? backdropOf(friend) : null
    const signature = wanted ? JSON.stringify(wanted) : ""
    if ((backdrop.dataset.nkSource || "") === signature) return
    backdrop.dataset.nkSource = signature
    backdrop.dataset.nkKind = wanted?.kind || ""
    backdrop.replaceChildren()
    if (!wanted) return

    const types = Object.keys(wanted.videos)
    if (types.length) {
      const video = document.createElement("video")
      Object.assign(video, { muted: true, loop: true, autoplay: true, playsInline: true })
      if (wanted.image) video.poster = wanted.image
      for (const type of types) {
        const source = document.createElement("source")
        source.src = wanted.videos[type]
        source.type = type
        video.append(source)
      }
      backdrop.append(video)
    } else {
      const img = document.createElement("img")
      img.alt = ""
      img.draggable = false
      img.src = wanted.image
      backdrop.append(img)
    }
  }


  // Panel Resize

  // Grip on the inner edge of a side panel: drag to change the width (styles: .nk-panel-resize in Chat.css)
  // Used by Options/Emoticon Panel.js through window.__nevkoPanelResize
  // host(): the panel element | panelSide(): "left" / "right", where the panel stands | apply(width, done)
  function makeResizable({ id, host, panelSide, min, max, apply }) {
    const panel = host()
    if (!panel) return
    let grip = document.getElementById(id)
    if (grip?.parentElement === panel) return
    grip?.remove()
    grip = document.createElement("div")
    grip.id = id
    grip.className = "nk-panel-resize"

    grip.addEventListener("pointerdown", event => {
      if (event.button !== 0) return
      event.preventDefault()
      document.documentElement.classList.add("nk-panel-resizing")

      const move = e => {
        // The edge opposite to the grip stays where it is
        const rect = panel.getBoundingClientRect()
        const width = panelSide() === "left" ? e.clientX - rect.left : rect.right - e.clientX
        apply(Math.round(Math.min(max, Math.max(min, width))), false)
      }
      const end = () => {
        window.removeEventListener("pointermove", move, true)
        window.removeEventListener("pointerup", end, true)
        window.removeEventListener("pointercancel", end, true)
        document.documentElement.classList.remove("nk-panel-resizing")
        apply(null, true)
      }
      // On the window: the cursor leaves the 10px grip at once
      window.addEventListener("pointermove", move, true)
      window.addEventListener("pointerup", end, true)
      window.addEventListener("pointercancel", end, true)
    })
    panel.append(grip)
  }
  window.__nevkoPanelResize = makeResizable


  // Open Chat in the "Chats" List

  // A docked chat has no tabs: the chat on screen is marked in the list of the Recent Chats plugin
  // (color: Friends Tabs.css). Without the plugin nothing is marked
  const OPEN_ROW = "nk-chat-open"
  const DOCKED_CHAT = ".chat_main.singlewindow .multiChatDialog"
  const STEAMID_BASE = 76561197960265728n

  // The plugin keeps the friend only in its React key ("friend:<accountId>"); Friends Tabs.js puts it on the row
  function rowAccountId(row) {
    if (row.dataset.nkAccountid) return row.dataset.nkAccountid
    const key = Object.keys(row).find(name => name.startsWith("__reactFiber"))
    return String(row[key]?.key ?? "").match(/^friend:(\d+)$/)?.[1] || ""
  }

  function markOpenChat() {
    const rows = document.querySelectorAll(".rcp-row-wrapper")
    if (!rows.length) return
    const id = document.querySelector(DOCKED_CHAT) && activeChat()?.friend?.steamid64
    const account = id ? String(BigInt(id) - STEAMID_BASE) : ""
    for (const row of rows) {
      const open = !!account && rowAccountId(row) === account
      if (row.classList.contains(OPEN_ROW) !== open) row.classList.toggle(OPEN_ROW, open)
    }
  }


  // Width of the Friends List beside a Docked Chat

  // Steam: 300px at first, dragged between 200 and 440. Here: 360px at first (names of the favorites fit),
  // between 300 and 560, and the chat always keeps 400px (the same limits in Chat.css).
  // The drag is Steam's own, only the limits are replaced. Dragged far past the least width, the list folds
  const LIST_PREF = "nFriendsListSingleWindowWidthPx"
  const LIST_STEAM_DEFAULT = 300
  const LIST_DEFAULT = 360
  const LIST_MIN = 300
  const LIST_MAX = 560
  const LIST_CHAT_MIN = 400
  const LIST_FOLD_BELOW = 200 // the edge dragged this far past the least width: the list folds (there is no button for it)
  const LIST_SET_KEY = "nevko-docked-list-default" // our default is given once, then the width is the user's
  let listOwner = null

  // Keeps Steam's window settings (the width among them)
  function desktopApp() {
    for (const win of [window, window.opener]) {
      try {
        const desktop = win?.g_FriendsUIApp?.m_DesktopApp
        if (typeof desktop?.SetUIDisplayPref === "function" && desktop.UIDisplayPrefs) return desktop
      } catch { /* no access to that window */ }
    }
    return null
  }

  // A new width makes the browser lay out the whole friends list and the chat again (tens of ms): done on every
  // move of the mouse, the window stuttered. The divider itself follows the cursor at once (a transform, no layout);
  // the width is given to Steam at most once in LIST_STEP_MS, and when the button is let go
  const LIST_STEP_MS = 100
  let listWidthWaiting = null // px: the width asked for last, not given to Steam yet
  let listWidthTimer = null
  let listWidthAt = 0
  let listMouseUp = false

  function moveDivider(dx) {
    const divider = document.querySelector(".chat_main.singlewindow .singleWindowDivider")
    if (!divider) return
    const rtl = getComputedStyle(divider).direction === "rtl"
    const value = dx ? `translateX(${rtl ? -dx : dx}px)` : ""
    if (divider.style.transform !== value) divider.style.transform = value
  }

  function giveListWidth(desktop) {
    clearTimeout(listWidthTimer)
    listWidthTimer = null
    if (listWidthWaiting === null) return
    const width = listWidthWaiting
    listWidthWaiting = null
    listWidthAt = performance.now()
    moveDivider(0)
    desktop.SetUIDisplayPref(LIST_PREF, width)
  }

  function askListWidth(desktop, width) {
    listWidthWaiting = width
    moveDivider(width - desktop.UIDisplayPrefs[LIST_PREF])
    const wait = LIST_STEP_MS - (performance.now() - listWidthAt)
    if (wait <= 0) giveListWidth(desktop)
    else listWidthTimer ??= setTimeout(() => giveListWidth(desktop), wait)
  }

  function patchListWidth() {
    const divider = document.querySelector(".chat_main.singlewindow .singleWindowDivider")
    if (!divider) return
    const key = Object.keys(divider).find(name => name.startsWith("__reactFiber"))
    let owner = null
    for (let fiber = key && divider[key], i = 0; fiber && i < 20 && !owner; fiber = fiber.return, i++) {
      if (typeof fiber.stateNode?.SetFriendsListSingleWindowWidth === "function") owner = fiber.stateNode
    }
    if (!owner || owner === listOwner) return
    const desktop = desktopApp()
    if (!desktop) return
    listOwner = owner

    Object.defineProperty(owner, "SetFriendsListSingleWindowWidth", {
      configurable: true,
      writable: true,
      value(width) {
        // Steam's own fold / open buttons do it (the fold one is hidden by Chat.css); dragged back, the list opens again
        const folded = !!document.querySelector(".singleWindowDivider.friendsListCollapsed")
        if (width < LIST_FOLD_BELOW) {
          listWidthWaiting = null
          moveDivider(0)
          if (!folded) document.querySelector(".friendListCollapse .friendCollapseButton")?.click()
          return
        }
        if (folded) document.querySelector(".ChatTabs > .chatTabOpenFriendsList")?.click()
        const most = Math.max(LIST_MIN, Math.min(LIST_MAX, innerWidth - LIST_CHAT_MIN))
        askListWidth(desktop, Math.round(Math.max(LIST_MIN, Math.min(width, most))))
      },
    })
    // The button is let go: the last width at once
    if (!listMouseUp) {
      listMouseUp = true
      addEventListener("mouseup", () => giveListWidth(desktop), true)
    }
    if (!localStorage.getItem(LIST_SET_KEY)) {
      localStorage.setItem(LIST_SET_KEY, "1")
      if (desktop.UIDisplayPrefs[LIST_PREF] === LIST_STEAM_DEFAULT) desktop.SetUIDisplayPref(LIST_PREF, LIST_DEFAULT)
    }
  }


  // Spoilers

  // Steam shows a spoiler while the cursor is over it. Here, as in Telegram, it opens by a click and stays open
  // (styles and the "Spoiler" pill: Chat.css)
  const SPOILER = ".chatWindow .msgText .spoilerMsgText"
  const REVEALED_ATTR = "data-nk-revealed"

  function watchSpoilers() {
    document.documentElement.style.setProperty("--nk-spoiler-text", JSON.stringify(ownText("Spoiler")))
    document.addEventListener("click", event => {
      const spoiler = event.target instanceof Element && event.target.closest(`${SPOILER}:not([${REVEALED_ATTR}])`)
      if (!spoiler) return
      spoiler.setAttribute(REVEALED_ATTR, "")
      // The picture under it is not opened by the same click
      event.preventDefault()
      event.stopPropagation()
    }, true)
  }


  // Scroll to Bottom

  // Steam writes the number of unread messages into the words of its "scroll to bottom" button ("3 unread messages").
  // The button is a round arrow here (Chat.css): the number goes to an attribute and is drawn on its corner
  function markScrollButtons() {
    for (const button of document.querySelectorAll(".chatWindow .ScrollToBottomButton")) {
      const label = button.firstElementChild
      if (!label) continue
      const count = button.classList.contains("UnreadMessages") ? label.textContent.match(/\d+/)?.[0] || "" : ""
      if ((label.dataset.nkCount || "") === count) continue
      if (count) label.dataset.nkCount = count
      else delete label.dataset.nkCount
    }
  }


  // Chat Kind

  // Steam gives personal and group chats the same classes: mark the window, CSS hides avatars in personal ones
  function markChatKinds() {
    for (const chat of document.querySelectorAll(".chatWindow:not([data-nk-chat])")) {
      const view = fiberProps(chat, 12, props => props.chatView)
      if (!view) continue
      let friend = false
      try { friend = !!view.IsFriendChat?.() } catch { /* view is closing */ }
      chat.dataset.nkChat = friend ? "friend" : "room"
    }
  }


  // Menus in View

  // Steam puts a menu under its button even when it does not fit there (the reaction picker under a message low
  // in the chat): the menu stuck out of the window and the whole window scrolled up after it.
  // Such a menu is moved back inside, and the window itself never stays scrolled
  const MENU_EDGE = 8 // px from the window edge

  function fitMenus() {
    const others = document.querySelectorAll(".contextMenu:not([data-nk-emoticons]):not([data-nk-ghost])")
    if (others.length && (scrollX || scrollY)) scrollTo(0, 0) // measured in an unscrolled window
    for (const el of others) {
      if (el.style.translate) el.style.translate = "" // measured where Steam put it
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) continue
      const up = Math.max(0, Math.min(rect.bottom - (innerHeight - MENU_EDGE), rect.top - MENU_EDGE))
      const left = Math.max(0, Math.min(rect.right - (innerWidth - MENU_EDGE), rect.left - MENU_EDGE))
      if (up || left) el.style.translate = `${-left}px ${-up}px`
    }
  }

  function keepWindowUnscrolled() {
    addEventListener("scroll", () => {
      if ((scrollX || scrollY) && document.querySelector(".multiChatDialog")) scrollTo(0, 0)
    })
  }


  // Chat Menu

  // "More" button in the title bar, next to the invite button: profile, close the tab, window of the chat's own background.
  // The menu is built from the classes of Steam's own context menu, so it looks as every other menu of the theme
  // (without the "contextMenu" class: scripts that watch Steam's menus leave it alone)
  const MORE_ID = "nk-chat-more"
  const MENU_ID = "nk-chat-menu"
  const MENU_GAP = 6 // px between the button and the menu

  // Steam's own words where it has them
  function steamText(token, fallback) {
    for (const win of [window, window.opener]) {
      try {
        const text = win?.LocalizationManager?.LocalizeString(`#${token}`)
        if (text) return text
      } catch { /* no access to that window */ }
    }
    return fallback
  }
  // Texts of our own (Steam has no strings for them), in the languages of Steam. One row per language, in the order
  // of TEXT_KEYS; a language that is not here gets English. %s: the name of the person
  const TEXT_KEYS = [
    "Chat Background", "Custom Chat Background", "Add a picture", "No background", "Delete the picture",
    "Position", "Fill", "Fit", "Stretch", "Tile", "Center", "Blur", "Dimming", "Save", "Cancel",
    "Reply", "Reply to %s", "Spoiler", "Photo", "Video", "Sticker",
    "Global Custom Chat Background",
  ]
  const TEXTS = {
    ru: ["Фон чата", "Пользовательский фон чата", "Добавить картинку", "Без фона", "Удалить картинку", "Положение", "Заполнение", "По размеру", "Растянуть", "Замостить", "По центру", "Размытие", "Затемнение", "Сохранить", "Отмена", "Ответить", "Ответ %s", "Спойлер", "Фото", "Видео", "Стикер", "Глобальный пользовательский фон чата"],
    uk: ["Фон чату", "Власний фон чату", "Додати зображення", "Без фону", "Видалити зображення", "Положення", "Заповнення", "За розміром", "Розтягнути", "Плиткою", "По центру", "Розмиття", "Затемнення", "Зберегти", "Скасувати", "Відповісти", "Відповідь %s", "Спойлер", "Фото", "Відео", "Стікер", "Глобальний власний фон чату"],
    bg: ["Фон на чата", "Собствен фон на чата", "Добавяне на изображение", "Без фон", "Изтриване на изображението", "Позиция", "Запълване", "Побиране", "Разтягане", "Плочки", "Центриране", "Размазване", "Затъмняване", "Запазване", "Отказ", "Отговор", "Отговор на %s", "Спойлер", "Снимка", "Видео", "Стикер", "Общ собствен фон на чата"],
    de: ["Chat-Hintergrund", "Eigener Chat-Hintergrund", "Bild hinzufügen", "Kein Hintergrund", "Bild löschen", "Position", "Füllen", "Anpassen", "Strecken", "Kacheln", "Zentrieren", "Unschärfe", "Abdunkeln", "Speichern", "Abbrechen", "Antworten", "Antwort an %s", "Spoiler", "Foto", "Video", "Sticker", "Globaler eigener Chat-Hintergrund"],
    fr: ["Fond du chat", "Fond de chat personnalisé", "Ajouter une image", "Aucun fond", "Supprimer l'image", "Position", "Remplir", "Ajuster", "Étirer", "Mosaïque", "Centrer", "Flou", "Assombrissement", "Enregistrer", "Annuler", "Répondre", "Réponse à %s", "Spoiler", "Photo", "Vidéo", "Sticker", "Fond de chat personnalisé global"],
    es: ["Fondo del chat", "Fondo de chat personalizado", "Añadir imagen", "Sin fondo", "Eliminar imagen", "Posición", "Rellenar", "Ajustar", "Estirar", "Mosaico", "Centrar", "Desenfoque", "Oscurecer", "Guardar", "Cancelar", "Responder", "Respuesta a %s", "Spoiler", "Foto", "Vídeo", "Sticker", "Fondo de chat personalizado global"],
    pt: ["Fundo do chat", "Fundo de chat personalizado", "Adicionar imagem", "Sem fundo", "Eliminar imagem", "Posição", "Preencher", "Ajustar", "Esticar", "Mosaico", "Centrar", "Desfoque", "Escurecer", "Guardar", "Cancelar", "Responder", "Resposta a %s", "Spoiler", "Foto", "Vídeo", "Sticker", "Fundo de chat personalizado global"],
    "pt-br": ["Fundo do chat", "Fundo de chat personalizado", "Adicionar imagem", "Sem fundo", "Excluir imagem", "Posição", "Preencher", "Ajustar", "Esticar", "Lado a lado", "Centralizar", "Desfoque", "Escurecer", "Salvar", "Cancelar", "Responder", "Resposta a %s", "Spoiler", "Foto", "Vídeo", "Figurinha", "Fundo de chat personalizado global"],
    it: ["Sfondo della chat", "Sfondo chat personalizzato", "Aggiungi immagine", "Nessuno sfondo", "Elimina immagine", "Posizione", "Riempi", "Adatta", "Estendi", "Affianca", "Centra", "Sfocatura", "Oscuramento", "Salva", "Annulla", "Rispondi", "Risposta a %s", "Spoiler", "Foto", "Video", "Sticker", "Sfondo chat personalizzato globale"],
    nl: ["Chatachtergrond", "Aangepaste chatachtergrond", "Afbeelding toevoegen", "Geen achtergrond", "Afbeelding verwijderen", "Positie", "Vullen", "Passend", "Uitrekken", "Naast elkaar", "Centreren", "Vervaging", "Verduistering", "Opslaan", "Annuleren", "Beantwoorden", "Antwoord aan %s", "Spoiler", "Foto", "Video", "Sticker", "Algemene aangepaste chatachtergrond"],
    pl: ["Tło czatu", "Własne tło czatu", "Dodaj obraz", "Bez tła", "Usuń obraz", "Położenie", "Wypełnienie", "Dopasowanie", "Rozciągnięcie", "Sąsiadująco", "Wyśrodkowanie", "Rozmycie", "Przyciemnienie", "Zapisz", "Anuluj", "Odpowiedz", "Odpowiedź dla %s", "Spoiler", "Zdjęcie", "Wideo", "Naklejka", "Globalne własne tło czatu"],
    cs: ["Pozadí chatu", "Vlastní pozadí chatu", "Přidat obrázek", "Bez pozadí", "Smazat obrázek", "Umístění", "Vyplnit", "Přizpůsobit", "Roztáhnout", "Dlaždice", "Na střed", "Rozostření", "Ztmavení", "Uložit", "Zrušit", "Odpovědět", "Odpověď pro %s", "Spoiler", "Fotka", "Video", "Nálepka", "Globální vlastní pozadí chatu"],
    hu: ["Csevegés háttere", "Egyéni csevegőháttér", "Kép hozzáadása", "Nincs háttér", "Kép törlése", "Elhelyezés", "Kitöltés", "Igazítás", "Nyújtás", "Mozaik", "Középre", "Elmosás", "Sötétítés", "Mentés", "Mégse", "Válasz", "Válasz neki: %s", "Spoiler", "Fotó", "Videó", "Matrica", "Globális egyéni csevegőháttér"],
    ro: ["Fundalul chatului", "Fundal de chat personalizat", "Adaugă o imagine", "Fără fundal", "Șterge imaginea", "Poziție", "Umplere", "Potrivire", "Întindere", "Mozaic", "Centrare", "Estompare", "Întunecare", "Salvează", "Anulează", "Răspunde", "Răspuns pentru %s", "Spoiler", "Fotografie", "Video", "Sticker", "Fundal de chat personalizat global"],
    el: ["Φόντο συνομιλίας", "Προσαρμοσμένο φόντο συνομιλίας", "Προσθήκη εικόνας", "Χωρίς φόντο", "Διαγραφή εικόνας", "Θέση", "Γέμισμα", "Προσαρμογή", "Τέντωμα", "Παράθεση", "Στο κέντρο", "Θόλωση", "Σκίαση", "Αποθήκευση", "Ακύρωση", "Απάντηση", "Απάντηση σε %s", "Spoiler", "Φωτογραφία", "Βίντεο", "Αυτοκόλλητο", "Καθολικό προσαρμοσμένο φόντο συνομιλίας"],
    da: ["Chatbaggrund", "Brugerdefineret chatbaggrund", "Tilføj billede", "Ingen baggrund", "Slet billedet", "Placering", "Udfyld", "Tilpas", "Stræk", "Side om side", "Centrer", "Sløring", "Dæmpning", "Gem", "Annuller", "Svar", "Svar til %s", "Spoiler", "Foto", "Video", "Klistermærke", "Global brugerdefineret chatbaggrund"],
    sv: ["Chattbakgrund", "Anpassad chattbakgrund", "Lägg till bild", "Ingen bakgrund", "Ta bort bilden", "Placering", "Fyll", "Anpassa", "Sträck ut", "Sida vid sida", "Centrera", "Oskärpa", "Nedtoning", "Spara", "Avbryt", "Svara", "Svar till %s", "Spoiler", "Foto", "Video", "Klistermärke", "Global anpassad chattbakgrund"],
    no: ["Chatbakgrunn", "Egendefinert chatbakgrunn", "Legg til bilde", "Ingen bakgrunn", "Slett bildet", "Plassering", "Fyll", "Tilpass", "Strekk", "Side ved side", "Midtstill", "Uskarphet", "Nedtoning", "Lagre", "Avbryt", "Svar", "Svar til %s", "Spoiler", "Bilde", "Video", "Klistremerke", "Global egendefinert chatbakgrunn"],
    fi: ["Keskustelun tausta", "Oma keskustelun tausta", "Lisää kuva", "Ei taustaa", "Poista kuva", "Sijainti", "Täytä", "Sovita", "Venytä", "Vierekkäin", "Keskitä", "Sumennus", "Himmennys", "Tallenna", "Peruuta", "Vastaa", "Vastaus käyttäjälle %s", "Spoileri", "Kuva", "Video", "Tarra", "Yleinen oma keskustelun tausta"],
    tr: ["Sohbet arka planı", "Özel sohbet arka planı", "Resim ekle", "Arka plan yok", "Resmi sil", "Konum", "Doldur", "Sığdır", "Uzat", "Döşe", "Ortala", "Bulanıklık", "Karartma", "Kaydet", "İptal", "Yanıtla", "%s için yanıt", "Spoiler", "Fotoğraf", "Video", "Çıkartma", "Genel özel sohbet arka planı"],
    ar: ["خلفية المحادثة", "خلفية محادثة مخصصة", "إضافة صورة", "بدون خلفية", "حذف الصورة", "الموضع", "تعبئة", "ملاءمة", "تمديد", "تجانب", "توسيط", "تمويه", "تعتيم", "حفظ", "إلغاء", "رد", "رد على %s", "حرق", "صورة", "فيديو", "ملصق", "خلفية محادثة مخصصة عامة"],
    ja: ["チャットの背景", "カスタムチャット背景", "画像を追加", "背景なし", "画像を削除", "配置", "ページ幅に合わせる", "画面に合わせる", "拡大して表示", "並べて表示", "中央に表示", "ぼかし", "暗さ", "保存", "キャンセル", "返信", "%s への返信", "ネタバレ", "写真", "動画", "ステッカー", "全体のカスタムチャット背景"],
    ko: ["채팅 배경", "사용자 지정 채팅 배경", "이미지 추가", "배경 없음", "이미지 삭제", "위치", "채우기", "맞춤", "늘이기", "바둑판식", "가운데", "흐림", "어둡게", "저장", "취소", "답장", "%s에게 답장", "스포일러", "사진", "동영상", "스티커", "전체 사용자 지정 채팅 배경"],
    "zh-cn": ["聊天背景", "自定义聊天背景", "添加图片", "无背景", "删除图片", "位置", "填充", "适应", "拉伸", "平铺", "居中", "模糊", "变暗", "保存", "取消", "回复", "回复 %s", "剧透", "图片", "视频", "贴纸", "全局自定义聊天背景"],
    "zh-tw": ["聊天背景", "自訂聊天背景", "新增圖片", "無背景", "刪除圖片", "位置", "填滿", "符合", "延展", "並排", "置中", "模糊", "變暗", "儲存", "取消", "回覆", "回覆 %s", "劇透", "圖片", "影片", "貼圖", "全域自訂聊天背景"],
    th: ["พื้นหลังแชต", "พื้นหลังแชตแบบกำหนดเอง", "เพิ่มรูปภาพ", "ไม่มีพื้นหลัง", "ลบรูปภาพ", "ตำแหน่ง", "เติมเต็ม", "พอดี", "ยืด", "เรียงต่อกัน", "กึ่งกลาง", "เบลอ", "ความมืด", "บันทึก", "ยกเลิก", "ตอบกลับ", "ตอบกลับ %s", "สปอยล์", "รูปภาพ", "วิดีโอ", "สติกเกอร์", "พื้นหลังแชตแบบกำหนดเองทั้งหมด"],
    vi: ["Nền trò chuyện", "Nền trò chuyện tùy chỉnh", "Thêm ảnh", "Không có nền", "Xóa ảnh", "Vị trí", "Lấp đầy", "Vừa khít", "Kéo giãn", "Xếp lát", "Căn giữa", "Làm mờ", "Làm tối", "Lưu", "Hủy", "Trả lời", "Trả lời %s", "Spoiler", "Ảnh", "Video", "Nhãn dán", "Nền trò chuyện tùy chỉnh chung"],
    id: ["Latar obrolan", "Latar obrolan kustom", "Tambah gambar", "Tanpa latar", "Hapus gambar", "Posisi", "Isi", "Sesuaikan", "Regangkan", "Ubin", "Tengah", "Buram", "Peredupan", "Simpan", "Batal", "Balas", "Balasan untuk %s", "Spoiler", "Foto", "Video", "Stiker", "Latar obrolan kustom global"],
  }
  // Steam names its language in the page: "ru", "pt-BR", "zh-CN"...
  function ownTexts() {
    const lang = (document.documentElement.lang || "en").toLowerCase()
    const zh = lang.startsWith("zh") && (/tw|hk|hant/.test(lang) ? "zh-tw" : "zh-cn")
    return TEXTS[lang] || TEXTS[zh] || TEXTS[lang.split("-")[0]] || TEXTS[{ nb: "no", nn: "no" }[lang]] || null
  }
  const ownText = english => ownTexts()?.[TEXT_KEYS.indexOf(english)] || english

  // One background per chat: a friend by the id, a group by its name
  function chatKey(chat) {
    if (chat.friend?.steamid64) return `friend:${chat.friend.steamid64}`
    let name = ""
    try { name = chat.view?.GetTabName?.() || "" } catch { /* tab is closing */ }
    return name ? `room:${name}` : ""
  }

  function closeMenu() {
    document.getElementById(MENU_ID)?.remove()
    document.getElementById(MORE_ID)?.classList.remove("nk-open")
  }

  function menuItems(chat) {
    const key = chatKey(chat)
    const id = chat.friend?.steamid64
    return [
      id && { text: steamText("Friend_Menu_ViewProfile", "View Profile"), run: () => { location.href = `steam://url/SteamIDPage/${id}` } },
      { text: steamText("Chat_CloseTabAction", "Close Tab"), run: () => chat.tab.querySelector(".CloseButton")?.click() },
      key && "separator",
      key && { text: ownText("Custom Chat Background"), run: () => openBackgroundDialog(key) },
    ].filter(Boolean)
  }

  function openMenu(button) {
    const chat = activeChat()
    if (!chat) return
    const menu = document.createElement("div")
    menu.id = MENU_ID
    menu.className = "PP7LM0Ow1K5qkR8WElLpt visible ready"
    const list = document.createElement("div")
    list.className = "_2EstNjFIIZm_WUSKm5Wt7n contextMenuContents"
    for (const item of menuItems(chat)) {
      const row = document.createElement("div")
      if (item === "separator") {
        row.className = "WUOrULWKkGLl3ZUQdDXg8 ContextMenuSeparator"
      } else {
        row.className = "_1n7Wloe5jZ6fSuvV18NNWI contextMenuItem"
        row.setAttribute("role", "menuitem")
        row.textContent = item.text
        row.addEventListener("click", () => {
          closeMenu()
          item.run()
        })
      }
      list.append(row)
    }
    menu.append(list)
    document.body.append(menu)
    button.classList.add("nk-open")

    // Under the button, right edges in line; kept inside the window
    const at = button.getBoundingClientRect()
    const left = Math.max(MENU_EDGE, Math.min(at.right - menu.offsetWidth, innerWidth - MENU_EDGE - menu.offsetWidth))
    const top = Math.min(at.bottom + MENU_GAP, innerHeight - MENU_EDGE - menu.offsetHeight)
    menu.style.left = `${left}px`
    menu.style.top = `${top}px`
  }

  // Steam's own menu of the chat (the one a right click on its tab gives: close, profile, trade, manage...) is opened
  // from the button, and the background item is added at its end. A docked chat has no tabs to right-click.
  // The menu above is the spare one, for when Steam's menu did not come
  const STEAM_MENU_WIDTH = 220 // px, about (it depends on the language): its right edge comes under the button
  const STEAM_MENU_WAIT = 2000 // ms: a menu drawn in a window of its own takes long when Steam is busy

  // Steam draws a menu in this page when it fits, in a small window of its own when it does not
  function shownMenus() {
    const menus = [...document.querySelectorAll(".contextMenu")]
    try {
      for (const popup of window.opener.g_PopupManager.m_mapPopups.values()) {
        const doc = (popup.m_popup || popup.window)?.document
        if (doc && doc !== document && !doc.hidden) menus.push(...doc.querySelectorAll(".contextMenu"))
      }
    } catch { /* no access to Steam's windows */ }
    return menus
  }

  // Steam's menu object: props of the component around the menu element
  function menuInstance(el) {
    const key = Object.keys(el).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && el[key], depth = 0; fiber && depth < 8; fiber = fiber.return, depth++) {
      const instance = fiber.memoizedProps?.instance
      if (typeof instance?.Hide === "function") return instance
    }
    return null
  }

  // key: whose background the item opens (a chat's, or BG_GLOBAL)
  function addOwnItems(menu, key) {
    const list = menu.querySelector(".contextMenuContents")
    if (!list || list.querySelector("[data-nk-own]")) return
    // A plain item of that menu to look like: the last one (the first of the status menu is the lit "Online")
    const sample = [...list.querySelectorAll(".contextMenuItem")].filter(item => !item.querySelector("svg")).pop()
    if (!sample) return
    const doc = menu.ownerDocument // the menu may live in a window of its own
    const separator = doc.createElement("div")
    separator.className = list.querySelector(".ContextMenuSeparator")?.className || "ContextMenuSeparator"
    const item = doc.createElement("div")
    item.className = sample.className
    item.setAttribute("role", "menuitem")
    item.setAttribute("data-nk-own", "")
    item.textContent = ownText(key === BG_GLOBAL ? "Global Custom Chat Background" : "Custom Chat Background")
    item.addEventListener("click", () => {
      try { menuInstance(menu)?.Hide() } catch { /* Steam closes it on the lost focus */ }
      openBackgroundDialog(key)
    })
    // As Steam's items do: a submenu opened from another item closes (or that item stays lit, its submenu open)
    item.addEventListener("mouseenter", () => {
      try { menuInstance(menu)?.HideSubMenu?.() } catch { /* Steam changed its menus */ }
    })
    list.append(separator, item)
  }

  // A second press on the button closes the menu. Steam closes it itself on the press (a click outside the menu),
  // and the click that follows would open it again: the moment it was closed is remembered
  const REPRESS_MS = 400
  let steamMenu = null // Steam's menu object opened from the button
  let steamMenuClosedAt = 0

  function watchClosing(menu) {
    const instance = menuInstance(menu)
    if (!instance || Object.hasOwn(instance, "InternalHide")) return
    steamMenu = instance
    const hide = instance.InternalHide
    instance.InternalHide = function (...args) {
      if (this.visible) steamMenuClosedAt = Date.now()
      if (steamMenu === this) steamMenu = null
      delete this.InternalHide
      return hide.apply(this, args)
    }
  }

  // Asked when the button goes down (the click comes when it is let go, any time later).
  // true: the menu is open, or this very press has just closed it
  function pressClosesSteamMenu() {
    if (steamMenu?.visible) {
      try { steamMenu.Hide() } catch { /* Steam closes it on the lost focus */ }
      return true
    }
    return Date.now() - steamMenuClosedAt < REPRESS_MS
  }

  // The menu of the own status (opened from the plate with the nickname) gets "Global Custom Chat Background":
  // the background of every chat that has none of its own. The menu is known by what it hangs on
  function addGlobalItem() {
    for (const menu of document.querySelectorAll(".contextMenu.visible:not([data-nk-emoticons]):not([data-nk-ghost])")) {
      if (menu.querySelector("[data-nk-own]")) continue
      const anchor = menuInstance(menu)?.m_position?.element
      if (anchor instanceof Element && anchor.closest(".currentUserContainer")) addOwnItems(menu, BG_GLOBAL)
    }
  }

  async function openSteamMenu(button) {
    const chat = activeChat()
    const show = chat && propsOf(chat.tab)?.onContextMenu
    const key = chat && chatKey(chat)
    if (!show || !key) return false
    const at = button.getBoundingClientRect()
    const x = Math.round(at.right - STEAM_MENU_WIDTH)
    const y = Math.round(at.bottom + MENU_GAP)
    const before = new Set(shownMenus())
    // In this page, not in a window of its own (that one takes Steam about half a second to make): asked from
    // Context Menu Renderer.js, which decides while the menu is being shown. Without that script: a window, as before
    try { window.opener.__nkInlineNext = window } catch { /* no access to Steam's window */ }
    try {
      show({
        clientX: x, clientY: y, pageX: x, pageY: y, button: 2,
        currentTarget: chat.tab, target: chat.tab, view: window,
        nativeEvent: new MouseEvent("contextmenu", { clientX: x, clientY: y }),
        preventDefault() {}, stopPropagation() {}, persist() {},
      })
    } catch {
      return false // Steam changed the handler
    } finally {
      try { delete window.opener.__nkInlineNext } catch { /* no access */ }
    }
    // The menu of the tab is known by its "Close Tab"
    const closeText = steamText("Chat_CloseTabAction", "")
    for (const until = Date.now() + STEAM_MENU_WAIT; Date.now() < until;) {
      await new Promise(resolve => setTimeout(resolve, 30))
      const menu = shownMenus().find(el => [...el.querySelectorAll(".contextMenuItem")].some(item => item.textContent === closeText))
      if (menu) {
        addOwnItems(menu, key)
        watchClosing(menu)
        return true
      }
    }
    // Some menu did come, only not known as the tab's: the spare menu is not put over it
    return shownMenus().some(el => !before.has(el) && !el.matches("[data-nk-emoticons], [data-nk-ghost]"))
  }

  function ensureMoreButton() {
    const host = document.querySelector(".multiChatDialog .chatDialogs")
    const button = document.getElementById(MORE_ID)
    if (!host || !document.querySelector(".ChatTabs .ChatTab.Active")) return button?.remove()
    if (button?.parentElement === host) return
    button?.remove()
    const fresh = document.createElement("div")
    fresh.id = MORE_ID
    fresh.setAttribute("role", "button")
    let opening = false // pressed again while Steam's menu is still coming: one menu, not two
    let closing = false // this press closes the menu: its click opens nothing
    fresh.addEventListener("mousedown", () => { closing = pressClosesSteamMenu() })
    fresh.addEventListener("click", async () => {
      if (document.getElementById(MENU_ID)) return closeMenu()
      if (opening || closing) return
      opening = true
      try {
        if (!(await openSteamMenu(fresh))) openMenu(fresh)
      } finally {
        opening = false
      }
    })
    host.append(fresh)
  }

  // Call Button

  // Steam keeps "start voice chat" in the row of the message field. Here it stands in the title bar, between the
  // invite and the "more" buttons: a button of ours that shows the icon and the state of Steam's one and presses it.
  // Steam's own is hidden while there is no call (Chat.css); during a call it comes back with its controls
  const CALL_ID = "nk-chat-call"
  const VOICE_TOGGLE = ".chatEntry .ChatMessageEntryVoice .VoiceToggle"
  const VOICE_STATES = ["Active", "Disabled", "MicMuted", "NoMicrophone"]
  // Of the chat on screen: every open chat has its own
  const voiceToggle = () => [...document.querySelectorAll(VOICE_TOGGLE)].find(el => el.closest(".chatWindow")?.offsetParent)

  // No call can be started: Steam's button says so by a class, by its "disabled", or the chat itself does
  function callUnavailable(toggle) {
    if (toggle.classList.contains("Disabled") || propsOf(toggle)?.disabled) return true
    try {
      return fiberProps(toggle, 8, props => props.chat)?.BIsVoiceAllowed?.() === false
    } catch {
      return false
    }
  }

  function ensureCallButton() {
    const host = document.querySelector(".multiChatDialog .chatDialogs")
    const source = voiceToggle()
    let button = document.getElementById(CALL_ID)
    if (!host || !source) return button?.remove()
    if (button?.parentElement !== host) {
      button?.remove()
      button = document.createElement("div")
      button.id = CALL_ID
      button.setAttribute("role", "button")
      button.addEventListener("click", () => {
        const toggle = voiceToggle()
        if (toggle && !callUnavailable(toggle)) (toggle.querySelector("svg") || toggle).dispatchEvent(new MouseEvent("click", { bubbles: true }))
      })
      host.append(button)
    }
    const icon = source.querySelector("svg")?.outerHTML || ""
    if (button.innerHTML !== icon) button.innerHTML = icon
    if (button.title !== source.title) button.title = source.title // Steam's words: what the button does, or why it can not
    for (const state of VOICE_STATES) {
      const on = state === "Disabled" ? callUnavailable(source) : source.classList.contains(state)
      if (button.classList.contains(state) !== on) button.classList.toggle(state, on)
    }
  }

  function watchMenu() {
    addEventListener("mousedown", event => {
      if (event.target instanceof Element && event.target.closest(`#${MENU_ID}, #${MORE_ID}`)) return
      closeMenu()
    }, true)
    addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu()
    }, true)
    addEventListener("blur", closeMenu)
    addEventListener("resize", closeMenu)
  }


  // Custom Chat Background

  // A picture behind one chat, with its own blur and dimming (set in the window opened from the chat menu).
  // Everything is kept in the theme folder "Cache": the pictures themselves and backgrounds.json -
  // the list of pictures and, for every chat, its picture, its layout, blur and dimming. The file can be edited or deleted by hand.
  // Read through the theme's own address; written through Steam (a page cannot write files itself). Styles in Chat.css
  const BG_FOLDER = "Cache"
  const BG_FILE = "backgrounds.json"
  const BG_ATTR = "data-nk-chat-bg"
  const BG_GLOBAL = "global" // in place of a chat key: the background of the chats that have none of their own
  const BG_LAYER_ID = "nk-chat-bg"
  const BG_DIALOG_ID = "nk-chat-bg-dialog"
  const BG_MAX = 30 * 1024 * 1024 // bytes
  const BG_DEFAULTS = { picture: "", blur: 0, dim: 45, fit: "fill" } // blur in px, dim in %
  const BG_FITS = ["fill", "fit", "stretch", "tile", "center"] // as the wallpaper of Windows (sizes in Chat.css)
  const BG_BLUR_MAX = 24
  const BG_DIM_MAX = 90
  const library = new Map() // file name -> address of the picture
  const chatBackgrounds = new Map() // chat key -> { name, picture, blur, dim }
  let draft = null // { key, picture, blur, dim } while the window is open: shown in the chat at once

  const pictureUrl = name => `${THEME_URL}${BG_FOLDER}/${encodeURIComponent(name)}`
  const within = (value, max) => Math.max(0, Math.min(Number(value) || 0, max))

  async function loadBackgrounds() {
    try {
      const response = await fetch(`${THEME_URL}${BG_FOLDER}/${BG_FILE}?${Date.now()}`, { cache: "no-store" })
      const data = response.ok ? await response.json() : {} // no file: no backgrounds yet
      for (const name of data.pictures || []) {
        if (typeof name === "string" && name) library.set(name, pictureUrl(name))
      }
      for (const [key, chat] of Object.entries(data.chats || {})) {
        if (!chat || !library.has(chat.picture)) continue
        chatBackgrounds.set(key, {
          name: String(chat.name || ""),
          picture: chat.picture,
          blur: within(chat.blur ?? BG_DEFAULTS.blur, BG_BLUR_MAX),
          dim: within(chat.dim ?? BG_DEFAULTS.dim, BG_DIM_MAX),
          fit: BG_FITS.includes(chat.fit) ? chat.fit : BG_DEFAULTS.fit,
        })
      }
    } catch (error) {
      console.warn(`[NEVKO] chat backgrounds: ${BG_FOLDER}/${BG_FILE} is not read (broken JSON?)`, error)
    }
    applyBackground()
  }

  // Writing: Steam's own "write a file" request (the screenshot manager saves pictures with it), taken from Steam's
  // code in the main window, and Millennium's answer to where the themes are on the disk
  let disk = null // { folder, write(name, buffer), remove(name) }
  async function diskAccess() {
    if (disk) return disk
    const shared = [window, window.opener].find(win => {
      try { return !!win?.Millennium?.callServerMethod && !!win.webpackChunksteamui } catch { return false }
    })
    const themeName = decodeURIComponent(THEME_URL.match(/\/themes\/([^/]+)\/$/)?.[1] || "")
    if (!shared || !themeName) throw new Error("no access to Steam's main window")

    const config = await shared.Millennium.callServerMethod("core", "Core_GetStartConfig")
    const themes = String((typeof config === "string" ? JSON.parse(config) : config).themesPath || "").split("\\").join("/")
    if (!themes) throw new Error("Millennium did not say where the themes are")

    let load = null
    shared.webpackChunksteamui.push([[Symbol("nevko")], {}, require => { load = require }])
    const id = Object.keys(load.m).find(key => String(load.m[key]).includes("SystemManager.WriteFile#1"))
    const service = id && Object.values(load(id)).find(value => typeof value?.WriteFile === "function")
    if (!service) throw new Error("Steam has no file writing request any more")

    const folder = `${themes}/${themeName}/${BG_FOLDER}`
    disk = {
      folder,
      // The bytes must belong to the window the request is sent from
      async write(name, buffer) {
        const result = await service.WriteFile({ path: `${folder}/${name}`, data: new shared.Uint8Array(buffer) })
        if (!result.BSuccess()) throw new Error(`"${name}" is not written`)
      },
      // Steam can move a file, not delete it: out to Steam's temporary folder
      async remove(name) {
        const extension = name.includes(".") ? name.split(".").pop() : "tmp"
        await shared.SteamClient.System.MoveFile(`${folder}/${name}`, await shared.SteamClient.System.CreateTempPath(extension))
      },
    }
    return disk
  }

  // One write after another: a picture is on the disk before the list that names it
  let writing = Promise.resolve()
  function onDisk(work) {
    writing = writing.then(async () => work(await diskAccess())).catch(error => {
      console.warn(`[NEVKO] chat backgrounds: "${BG_FOLDER}" is not written, the change lives until Steam is closed`, error)
    })
    return writing
  }

  function writeList() {
    const data = { pictures: [...library.keys()], chats: Object.fromEntries(chatBackgrounds) }
    return onDisk(files => files.write(BG_FILE, new TextEncoder().encode(`${JSON.stringify(data, null, 2)}\n`).buffer))
  }

  // A name the folder does not have yet, without the characters a file name cannot hold
  function freeName(original) {
    const clean = original.replace(/[\\/:*?"<>|]/g, "_").trim() || "background"
    const dot = clean.lastIndexOf(".")
    const [base, extension] = dot > 0 ? [clean.slice(0, dot), clean.slice(dot)] : [clean, ""]
    let name = clean
    for (let i = 2; library.has(name); i++) name = `${base} (${i})${extension}`
    return name
  }

  function addPicture(file) {
    const name = freeName(file.name)
    library.set(name, URL.createObjectURL(file)) // shown at once; from the folder after a restart
    onDisk(async files => files.write(name, await file.arrayBuffer()))
    writeList()
    return name
  }

  // Chats that had it are left without a background
  function removePicture(name) {
    library.delete(name)
    if (previewList().delete(name)) savePreviews()
    for (const [key, chat] of chatBackgrounds) {
      if (chat.picture === name) chatBackgrounds.delete(key)
    }
    writeList()
    onDisk(files => files.remove(name))
  }

  // name: who the chat is with, only to make the file readable
  function saveChatBackground(key, { picture, blur, dim, fit }) {
    if (library.has(picture)) {
      const chat = key === BG_GLOBAL ? null : activeChat()
      let name = key === BG_GLOBAL ? "All chats without a background of their own" : chat?.friend?.display_name || ""
      try { name ||= chat?.view?.GetTabName?.() || "" } catch { /* tab is closing */ }
      chatBackgrounds.set(key, { name: name || chatBackgrounds.get(key)?.name || "", picture, blur, dim, fit })
    } else {
      chatBackgrounds.delete(key)
    }
    writeList()
  }

  // Layer behind the whole chat (messages and the message field): the box that holds both.
  // Every open chat has its window, only one of them is on screen
  function backgroundLayer(create) {
    const host = [...document.querySelectorAll(".chatWindow .ChatRoomGroupDialog_contents")].find(el => el.offsetParent)
    let layer = document.getElementById(BG_LAYER_ID)
    if (layer && (layer.parentElement !== host || !create)) {
      layer.remove()
      layer = null
    }
    if (!layer && create && host) {
      layer = document.createElement("div")
      layer.id = BG_LAYER_ID
      layer.append(document.createElement("div"))
      host.append(layer)
    }
    return layer
  }

  function applyBackground() {
    const dialogs = document.querySelector(".multiChatDialog .chatDialogs")
    if (!dialogs) return
    const chat = activeChat()
    const key = chat ? chatKey(chat) : ""
    const global = draft?.key === BG_GLOBAL
    if (draft && !global && draft.key !== key) return closeBackgroundDialog(false) // another chat was opened
    // Its own background, or the global one (while that one is being chosen, it is shown as it will be)
    const settings = (draft?.key === key ? draft : chatBackgrounds.get(key)) || (global ? draft : chatBackgrounds.get(BG_GLOBAL))
    const url = (settings && library.get(settings.picture)) || ""
    if (dialogs.hasAttribute(BG_ATTR) !== !!url) dialogs.toggleAttribute(BG_ATTR, !!url)
    // The chat header is not inside the dialogs: it starts where the card does (Chat.css)
    const header = document.getElementById(HEADER_ID)
    if (header && header.hasAttribute(BG_ATTR) !== !!url) header.toggleAttribute(BG_ATTR, !!url)
    const layer = backgroundLayer(!!url)
    if (!layer) return
    const values = { "--nk-chat-bg": `url("${url}")`, "--nk-chat-bg-blur": `${settings.blur}px`, "--nk-chat-bg-dim": `${settings.dim}%` }
    for (const [name, value] of Object.entries(values)) {
      if (layer.style.getPropertyValue(name) !== value) layer.style.setProperty(name, value)
    }
    if (layer.dataset.nkFit !== settings.fit) layer.dataset.nkFit = settings.fit
  }


  // Window of the Background

  // Opens under the "more" button, built as a context menu of the theme. Pictures to choose from (the first tile adds
  // one, the second is "no background"), two sliders, Save / Cancel.
  // Every change is shown in the chat behind the window at once; Cancel puts the chat back as it was
  function closeBackgroundDialog(save) {
    const dialog = document.getElementById(BG_DIALOG_ID)
    if (!dialog) return
    dialog.remove()
    if (save && draft) saveChatBackground(draft.key, draft)
    draft = null
    applyBackground()
  }

  function tile(className, title, onPick) {
    const el = document.createElement("div")
    el.className = `nk-bg-tile ${className}`
    el.title = title
    el.addEventListener("click", onPick)
    return el
  }

  // Small copies of the pictures for the tiles of the window: a tile showed the whole file (some are many megabytes,
  // each was decoded again on every opening). A copy is made once, 128px wide, and kept between the sessions
  const PREVIEW_KEY = "nevko-bg-previews"
  const PREVIEW_WIDTH = 128 // px: a tile is about half of that
  let previews = null // file name -> data: address of the small copy

  function previewList() {
    if (previews) return previews
    try { previews = new Map(Object.entries(JSON.parse(localStorage.getItem(PREVIEW_KEY) || "{}"))) } catch { previews = new Map() }
    return previews
  }

  function savePreviews() {
    try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(Object.fromEntries(previewList()))) } catch { /* no room: made again next time */ }
  }

  async function makePreview(name, url) {
    const blob = await (await fetch(url)).blob()
    const bitmap = await createImageBitmap(blob, { resizeWidth: PREVIEW_WIDTH, resizeQuality: "medium" })
    const canvas = document.createElement("canvas")
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext("2d").drawImage(bitmap, 0, 0)
    bitmap.close?.()
    const preview = canvas.toDataURL("image/webp", 0.7)
    if (!library.has(name)) return "" // deleted meanwhile
    previewList().set(name, preview)
    savePreviews()
    return preview
  }

  // The small copy on the tile; made in the background when there is none yet (the tile is empty until then)
  function showPreview(el, name, url) {
    const ready = previewList().get(name)
    if (ready) return void (el.style.backgroundImage = `url("${ready}")`)
    makePreview(name, url).then(preview => {
      if (el.isConnected) el.style.backgroundImage = `url("${preview || url}")`
    }).catch(() => {
      if (el.isConnected) el.style.backgroundImage = `url("${url}")` // the picture itself, as before
    })
  }

  function drawTiles(box) {
    const choose = id => {
      draft.picture = id
      applyBackground()
      drawTiles(box)
    }
    const add = tile("nk-bg-add", ownText("Add a picture"), () => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.addEventListener("change", () => {
        const file = input.files[0]
        if (file && file.type.startsWith("image/") && file.size <= BG_MAX && draft) choose(addPicture(file))
      })
      input.click()
    })
    const none = tile("nk-bg-none", ownText("No background"), () => choose(""))
    none.classList.toggle("nk-picked", !library.has(draft.picture))
    const pictures = [...library].reverse().map(([id, url]) => { // the newest first
      const el = tile("nk-bg-picture", "", () => choose(id))
      showPreview(el, id, url)
      el.classList.toggle("nk-picked", draft.picture === id)
      const remove = document.createElement("div")
      remove.className = "nk-bg-remove"
      remove.title = ownText("Delete the picture")
      remove.addEventListener("click", event => {
        event.stopPropagation()
        removePicture(id)
        if (draft.picture === id) draft.picture = ""
        applyBackground()
        drawTiles(box)
      })
      el.append(remove)
      return el
    })
    box.replaceChildren(add, none, ...pictures)
  }

  // Track, fill and handle are drawn (as the sliders of the theme settings); the real input lies over them, unseen
  function slider(label, name, max, unit) {
    const row = document.createElement("label")
    row.className = "nk-bg-slider"
    const text = document.createElement("span")
    text.textContent = label
    const value = document.createElement("span")
    value.className = "nk-bg-value"
    const track = document.createElement("div")
    track.className = "nk-bg-track"
    const input = document.createElement("input")
    input.type = "range"
    input.min = "0"
    input.max = String(max)
    input.value = String(draft[name])
    const show = () => {
      value.textContent = `${input.value}${unit}`
      track.style.setProperty("--nk-fill", `${(input.value / max) * 100}%`)
    }
    input.addEventListener("input", () => {
      draft[name] = Number(input.value)
      show()
      applyBackground()
    })
    show()
    track.append(input)
    row.append(text, value, track)
    return row
  }

  // How the picture is laid out, as the desktop wallpaper of Windows
  function fitChoice() {
    const names = {
      fill: ownText("Fill"),
      fit: ownText("Fit"),
      stretch: ownText("Stretch"),
      tile: ownText("Tile"),
      center: ownText("Center"),
    }
    const row = document.createElement("div")
    row.className = "nk-bg-fits"
    for (const fit of BG_FITS) {
      const chip = document.createElement("div")
      chip.className = "nk-bg-fit"
      chip.textContent = names[fit]
      chip.classList.toggle("nk-picked", draft.fit === fit)
      chip.addEventListener("click", () => {
        draft.fit = fit
        for (const other of row.children) other.classList.toggle("nk-picked", other === chip)
        applyBackground()
      })
      row.append(chip)
    }
    const label = document.createElement("span")
    label.textContent = ownText("Position")
    return [label, row]
  }

  function group(...children) {
    const el = document.createElement("div")
    el.className = "nk-bg-group"
    el.append(...children)
    return el
  }

  // Under the "more" button, as its menu; kept inside the chat. The global one: under the plate with the nickname
  function placeBackgroundDialog(box) {
    if (draft?.key === BG_GLOBAL) {
      const plate = document.querySelector(".currentUserContainer .AvatarAndUser")?.getBoundingClientRect()
      if (!plate) return
      box.style.left = `${Math.max(MENU_EDGE, Math.min(plate.left, innerWidth - MENU_EDGE - box.offsetWidth))}px`
      box.style.top = `${Math.max(MENU_EDGE, Math.min(plate.bottom + MENU_GAP, innerHeight - MENU_EDGE - box.offsetHeight))}px`
      return
    }
    const chat = document.querySelector(".multiChatDialog .chatDialogs")?.getBoundingClientRect()
    const at = document.getElementById(MORE_ID)?.getBoundingClientRect()
    if (!chat || !at) return
    const minLeft = chat.left + MENU_EDGE
    const maxLeft = Math.max(minLeft, chat.right - MENU_EDGE - box.offsetWidth)
    box.style.left = `${Math.max(minLeft, Math.min(at.right - box.offsetWidth, maxLeft))}px`
    box.style.top = `${Math.max(MENU_EDGE, Math.min(at.bottom + MENU_GAP, innerHeight - MENU_EDGE - box.offsetHeight))}px`
  }

  function openBackgroundDialog(key) {
    closeBackgroundDialog(false)
    draft = { ...BG_DEFAULTS, ...chatBackgrounds.get(key), key }

    const dialog = document.createElement("div")
    dialog.id = BG_DIALOG_ID
    dialog.addEventListener("mousedown", event => {
      if (event.target === dialog) closeBackgroundDialog(false) // a click past the window
    })
    const box = document.createElement("div")
    box.className = "nk-bg-window"
    const title = document.createElement("div")
    title.className = "nk-bg-title"
    title.textContent = ownText(key === BG_GLOBAL ? "Global Custom Chat Background" : "Chat Background")
    const tiles = document.createElement("div")
    tiles.className = "nk-bg-tiles"
    drawTiles(tiles)
    const buttons = document.createElement("div")
    buttons.className = "nk-bg-buttons"
    const cancel = document.createElement("div")
    cancel.className = "nk-bg-button"
    cancel.textContent = ownText("Cancel")
    cancel.addEventListener("click", () => closeBackgroundDialog(false))
    const save = document.createElement("div")
    save.className = "nk-bg-button nk-bg-save"
    save.textContent = ownText("Save")
    save.addEventListener("click", () => closeBackgroundDialog(true))
    buttons.append(cancel, save)
    box.append(
      group(title, tiles),
      group(...fitChoice()),
      group(
        slider(ownText("Blur"), "blur", BG_BLUR_MAX, "px"),
        slider(ownText("Dimming"), "dim", BG_DIM_MAX, "%"),
      ),
      buttons,
    )
    dialog.append(box)
    document.body.append(dialog)
    placeBackgroundDialog(box)
  }

  function watchBackgroundDialog() {
    addEventListener("keydown", event => {
      if (event.key === "Escape") closeBackgroundDialog(false)
    }, true)
    addEventListener("resize", () => {
      const box = document.querySelector(`#${BG_DIALOG_ID} .nk-bg-window`)
      if (box) placeBackgroundDialog(box)
    })
  }


  // Reply to a Message

  // Steam's chat has no replies, but it has a quote block. A reply is a quote (the author's name on its first line,
  // the text after it) and the answer right after it. Everybody sees Steam's quote; here it is drawn as the reply
  // card of a messenger (Chat.css), and a click on it shows the message it answers.
  // Started by the button beside a message or by a double click on it; the bar above the field shows what is answered
  const REPLY_BAR_ID = "nk-reply-bar"
  const REPLY_BUTTON = "nk-reply-button"
  const REPLY_MAX = 140 // characters of the answered message kept in the quote
  const replies = new Map() // chat view -> { name, text }: what the next message of that chat answers

  // Message component above the element keeps the message and the view of its chat
  function messageOf(el) {
    const key = Object.keys(el).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && el[key], depth = 0; fiber && depth < 8; fiber = fiber.return, depth++) {
      const props = fiber.memoizedProps
      if (props?.msg && props.chatView) return props
    }
    return null
  }

  // Text of a message as one plain line: Steam keeps it with tags
  function plainText(message) {
    return String(message || "")
      .replace(/\[quote(=[^\]]*)?\][\s\S]*?\[\/quote\]/g, "") // an answer is quoted without what it answered itself
      .replace(/\[emoticon\]([^[]*)\[\/emoticon\]/g, ":$1:")
      .replace(/\[sticker[^\]]*\][\s\S]*?\[\/sticker\]|\[sticker[^\]]*\]/g, ownText("Sticker"))
      .replace(/\[img[^\]]*\][\s\S]*?\[\/img\]|\[img[^\]]*\]/g, ownText("Photo"))
      .replace(/\[video[^\]]*\][\s\S]*?\[\/video\]|\[video[^\]]*\]/g, ownText("Video"))
      .replace(/\[\/?[a-z]+[^\]]*\]/g, "")
      .replace(/\\\[/g, "[")
      .replace(/\s+/g, " ")
      .trim()
  }

  function authorName(accountId) {
    for (const win of [window, window.opener]) {
      try {
        const name = win?.g_FriendsUIApp?.FriendStore?.GetPlayer(accountId)?.display_name
        if (name) return String(name)
      } catch { /* no store in that window */ }
    }
    return ""
  }

  const shownView = () => {
    const chat = [...document.querySelectorAll(".chatWindow")].find(el => el.offsetParent)
    return chat ? fiberProps(chat, 14, props => props.chatView) : null
  }

  function startReply(el) {
    const found = messageOf(el)
    if (!found) return
    const { msg, chatView: view } = found
    let text = plainText(msg.strMessage)
    if (text.length > REPLY_MAX) text = `${text.slice(0, REPLY_MAX - 1).trimEnd()}…`
    const name = authorName(msg.unAccountID)
    if (!text || !name) return
    replies.set(view, { name, text })
    hookSend(view)
    updateReplyBar()
    try { view.FocusTextInput?.() } catch { /* the field is focused by a click then */ }
  }

  function cancelReply(view) {
    replies.delete(view)
    updateReplyBar()
  }

  // Steam's server makes a quote block only of a whole message (the "/quote" command) and throws quote tags out of
  // any other text. So a reply is two messages sent one right after the other through Steam's own sending:
  // the quote, then the answer. Chat.css draws the quote as a card that stands on the answer
  function hookSend(view) {
    if (Object.hasOwn(view, "SendChatMessage")) return
    const send = view.SendChatMessage
    view.SendChatMessage = async function (text) {
      const reply = replies.get(this)
      replies.delete(this)
      delete this.SendChatMessage
      updateReplyBar()
      if (!reply || !String(text).trim() || String(text).startsWith("/")) return send.call(this, text)
      await send.call(this, `/quote ${reply.name}\n${reply.text}`)
      return send.call(this, text)
    }
  }

  // The quote and the answer are two messages. As in a messenger they are shown as one bubble: a copy of the quote
  // card is put at the top of the answer's bubble and the quote message itself is hidden (Chat.css).
  // A quote with no message after it (the answer is on its way) stays as it is
  const QUOTE_ONLY = ":scope > .msgText > .QuoteMessage:only-child"
  const REPLY_PART_ATTR = "data-nk-reply-part"

  // Checked on every pass: Steam draws a sent message twice (at once, and again when the server confirms it),
  // and the second drawing has no copy of ours
  function mergeReplies() {
    for (const quote of document.querySelectorAll(".chatWindow .ChatMessageBlock > .msg")) {
      const card = quote.querySelector(QUOTE_ONLY)
      if (!card) continue
      const answer = quote.nextElementSibling
      const body = answer?.matches(".msg") && !answer.querySelector(QUOTE_ONLY) && answer.querySelector(":scope > .msgText")
      if (!body) { // no answer after it (yet), or a quote after a quote
        if (quote.hasAttribute(REPLY_PART_ATTR)) quote.removeAttribute(REPLY_PART_ATTR)
        continue
      }
      if (!body.querySelector(":scope > .nk-reply-card")) {
        const copy = card.cloneNode(true)
        copy.classList.add("nk-reply-card")
        body.prepend(copy)
      }
      if (!quote.hasAttribute(REPLY_PART_ATTR)) quote.setAttribute(REPLY_PART_ATTR, "")
    }
  }

  function updateReplyBar() {
    const view = shownView()
    const reply = view && replies.get(view)
    const entry = [...document.querySelectorAll(".chatWindow .chatEntry")].find(el => el.offsetParent)
    let bar = document.getElementById(REPLY_BAR_ID)
    if (!reply || !entry) return bar?.remove()
    if (bar?.nextElementSibling !== entry) {
      bar?.remove()
      bar = document.createElement("div")
      bar.id = REPLY_BAR_ID
      bar.innerHTML = '<div class="nk-reply-icon"></div><div class="nk-reply-text"><div class="nk-reply-name"></div><div class="nk-reply-line"></div></div><div class="nk-reply-cancel"></div>'
      bar.lastElementChild.addEventListener("click", () => cancelReply(shownView()))
      entry.before(bar)
    }
    const [nameBox, lineBox] = bar.children[1].children
    const title = ownText("Reply to %s").replace("%s", reply.name)
    if (nameBox.textContent !== title) nameBox.textContent = title
    if (lineBox.textContent !== reply.text) lineBox.textContent = reply.text
  }

  // "Reply" among the buttons of a message (they are shown by Steam on hover)
  function addReplyButtons() {
    for (const addons of document.querySelectorAll(`.chatWindow .ChatMessageBlock > .msg > .Addons:not(:has(> .${REPLY_BUTTON}))`)) {
      const button = document.createElement("div")
      button.className = REPLY_BUTTON
      button.title = ownText("Reply")
      addons.prepend(button)
    }
  }

  // The message a reply card stands for: the last one before it with that text from that author
  // The line of a message lights up with the accent color from edge to edge of the chat and fades away (as in
  // Telegram). It is drawn as the background of the scrolling list of messages: under the bubbles, and also under
  // the strip of the scrollbar, where nothing of the list itself can be drawn. That background does not move with
  // the messages, so the place of the line is given to it again on every frame while it is lit (Chat.css)
  const LINE_ATTR = "data-nk-reply-line"
  const LINE_MS = 1600
  const LINE_HOLD = 0.4   // of that time at full strength, then it fades
  const LINE_ALPHA = 30   // percent of the accent color
  const LINE_PAD = 4      // px above and under the bubble
  let lineFrame = null

  function clearLine(scroller) {
    cancelAnimationFrame(lineFrame)
    lineFrame = null
    scroller.removeAttribute(LINE_ATTR)
    for (const name of ["--nk-reply-top", "--nk-reply-bottom", "--nk-reply-color"]) scroller.style.removeProperty(name)
  }

  function highlightLine(message) {
    const scroller = message.closest(".chatHistoryScroll")
    if (!scroller) return
    for (const lit of document.querySelectorAll(`[${LINE_ATTR}]`)) clearLine(lit)
    const started = performance.now()
    const step = () => {
      const passed = (performance.now() - started) / LINE_MS
      if (passed >= 1 || !message.isConnected) return clearLine(scroller)
      const fade = passed <= LINE_HOLD ? 0 : (passed - LINE_HOLD) / (1 - LINE_HOLD)
      const alpha = LINE_ALPHA * (1 - fade) ** 2 // quick at first, slow at the end
      const list = scroller.getBoundingClientRect()
      const at = message.getBoundingClientRect()
      scroller.style.setProperty("--nk-reply-top", `${Math.round(at.top - list.top - LINE_PAD)}px`)
      scroller.style.setProperty("--nk-reply-bottom", `${Math.round(at.bottom - list.top + LINE_PAD)}px`)
      scroller.style.setProperty("--nk-reply-color", `color-mix(in srgb, var(--SystemAccentColor) ${alpha.toFixed(1)}%, transparent)`)
      if (!scroller.hasAttribute(LINE_ATTR)) scroller.setAttribute(LINE_ATTR, "")
      lineFrame = requestAnimationFrame(step)
    }
    step()
  }

  function showAnswered(card) {
    const [name, ...rest] = card.textContent.split("\n")
    const text = rest.join(" ").replace(/…$/, "").trim()
    const from = card.closest(".msg")
    const before = [...document.querySelectorAll(".chatWindow .ChatMessageBlock > .msg")].filter(el => el.offsetParent)
    const target = before.slice(0, before.indexOf(from)).reverse().find(el => {
      const found = messageOf(el)
      return found && authorName(found.msg.unAccountID) === name && plainText(found.msg.strMessage).startsWith(text)
    })
    if (!target) return
    target.scrollIntoView({ block: "center", behavior: "smooth" })
    highlightLine(target)
  }

  function watchReplies() {
    document.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return
      const button = event.target.closest(`.${REPLY_BUTTON}`)
      const card = event.target.closest(".chatWindow .msgText > .QuoteMessage")
      if (button) {
        event.stopPropagation()
        startReply(button.closest(".msg"))
      } else if (card) showAnswered(card)
    }, true)
    document.addEventListener("dblclick", event => {
      const message = event.target instanceof Element && event.target.closest(".chatWindow .ChatMessageBlock > .msg")
      // Not on the text itself: a double click there selects a word, as everywhere
      if (message && !event.target.closest("a, img, video, .Addons, .MessageReactions, .msgText")) startReply(message)
    })
    addEventListener("keydown", event => {
      if (event.key === "Escape" && document.getElementById(REPLY_BAR_ID)) cancelReply(shownView())
    }, true)
  }


  // Start

  let frame = null
  function schedule() {
    frame ??= requestAnimationFrame(() => {
      frame = null
      markInvites()
      markEffects()
      markEntryHeight()
      markWindowButtons()
      markTimes()
      markDates()
      markChatKinds()
      markScrollButtons()
      addReplyButtons()
      mergeReplies()
      updateReplyBar()
      updateHeader()
      markOpenChat()
      patchListWidth()
      fitMenus()
      ensureMoreButton()
      addGlobalItem()
      ensureCallButton()
      applyBackground()
    })
  }

  function init() {
    markInvites()
    markEffects()
    markEntryHeight()
    markWindowButtons()
    markTimes()
    markDates()
    markChatKinds()
    markScrollButtons()
    addReplyButtons()
    mergeReplies()
    updateReplyBar()
    updateHeader()
    markOpenChat()
    patchListWidth()
    watchProfileHover()
    keepWindowUnscrolled()
    ensureMoreButton()
    addGlobalItem()
    ensureCallButton()
    watchSpoilers()
    watchReplies()
    watchMenu()
    watchBackgroundDialog()
    loadBackgrounds()
    // attributes: the active tab changes by a class only
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] })
    setInterval(updateHeader, HEADER_REFRESH)
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
