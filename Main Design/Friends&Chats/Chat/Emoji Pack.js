// Emoticon menu of the chat: ordinary (Unicode) emoji as a second pack of the emoticons tab (styles: Emoticon Picker.css)
// A switch under the list picks the pack: Steam emoticons or emoji. A click on an emoji puts it into the message field
// Look of the emoji: option "Emoji Style" (--nk-emoji-set from Options/Emoji *.css) - system font or pictures of a set;
// with a set chosen, emoji inside the messages are drawn with its pictures too
// Messages of emoji only: no bubble, bigger emoji (as in Telegram)
// Message field: emoji are covered by pictures of the chosen set; Steam emoticon codes (:name:) are kept as one
// character while typing and shown as the emoticon picture

;(() => {
  "use strict"

  const PICKER = ".contextMenu:not([data-nk-ghost]) .Picker" // not the still copy of Emoticon Panel.js
  const PANE_ID = "nk-emoji-pane"
  const PACKS_ID = "nk-emoji-packs"
  const EMOTICONS_TAB = 1 // Steam's tabs: recent, emoticons, stickers, effects
  const PACK_KEY = "nevko-emoji-pack"
  const RECENT_KEY = "nevko-recent-emoji"
  const RECENT_MAX = 27
  // Pictures of a set: one file per emoji, named by its code points
  const SET_URL = set => `https://cdn.jsdelivr.net/npm/emoji-datasource-${set}@15.1.2/img/${set}/64/`
  const SETS = ["apple", "google", "twitter", "facebook"]

  // Single code points only (no joined sequences): every one is a separate cell
  const GROUPS = [
    "😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳😎🤓🧐😕😟🙁😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀💩🤡👹👺👻👽👾🤖",
    "👋🤚🖐✋🖖👌🤏🤞🤟🤘🤙👈👉👆🖕👇👍👎✊👊🤛🤜👏🙌👐🤲🤝🙏💪🦾👀👁👅👄💋🧠👶🧒👦👧🧑👱👨👩🧓👴👵🙍🙎🙅🙆💁🙋🧏🙇🤦🤷💃🕺🚶🏃",
    "❤🧡💛💚💙💜🖤🤍🤎💔💕💞💓💗💖💘💝💟💯💢💥💫💦💨🕳💣💬💭💤🔥✨⭐🌟⚡🎉🎊🎈🎁🏆🥇🥈🥉🎮🕹🎲🎯🎵🎶🎧🎤🎬🎨",
    "🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🕷🐢🐍🦎🐙🦑🦀🐡🐠🐟🐬🐳🦈🐊🐅🐆🦓🐘🦏🐪🦒🐃🐄🐎🐖🐑🐐🦌🐕🐈🐓🦃🐇🐁🐀🐿🦔🐉🌵🌲🌳🌴🌱🌿🍀🍁🍂🍃🌷🌹🌺🌸🌼🌻",
    "🍏🍎🍐🍊🍋🍌🍉🍇🍓🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥒🌶🌽🥕🥔🍞🥐🥖🧀🥚🍳🥓🥩🍗🍖🌭🍔🍟🍕🥪🌮🌯🍝🍜🍲🍛🍣🍱🍤🍙🍚🍘🍥🍦🍧🍨🍩🍪🎂🍰🧁🍫🍬🍭🍮🍯🥛☕🍵🥤🍶🍺🍻🥂🍷🥃🍸🍹",
    "⚽🏀🏈⚾🎾🏐🏉🎱🏓🏸🥊🥋⛳🎣🎿⛷🏂🏋🚴🏊🚗🚕🚙🚌🏎🚓🚑🚒🚚🚜🏍🚲✈🚀🛸🚁⛵🚢⚓🏠🏡🏢🏰🗼🗽⛰🏔🌋🏝🌅🌄🌃🌉🌌🌍🌎🌏🌙☀⛅☁🌧⛈🌩❄☃⛄🌈☔🌊",
    "⌚📱💻⌨🖥🖨🖱💾💿📷📹🎥📞☎📺📻⏰⏳💡🔦🔋🔌💸💵💰💳💎🔧🔨⚙🔫🧨🔪🗡⚔🛡🚬⚰🔮💊💉🧬🔬🔭🧹🚽🚿🛁🔑🚪🛏🧸🎀📦📫📝📁📅📌📎✂🔒🔓🔍📚📖🔖✏🖊",
    "✅❌❓❗‼⁉⚠🚫⛔🔞♻✔➕➖➗✖💲🔴🟠🟡🟢🔵🟣⚫⚪🟥🟧🟨🟩🟦🟪⬛⬜🔶🔷🔺🔻⬆⬇⬅➡↗↘↙↖↩↪🔄🔁🆗🆕🆒🆓🔝🔚🏁🚩🏴🏳",
  ].map(group => Array.from(group))


  // Message Field

  const field = () => [...document.querySelectorAll(".chatEntry .chatTextarea")].find(el => el.offsetParent)

  // React keeps its own copy of the value: the change is made in the element, the "input" event makes React read it
  function insert(emoji) {
    const input = field()
    if (!input) return
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? start
    input.setRangeText(emoji, start, end, "end")
    input.dispatchEvent(new Event("input", { bubbles: true }))
  }


  // Recent

  function readRecent() {
    try {
      const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")
      return Array.isArray(list) ? list.filter(item => typeof item === "string").slice(0, RECENT_MAX) : []
    } catch {
      return []
    }
  }

  function remember(emoji) {
    const list = [emoji, ...readRecent().filter(item => item !== emoji)].slice(0, RECENT_MAX)
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  }


  // Emoji Look

  // "apple", "google", ... from the option, "" = the system font
  function emojiSet() {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--nk-emoji-set").trim().replace(/["']/g, "")
    return SETS.includes(value) ? value : ""
  }

  const fileName = emoji => Array.from(emoji).map(char => char.codePointAt(0).toString(16)).join("-")

  // Picture of the emoji; some files carry the "emoji look" mark (fe0f) in the name; no file at all -> the character itself
  function picture(emoji, set) {
    const img = document.createElement("img")
    img.alt = emoji
    img.draggable = false
    img.loading = "lazy"
    const base = SET_URL(set) + fileName(emoji)
    img.addEventListener("error", () => {
      if (!img.dataset.nkRetry) {
        img.dataset.nkRetry = "1"
        img.src = `${base}-fe0f.png`
      } else {
        img.replaceWith(emoji)
      }
    })
    img.src = `${base}.png`
    return img
  }


  // Pane

  function group(list, set, className) {
    const box = document.createElement("div")
    box.className = `nk-emoji-group ${className || ""}`.trim()
    for (const emoji of list) {
      const cell = document.createElement("button")
      cell.type = "button"
      cell.className = "nk-emoji"
      cell.dataset.nkEmoji = emoji
      cell.append(set ? picture(emoji, set) : emoji)
      box.append(cell)
    }
    return box
  }

  function fillRecent(pane) {
    const recent = readRecent()
    const old = pane.querySelector(".nk-emoji-recent")
    const fresh = recent.length ? group(recent, pane.dataset.nkSet, "nk-emoji-recent") : null
    if (old && fresh) old.replaceWith(fresh)
    else if (old) old.remove()
    else if (fresh) pane.prepend(fresh)
  }

  function createPane() {
    const pane = document.createElement("div")
    pane.id = PANE_ID
    pane.dataset.nkSet = emojiSet()
    for (const list of GROUPS) pane.append(group(list, pane.dataset.nkSet))
    // The message field keeps the cursor
    pane.addEventListener("mousedown", event => event.preventDefault())
    pane.addEventListener("click", event => {
      const cell = event.target instanceof Element && event.target.closest(".nk-emoji")
      if (!cell) return
      insert(cell.dataset.nkEmoji)
      remember(cell.dataset.nkEmoji)
    })
    return pane
  }


  // Pack Switch

  let pack = localStorage.getItem(PACK_KEY) === "emoji" ? "emoji" : "steam"

  function createSwitch(picker) {
    const bar = document.createElement("div")
    bar.id = PACKS_ID
    for (const [id, label] of [["steam", "Steam"], ["emoji", "Emoji"]]) {
      const button = document.createElement("button")
      button.type = "button"
      button.dataset.nkPack = id
      button.textContent = label
      bar.append(button)
    }
    bar.addEventListener("mousedown", event => event.preventDefault())
    bar.addEventListener("click", event => {
      const button = event.target instanceof Element && event.target.closest("[data-nk-pack]")
      if (!button) return
      pack = button.dataset.nkPack
      localStorage.setItem(PACK_KEY, pack)
      update(picker)
    })
    return bar
  }

  const onEmoticonsTab = picker => {
    const tabs = [...picker.querySelectorAll(":scope > .Tabs > .Tab")]
    return tabs.findIndex(tab => tab.classList.contains("Active")) === EMOTICONS_TAB
  }

  // The same picker is opened by Steam to choose a reaction: nothing is added there (an emoji would go into
  // the message field). A picker is "of the message field" when it appears right after a click on the emoticon button
  let entryClickAt = 0
  document.addEventListener("click", event => {
    if (event.target instanceof Element && event.target.closest(".chatEntry .EmoticonPickerButton")) entryClickAt = Date.now()
  }, true)

  // Steam's menu object knows the element the menu hangs on: the emoticon button, or a message
  function anchorOf(picker) {
    const el = picker.closest(".contextMenu")
    const key = el && Object.keys(el).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && el[key], depth = 0; fiber && depth < 5; fiber = fiber.return, depth++) {
      const anchor = fiber.memoizedProps?.instance?.m_position?.element
      if (anchor instanceof Element) return anchor
    }
    return null
  }

  function ofMessageField(picker) {
    if (picker.dataset.nkEntry === undefined) {
      const anchor = anchorOf(picker)
      const entry = anchor ? !!anchor.closest(".chatEntry") : Date.now() - entryClickAt < 1000
      picker.dataset.nkEntry = entry ? "1" : "0"
    }
    return picker.dataset.nkEntry === "1"
  }

  // Last Tab

  // Steam opens the menu on its first tab every time: the tab chosen last (recent, emoticons, stickers, effects)
  // is remembered and opened again
  const TAB_KEY = "nevko-picker-tab"
  const tabsOf = picker => [...picker.querySelectorAll(":scope > .Tabs > .Tab:not(.nk-gif-tab)")] // Steam's own: the GIF tab is Gif Picker.js's

  // The recent tab is hidden (its emoticons are at the top of the emoticons tab): never opened on it
  function restoreTab(picker) {
    if (picker.dataset.nkTabRestored) return // once for a menu: later the tabs are the user's
    const tabs = tabsOf(picker)
    if (!tabs.length) return
    picker.dataset.nkTabRestored = "1"
    const saved = Number(localStorage.getItem(TAB_KEY))
    const tab = tabs[saved > 0 ? saved : EMOTICONS_TAB]
    if (tab && !tab.classList.contains("Active")) tab.click()
  }


  // Recent Steam Emoticons

  // At the top of the emoticons tab, a line under them (as the groups of the emoji pack). A cell is a copy of
  // Steam's own cell of the list below, and a click on it presses that one: Steam puts the emoticon into the field
  // and counts its use (when the message is sent). Built anew when that order changes, but not while the cursor
  // is on them: they do not jump under it
  const STEAM_RECENT_ID = "nk-steam-recent"

  // Newest first: Steam only changes the time of use in its list
  function steamRecentNames() {
    try {
      const store = emoticonStore()
      const list = [...(store?.m_rgRecentEmoticons || store?.recent_emoticons || [])]
      return list.sort((a, b) => (b.last_used || 0) - (a.last_used || 0)).map(item => item.name).slice(0, RECENT_MAX)
    } catch {
      return [] // Steam changed it
    }
  }

  function fillSteamRecent(picker, names) {
    const content = picker.querySelector(":scope > .Content")
    content?.querySelector(`:scope > #${STEAM_RECENT_ID}`)?.remove() // its row is an .ItemList too
    const list = content?.querySelector(".ItemList")
    if (!list) return null // not drawn yet
    const cellOf = name => list.querySelector(`img.emoticon[data-emoticon="${CSS.escape(name)}"]`)?.closest(".Item")
    const cells = names.map(cellOf).filter(Boolean)
    if (!cells.length) return false
    const box = document.createElement("div")
    box.id = STEAM_RECENT_ID
    const row = document.createElement("div")
    row.className = list.className
    for (const cell of cells) row.append(cell.cloneNode(true))
    box.append(row)
    box.addEventListener("mousedown", event => event.preventDefault()) // the message field keeps the cursor
    box.addEventListener("click", event => {
      const name = event.target instanceof Element && event.target.closest(".Item")?.querySelector("img.emoticon")?.dataset.emoticon
      if (name) cellOf(name)?.click()
    })
    content.prepend(box)
    return true
  }

  function watchTabs() {
    document.addEventListener("click", event => {
      const tab = event.target instanceof Element && event.target.closest(".Picker > .Tabs > .Tab:not(.nk-gif-tab)")
      const picker = tab && tab.closest(PICKER)
      if (!picker || !ofMessageField(picker)) return
      localStorage.setItem(TAB_KEY, String(tabsOf(picker).indexOf(tab)))
    }, true)
  }


  // The switch is shown on the emoticons tab only; the emoji list replaces Steam's list while its pack is chosen
  function update(picker) {
    if (!ofMessageField(picker)) return
    restoreTab(picker)
    let pane = picker.querySelector(`:scope > #${PANE_ID}`)
    let bar = picker.querySelector(`:scope > #${PACKS_ID}`)
    if (!pane) picker.append(pane = createPane())
    if (!bar) picker.append(bar = createSwitch(picker))

    const here = onEmoticonsTab(picker)
    const open = here && pack === "emoji"
    if (bar.hasAttribute("data-shown") !== here) bar.toggleAttribute("data-shown", here)
    for (const button of bar.children) {
      const active = button.dataset.nkPack === pack
      if (button.classList.contains("nk-active") !== active) button.classList.toggle("nk-active", active)
    }
    if (pane.hasAttribute("data-open") !== open) {
      if (open) fillRecent(pane) // the order changes only when the list is opened: cells do not jump under the cursor
      pane.toggleAttribute("data-open", open)
    }

    // Steam's list: its recent emoticons, again when their order has changed or Steam has drawn the list anew
    if (here && pack === "steam") {
      const names = steamRecentNames()
      const key = names.join(" ")
      const box = picker.querySelector(`:scope > .Content > #${STEAM_RECENT_ID}`)
      const stale = picker.dataset.nkRecent !== key || (picker.dataset.nkRecentBox === "1" && !box)
      if (stale && !box?.matches(":hover")) {
        const made = fillSteamRecent(picker, names)
        if (made !== null) {
          picker.dataset.nkRecent = key
          picker.dataset.nkRecentBox = made ? "1" : ""
        }
      }
    }
  }


  // Emoji in Messages

  // With a picture set chosen, emoji in the message texts are drawn with it too (only on this side).
  // Steam's own text node stays in place, hidden; a copy with pictures stands right after it
  const EMOJI = /(?:[\u{1F1E6}-\u{1F1FF}]{2}|\p{Extended_Pictographic}(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])?)*)/gu
  // Messages, and the last message under a chat in the Chats tab (Recent Chats plugin; group chats: Chat.js)
  const TEXT = ".chatHistory .msgText span[bbcode-text], .rcp-list .rcp-snippet-text, .FriendsListChatSection .nk-group-last"
  const COPY_CLASS = "nk-emoji-text"

  function withPictures(text, set) {
    const copy = document.createElement("span")
    copy.className = COPY_CLASS
    let last = 0
    for (const match of text.matchAll(EMOJI)) {
      if (match.index > last) copy.append(text.slice(last, match.index))
      copy.append(picture(match[0], set))
      last = match.index + match[0].length
    }
    if (!last) return null // no emoji
    if (last < text.length) copy.append(text.slice(last))
    return copy
  }

  function renderMessages() {
    const set = emojiSet()
    for (const source of document.querySelectorAll(TEXT)) {
      const text = source.textContent
      const copy = source.nextElementSibling?.classList.contains(COPY_CLASS) ? source.nextElementSibling : null
      const done = source.dataset.nkEmojiDone === `${set}:${text}`
      if (done) continue
      copy?.remove()
      delete source.dataset.nkEmojiShown
      source.dataset.nkEmojiDone = `${set}:${text}`
      if (!set) continue
      const fresh = withPictures(text, set)
      if (!fresh) continue
      source.dataset.nkEmojiShown = "1" // CSS hides the original
      source.after(fresh)
    }
  }


  // Emoji-Only Messages

  // As in Telegram: a message of nothing but emoji / Steam emoticons has no bubble, and the fewer there are,
  // the bigger they are drawn (attribute on the bubble, sizes in Emoticon Picker.css)
  const ONLY_ATTR = "data-nk-emoji-only" // "big" (1), "mid" (2-3), "small" (4-8)
  const ONLY_MAX = 8
  const OTHER_CONTENT = "a, video, iframe, .chatImageContainer, .BBCodeImageWrapper, [data-nk-game], [class*='OpenGraph'], [class*='gameInvite']"
  // Steam puts the hover tooltip of an emoticon inside the message: its text and picture are not the message
  const TOOLTIP = ".HoverPositionOuter"
  const emoticonsOf = body => [...body.querySelectorAll("img.emoticon")].filter(img => !img.closest(TOOLTIP))

  function emojiOnlyKind(body) {
    if (body.querySelector(OTHER_CONTENT)) return ""
    const emoticons = emoticonsOf(body)
    // Text as Steam wrote it: our copy with pictures and the pictures' alt texts are not counted
    let text = ""
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.parentElement.closest(`.${COPY_CLASS}, ${TOOLTIP}`) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    })
    for (let node = walker.nextNode(); node; node = walker.nextNode()) text += node.nodeValue
    const emoji = text.match(EMOJI) || []
    if (text.replace(EMOJI, "").trim()) return "" // some words too
    const count = emoji.length + emoticons.length
    if (!count || count > ONLY_MAX) return ""
    return count === 1 ? "big" : count <= 3 ? "mid" : "small"
  }

  function markEmojiOnly() {
    for (const bubble of document.querySelectorAll(".chatHistory .ChatMessageBlock > .msg")) {
      const body = bubble.querySelector(":scope > .msgText")
      if (!body) continue
      if (body.querySelector(TOOLTIP)) continue // nothing of the message changes while its tooltip is shown
      const signature = body.textContent + "|" + emoticonsOf(body).length
      if (bubble.dataset.nkEmojiChecked === signature) continue
      bubble.dataset.nkEmojiChecked = signature

      const kind = emojiOnlyKind(body)
      if ((bubble.getAttribute(ONLY_ATTR) || "") !== kind) {
        if (kind) bubble.setAttribute(ONLY_ATTR, kind)
        else bubble.removeAttribute(ONLY_ATTR)
      }
      // Steam emoticons are 18px pictures: the big variant of the same one is taken for a big size
      if (kind) for (const img of emoticonsOf(body)) {
        const large = img.src.replace(/\/emoticon\//, "/emoticonlarge/")
        if (large !== img.src) img.src = large
      }
    }
  }


  // Steam Emoticons in the Message Field

  // Steam's emoticon is the text ":name:". A text field cannot draw a picture in place of twelve letters, so while
  // the text is being written the code is kept as ONE character: a flag emoji followed by invisible "tag" letters that
  // spell the name (the same way flags of regions are written; the cursor and Backspace treat it as one sign).
  // The layer below covers it with the emoticon's picture. Right before sending, and when copied, it is ":name:" again
  const TOKEN = /\u{1F3F4}([\u{E0020}-\u{E007E}]+)\u{E007F}/gu
  // For checks: a search with "g" remembers where it stopped, and the next search would start from there
  const HAS_TOKEN = /\u{1F3F4}[\u{E0020}-\u{E007E}]+\u{E007F}/u
  const TOKEN_PIECES = /\u{1F3F4}[\u{E0020}-\u{E007E}]*\u{E007F}?|[\u{E0020}-\u{E007F}]+/gu
  const CODE = /:([A-Za-z0-9_]+):/g
  const TAG_BASE = 0xE0000

  // Option "Emoticons in Message Field" (off: Options/No Field Emoticons.css)
  const fieldEmoticonsOn = () => getComputedStyle(document.documentElement).getPropertyValue("--nk-field-emoticons").trim() !== "off"

  function emoticonStore() {
    for (const win of [window, window.opener]) {
      try {
        const store = win?.g_FriendsUIApp?.ChatStore?.m_EmoticonStore
        if (store) return store
      } catch { /* no store in this window */ }
    }
    return null
  }

  // Only emoticons the account has: "10:30:15" or ":D:" stay text (Steam keeps the names in lower case)
  function ownedEmoticons() {
    for (const win of [window, window.opener]) {
      try {
        const store = win?.g_FriendsUIApp?.ChatStore?.m_EmoticonStore
        if (store?.m_setEmoticonOwned?.size) return store.m_setEmoticonOwned
        if (store?.m_rgEmoticons?.length) return new Set(store.m_rgEmoticons.map(item => item.name.toLowerCase()))
      } catch { /* no store in this window */ }
    }
    return new Set()
  }

  const toToken = name => "\u{1F3F4}" + Array.from(name, char => String.fromCodePoint(TAG_BASE + char.charCodeAt(0))).join("") + "\u{E007F}"
  const nameOf = tags => Array.from(tags, char => String.fromCodePoint(char.codePointAt(0) - TAG_BASE)).join("")

  function codesToTokens(text) {
    if (!text.includes(":")) return text
    const owned = ownedEmoticons()
    return text.replace(CODE, (code, name) => (owned.has(name.toLowerCase()) ? toToken(name) : code))
  }

  const tokensToCodes = text => text.replace(TOKEN, (token, tags) => `:${nameOf(tags)}:`)

  // Half of a token left by an edit: dropped (a flag emoji typed on its own is kept)
  function withoutBrokenTokens(text) {
    return text.replace(TOKEN_PIECES, piece => {
      if (HAS_TOKEN.test(piece) || piece === "\u{1F3F4}") return piece
      return ""
    })
  }

  // The value is set past React's own setter: React then sees a change and takes the new text as typed
  const setNativeValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set

  function rewrite(input, transform) {
    const value = input.value
    const next = transform(value)
    if (next === value) return false
    const caret = transform(value.slice(0, input.selectionStart ?? value.length)).length
    setNativeValue.call(input, next)
    input.setSelectionRange(caret, caret)
    return true
  }

  let sending = false

  // Typed, pasted, or put in by Steam's emoticon menu: codes become tokens (this runs before React reads the field)
  function onFieldInput(input) {
    if (sending) return
    if (fieldEmoticonsOn()) rewrite(input, text => codesToTokens(withoutBrokenTokens(text)))
    else rewrite(input, tokensToCodes) // the option was switched off with a draft in the field
  }

  // Steam must send ":name:". The field is turned back and React is told, then the key / click goes on to Steam
  function beforeSend(input) {
    if (!HAS_TOKEN.test(input.value)) return
    sending = true
    try {
      if (rewrite(input, tokensToCodes)) input.dispatchEvent(new Event("input", { bubbles: true }))
    } finally {
      sending = false
    }
  }

  function watchFieldEmoticons() {
    document.addEventListener("input", event => {
      if (event.target instanceof Element && event.target.matches(FIELD)) onFieldInput(event.target)
    }, true)
    document.addEventListener("keydown", event => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return
      if (event.target instanceof Element && event.target.matches(FIELD)) beforeSend(event.target)
    }, true)
    for (const type of ["mousedown", "click"]) {
      document.addEventListener(type, event => {
        const button = event.target instanceof Element && event.target.closest(".chatEntryControls .chatSubmitButton")
        const input = button && button.closest(".chatEntryControls")?.querySelector(".chatTextarea")
        if (input) beforeSend(input)
      }, true)
    }
    // Steam's emoticon menu puts its code into the field without any "input" event. By the end of the click Steam has
    // already written it: it is turned at once (and before the next frame, should the click not come up to here)
    const afterPick = () => {
      const input = [...document.querySelectorAll(FIELD)].find(el => el.offsetParent)
      if (!input || !fieldEmoticonsOn()) return
      if (rewrite(input, text => codesToTokens(withoutBrokenTokens(text)))) input.dispatchEvent(new Event("input", { bubbles: true }))
      paintField(input)
    }
    const inPicker = event => event.target instanceof Element && event.target.closest(".contextMenu .Picker")
    window.addEventListener("click", event => {
      if (inPicker(event)) afterPick()
    })
    document.addEventListener("click", event => {
      if (!inPicker(event)) return
      requestAnimationFrame(afterPick)
      setTimeout(afterPick, 60)
    }, true)
    // Pictures of the account's emoticons are loaded ahead, on the first click into a field: none is waited for later
    document.addEventListener("focusin", function preload(event) {
      if (!(event.target instanceof Element) || !event.target.matches(FIELD) || !fieldEmoticonsOn()) return
      document.removeEventListener("focusin", preload, true)
      for (const item of emoticonStore()?.m_rgEmoticons || []) new Image().src = emoticonUrl(item.name)
    }, true)
    // Copied text is ":name:", not the flag with invisible letters
    for (const type of ["copy", "cut"]) {
      document.addEventListener(type, event => {
        const input = event.target
        if (!(input instanceof HTMLTextAreaElement) || !input.matches(FIELD)) return
        const picked = input.value.slice(input.selectionStart, input.selectionEnd)
        if (!HAS_TOKEN.test(picked)) return
        event.clipboardData.setData("text/plain", tokensToCodes(picked))
        event.preventDefault()
        if (type === "cut") {
          input.setRangeText("", input.selectionStart, input.selectionEnd, "end")
          input.dispatchEvent(new Event("input", { bubbles: true }))
        }
      }, true)
    }
  }

  // Where Steam serves emoticon pictures from: as an emoticon already on the page does
  function emoticonUrl(name) {
    const sample = document.querySelector("img.emoticon[src*='/emoticon']")?.src
    const base = sample ? sample.replace(/\/emoticon(large)?\/[^/]*$/, "/emoticon/") : "https://community.fastly.steamstatic.com/economy/emoticon/"
    return base + encodeURIComponent(name)
  }


  // Pictures in the Message Field

  // A text field can only draw emoji with the system font, and an emoticon token as a flag. A see-through layer lies
  // over the field with the same text in the same font: its letters are invisible, and every emoji (with a picture
  // set chosen) and every emoticon token is covered by its picture. The character under the picture keeps the width,
  // so nothing shifts
  const LAYER_CLASS = "nk-field-emoji"
  const COPIED = ["font", "lineHeight", "letterSpacing", "padding", "textAlign", "direction", "tabSize"]

  function layerOf(input) {
    const next = input.nextElementSibling
    return next?.classList.contains(LAYER_CLASS) ? next : null
  }

  // [{ start, end, urls }] in the order of the text
  function picturesIn(text, set) {
    const found = []
    for (const match of text.matchAll(TOKEN)) {
      found.push({ start: match.index, end: match.index + match[0].length, urls: [emoticonUrl(nameOf(match[1]))] })
    }
    if (set) {
      for (const match of text.matchAll(EMOJI)) {
        const start = match.index
        if (found.some(item => start >= item.start && start < item.end)) continue // the flag of a token
        const base = SET_URL(set) + fileName(match[0])
        // Some files carry the "emoji look" mark in the name: both are named, the missing one is skipped
        found.push({ start, end: start + match[0].length, urls: [`${base}.png`, `${base}-fe0f.png`] })
      }
    }
    return found.sort((a, b) => a.start - b.start)
  }

  function markSelection(input, layer) {
    const from = input.selectionStart
    const to = input.selectionEnd
    const color = getComputedStyle(input, "::selection").backgroundColor
    if (layer.style.getPropertyValue("--nk-selection") !== color) layer.style.setProperty("--nk-selection", color)
    for (const mark of layer.children) {
      const picked = from !== to && Number(mark.dataset.nkStart) < to && Number(mark.dataset.nkEnd) > from
      if (mark.classList.contains("nk-selected") !== picked) mark.classList.toggle("nk-selected", picked)
    }
  }

  function paintField(input) {
    const set = emojiSet()
    const text = input.value
    const pictures = text ? picturesIn(text, set) : []
    let layer = layerOf(input)
    if (!pictures.length) return layer?.remove()
    if (!layer) {
      layer = document.createElement("div")
      layer.className = LAYER_CLASS
      layer.setAttribute("aria-hidden", "true")
      input.after(layer)
    }

    const style = getComputedStyle(input)
    for (const name of COPIED) layer.style[name] = style[name]
    Object.assign(layer.style, {
      left: `${input.offsetLeft}px`,
      top: `${input.offsetTop}px`,
      width: `${input.offsetWidth}px`,
      height: `${input.offsetHeight}px`,
    })

    const signature = `${set}:${text}`
    if (layer.dataset.nkSource !== signature) {
      layer.dataset.nkSource = signature
      const parts = []
      let last = 0
      for (const { start, end, urls } of pictures) {
        if (start > last) parts.push(text.slice(last, start))
        const mark = document.createElement("span")
        mark.textContent = text.slice(start, end)
        mark.dataset.nkStart = String(start)
        mark.dataset.nkEnd = String(end)
        mark.style.setProperty("--nk-a", `url("${urls[0]}")`)
        mark.style.setProperty("--nk-b", urls[1] ? `url("${urls[1]}")` : "none")
        parts.push(mark)
        last = end
      }
      if (last < text.length) parts.push(text.slice(last))
      parts.push("\u{200B}") // a last empty line has its height, as in the field
      layer.replaceChildren(...parts)
    }
    layer.scrollTop = input.scrollTop
    markSelection(input, layer)
  }

  const FIELD = ".chatEntry .chatTextarea"
  function paintFields() {
    document.querySelectorAll(FIELD).forEach(paintField)
  }

  function watchFields() {
    watchFieldEmoticons() // first: its "input" listener rewrites the text the next one draws
    // Typing, our own inserts, sending (Steam empties the field), scrolling of a long text, moving the selection
    for (const type of ["input", "change", "keyup", "scroll", "select", "mouseup"]) {
      document.addEventListener(type, event => {
        if (event.target instanceof Element && event.target.matches(FIELD)) paintField(event.target)
      }, true)
    }
    document.addEventListener("selectionchange", () => {
      const input = document.activeElement
      const layer = input instanceof Element && input.matches(FIELD) && layerOf(input)
      if (layer) markSelection(input, layer)
    })
    addEventListener("resize", paintFields)
  }


  // Still Stickers

  // Every sticker of the menu is an animated picture, and Steam plays all of them at once: the menu lags.
  // Each one gets a still copy (its frame drawn on a canvas); the animated picture itself is shown, and so played,
  // only under the cursor (Emoticon Picker.css). Option "Stickers in Menu: always animated" switches this off
  const STICKER = ".Picker .StickerButton > img"
  const STILL_CLASS = "nk-sticker-still"
  const STILL_ATTR = "data-nk-still" // on the picture that has its copy
  const stillOn = () => getComputedStyle(document.documentElement).getPropertyValue("--nk-sticker-motion").trim() !== "always"

  function drawStill(img) {
    if (!img.complete || !img.naturalWidth) return // drawn when it loads
    let canvas = img.previousElementSibling
    if (!canvas?.classList.contains(STILL_CLASS)) {
      canvas = document.createElement("canvas")
      canvas.className = STILL_CLASS
      img.before(canvas)
    }
    if (canvas.dataset.nkSource === img.src) return
    canvas.dataset.nkSource = img.src
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext("2d").drawImage(img, 0, 0)
    img.setAttribute(STILL_ATTR, "")
  }

  function stillStickers() {
    const on = stillOn()
    for (const img of document.querySelectorAll(STICKER)) {
      if (on) drawStill(img)
      else if (img.hasAttribute(STILL_ATTR)) {
        img.removeAttribute(STILL_ATTR)
        img.previousElementSibling?.remove()
      }
    }
  }

  function watchStickers() {
    // "load" does not bubble: caught on its way down. Also when Steam gives a cell another sticker
    document.addEventListener("load", event => {
      const img = event.target
      if (img instanceof HTMLImageElement && img.matches(STICKER) && stillOn()) drawStill(img)
    }, true)
  }


  // Start

  let frame = null
  function schedule() {
    frame ??= requestAnimationFrame(() => {
      frame = null
      document.querySelectorAll(PICKER).forEach(update)
      stillStickers()
      renderMessages()
      markEmojiOnly()
      paintFields()
    })
  }

  function init() {
    schedule()
    watchFields()
    watchTabs()
    watchStickers()
    // class: Steam marks its active tab with it
    // characterData: the plugin writes a new last message into the same text node
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class"] })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
