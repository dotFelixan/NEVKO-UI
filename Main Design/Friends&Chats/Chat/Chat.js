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
  const TAB_ATTR = "data-nk-tab" // the tab over an invite's cover (Chat.css)


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

  // Service lines of a group ("... joined the chat"): their kind for the icon of the plaque (Chat.css), from Steam's
  // message: eServerMsgType 2 joined, 3 left, 4 kicked, 5 invited
  const SERVER_KINDS = { 2: "joined", 3: "left", 4: "kicked", 5: "invited" }

  function markServerMessages() {
    for (const el of document.querySelectorAll(".chatWindow .msg.serverMsg:not([data-nk-server])")) {
      const messages = fiberProps(el, 6, props => props.messages)
      const type = Array.isArray(messages) ? messages[0]?.eServerMsgType : undefined
      el.setAttribute("data-nk-server", SERVER_KINDS[type] || "other")
    }
  }

  // Sections of the member list of a group: "Group members (2)" -> the number alone, shown as " · 2" (Chat.css)
  function markMemberGroups() {
    for (const label of document.querySelectorAll(".chatWindow .groupMemberList .groupName .groupNameLabel")) {
      const count = label.parentElement?.querySelector(".groupCount")?.textContent.replace(/\D/g, "") || ""
      if ((label.getAttribute("data-nk-count") || "") === count) continue
      if (count) label.setAttribute("data-nk-count", count)
      else label.removeAttribute("data-nk-count")
    }
  }

  // Member list sections: "In Game", "Online", "Offline" in place of a section per game. Steam builds the sections in
  // GroupMemberStore.GetGroupMemberList (SharedJSContext): its list is taken apart and made again of its own buckets.
  // The party beacon section stays first. Game names are in the rows (Steam hides them only in a section of a game)
  const MEMBER_SECTIONS = [["ingame", -101], ["online", -102], ["offline", -103]]

  function patchMemberSections() {
    const shared = window.opener
    const store = shared?.g_FriendsUIApp?.GroupMemberStore
    if (!store || shared.__nkMemberSections) return
    const proto = Object.getPrototypeOf(store)
    const original = proto.GetGroupMemberList
    if (typeof original !== "function") return
    shared.__nkMemberSections = true

    const names = {
      [-101]: steamText("FriendGroup_InGame", "In Game"),
      [-102]: ownText("Online"),
      [-103]: steamText("FriendGroup_Offline", "Offline"),
    }
    const byName = (a, b) => a.display_name.localeCompare(b.display_name)
    const kindOf = member => member.persona?.is_ingame ? "ingame" : member.persona?.is_online ? "online" : "offline"
    let namesPatched = false

    proto.GetGroupMemberList = function (groupId) {
      const buckets = original.call(this, groupId)
      try {
        if (!buckets.length) return buckets
        const Bucket = buckets[0].constructor
        // Steam's search makes buckets of the same ids anew: they get the names here
        if (!namesPatched) {
          const name = Object.getOwnPropertyDescriptor(Bucket.prototype, "name")?.get
          if (name) Object.defineProperty(Bucket.prototype, "name", { configurable: true, get() { return names[this.m_id] ?? name.call(this) } })
          namesPatched = true
        }
        const kinds = { ingame: [], online: [], offline: [] }
        for (const bucket of buckets) {
          if (bucket.id === -1) continue // party beacon
          for (const member of bucket.member_list) kinds[kindOf(member)].push(member)
        }
        const result = buckets.filter(bucket => bucket.id === -1)
        for (const [kind, id] of MEMBER_SECTIONS) {
          if (!kinds[kind].length) continue
          const bucket = new Bucket(id, byName, () => {})
          bucket.SetMembers(kinds[kind])
          result.push(bucket)
        }
        return result
      } catch {
        return buckets // Steam changed its buckets: its own sections
      }
    }
  }

  // Group chats of the Chats tab: the last message under the name, as the recent chats show it ("Kasha: text").
  // Steam keeps it on each text room of the group (m_strLastMessage, bbcode); the newest of the rooms is taken
  const GROUP_LAST = "nk-group-last"

  function groupOf(item) {
    const key = Object.keys(item).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && item[key], depth = 0; fiber && depth < 6; fiber = fiber.return, depth++) {
      const group = fiber.memoizedProps?.group
      if (group?.GetDefaultChatRoom) return group
    }
    return null
  }

  // bbcode -> words: a sticker / a picture by its own word, other tags dropped
  function plainMessage(text) {
    if (/^\s*\[sticker\b/i.test(text)) return ownText("Sticker")
    if (/^\s*\[(img|dynamiclink|og)\b/i.test(text)) return ownText("Photo")
    return text.replace(/\[\/?[a-z]+[^\]]*\]/gi, "").replace(/\s+/g, " ").trim()
  }

  function lastOfGroup(group) {
    let rooms = []
    try { rooms = [...(group.textRoomList || []), group.GetDefaultChatRoom()].filter(Boolean) } catch {}
    let last = null
    for (const room of rooms) {
      if (room.m_strLastMessage && (!last || room.m_rtLastMessageReceived > last.m_rtLastMessageReceived)) last = room
    }
    if (!last) return ""
    const text = plainMessage(last.m_strLastMessage)
    if (!text) return ""
    let name = ""
    try { name = window.opener?.g_FriendsUIApp?.FriendStore?.GetPlayer(last.m_accountIDLastMessage)?.display_name || "" } catch {}
    return name ? `${name}: ${text}` : text
  }

  function markGroupLastMessages() {
    for (const item of document.querySelectorAll(".FriendsListChatSection .ChatRoomListGroupItem")) {
      const box = item.querySelector(".groupNameStatusContainer")
      const group = box && groupOf(item)
      if (!group) continue
      const text = lastOfGroup(group)
      let line = box.querySelector(`:scope > .${GROUP_LAST}`)
      if (!text) { line?.remove(); continue }
      if (!line) {
        line = document.createElement("div")
        line.className = GROUP_LAST
        box.append(line)
      }
      if (line.textContent !== text) line.textContent = text
    }
  }

  // Tabs that do not fit: arrows at both ends of the row (Chat.css), a press shows the next / previous tab
  const TAB_NAV = "nk-tab-nav"

  function tabNavButton(container, side) {
    let button = container.querySelector(`:scope > .${TAB_NAV}-${side}`)
    if (button) return button
    button = document.createElement("div")
    button.className = `${TAB_NAV} ${TAB_NAV}-${side}`
    button.setAttribute("role", "button")
    button.addEventListener("click", () => {
      const list = container.querySelector(".chatTabList")
      const tab = list?.querySelector(".ChatTab")
      if (list) list.scrollBy({ left: (side === "next" ? 1 : -1) * ((tab?.offsetWidth || 160) + 8), behavior: "smooth" })
    })
    return button
  }

  // The row of tabs ends 8px before the leftmost button of the title bar (which ones there are depends on the chat,
  // the docked emoticon panel moves them): never under them or under the panel
  const TITLE_BUTTONS = "#nk-chat-tabs, #nk-chat-more, #nk-chat-call, .chatWindow .ToggleMemberListView, .chatWindow .inviteAnotherFriendButton"
  function fitTabRow(container) {
    const bar = container.closest(".ChatTabs")
    if (!bar) return
    const lefts = [...document.querySelectorAll(TITLE_BUTTONS)]
      .filter(el => el.offsetParent && (el.id || el.closest(".chatWindow")?.offsetParent))
      .map(el => el.getBoundingClientRect().left)
    if (!lefts.length) return container.style.removeProperty("margin-inline-end")
    const end = bar.getBoundingClientRect().right - parseFloat(getComputedStyle(bar).paddingRight) - (Math.min(...lefts) - 8)
    const value = `${Math.max(0, Math.round(end))}px`
    if (container.style.marginInlineEnd !== value) container.style.marginInlineEnd = value
  }

  function updateTabNav() {
    for (const container of document.querySelectorAll(".multiChatDialog .chatTabSetContainer")) {
      const slider = container.querySelector(":scope > .HorizontalMiniSlider")
      const list = slider?.querySelector(".chatTabList")
      if (!list) continue
      const prev = tabNavButton(container, "prev")
      const next = tabNavButton(container, "next")
      if (prev.nextElementSibling !== slider) slider.before(prev)
      if (next.previousElementSibling !== slider) slider.after(next)
      if (!list.dataset.nkNav) {
        list.dataset.nkNav = "1"
        list.addEventListener("scroll", updateTabNav, { passive: true })
      }
      fitTabRow(container)
      const overflow = list.scrollWidth > list.clientWidth + 1
      if (container.hasAttribute("data-nk-overflow") !== overflow) container.toggleAttribute("data-nk-overflow", overflow)
      const atStart = list.scrollLeft <= 1
      const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1
      if (prev.hasAttribute("data-nk-off") !== atStart) prev.toggleAttribute("data-nk-off", atStart)
      if (next.hasAttribute("data-nk-off") !== atEnd) next.toggleAttribute("data-nk-off", atEnd)
    }
  }

  // Member rows 40px apart (32px plaque + 8px, as in the friends list) instead of Steam's 36px. The rows are placed by
  // Steam's list of buckets from its itemSize (a number in its props): the props of that list are given the new step
  // as React sets them (an accessor on its class, made once for all windows)
  const MEMBER_STEP = 40
  const STEAM_STEP = 36

  function patchMemberStep() {
    const row = document.querySelector(".chatWindow .groupMemberList .friend")
    if (!row) return
    const key = Object.keys(row).find(name => name.startsWith("__reactFiber"))
    let list = null
    for (let fiber = key && row[key], depth = 0; fiber && depth < 20; fiber = fiber.return, depth++) {
      const props = fiber.memoizedProps
      if (props?.buckets && props.bucketHeaderSize !== undefined && fiber.stateNode?.render) { list = fiber.stateNode; break }
    }
    if (!list) return
    const proto = Object.getPrototypeOf(list)
    if (!proto.__nkMemberStep) {
      proto.__nkMemberStep = true
      const step = props => props?.buckets && props.itemSize === STEAM_STEP
        ? { ...props, itemSize: MEMBER_STEP, estimatedItemSize: MEMBER_STEP }
        : props
      Object.defineProperty(proto, "props", {
        configurable: true,
        get() { return this.__nkProps },
        set(value) { this.__nkProps = step(value) },
      })
    }
    // A list made before the patch: its props now, and its cached row places dropped
    if (list.__nkProps === undefined && Object.prototype.hasOwnProperty.call(list, "props")) {
      const props = list.props
      delete list.props
      list.props = props
    }
    if (list.__nkStepApplied) return
    list.__nkStepApplied = true
    try {
      list.forceUpdate()
      // The list inside keeps the places of the rows it has measured (Steam keeps it in m_ref)
      for (const value of Object.values(list)) {
        const inner = value?.current ?? value
        if (typeof inner?.resetAfterIndex === "function") inner.resetAfterIndex(0, true)
      }
    } catch { /* the list redraws with the next change */ }
  }

  // Member rows: the icon of the game before the name (as in the friends list), a Join button when the game can be joined
  const MEMBER_JOIN = "nk-member-join"

  function memberOf(row) {
    const key = Object.keys(row).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && row[key], depth = 0; fiber && depth < 6; fiber = fiber.return, depth++) {
      const friend = fiber.memoizedProps?.friend
      if (friend?.persona) return friend
    }
    return null
  }

  // Same rules as the Join button of the friends list (Friends List.js)
  function joinableGame(friend) {
    const persona = friend.persona
    const lobby = persona.m_game_lobby_id
    return persona.m_unGamePlayedAppID > 0
      && (!!persona.has_joinable_game_flag || (!!lobby && lobby !== "0") || !!persona.has_server_ip)
  }
  function joinUrl(friend) {
    const persona = friend.persona
    const app = persona.m_unGamePlayedAppID
    const lobby = persona.m_game_lobby_id && persona.m_game_lobby_id !== "0" ? persona.m_game_lobby_id : null
    const connect = persona.connect_string
    if (lobby) return `steam://joinlobby/${app}/${lobby}/${friend.steamid64}`
    if (persona.has_joinable_game_flag && !connect?.length) return null
    return `steam://rungame/${app}/${friend.steamid64}` + (connect !== undefined ? "/" + encodeURIComponent(connect) : "")
  }

  // The icon of the game, made once per place: before the name, and in the corner of the avatar for the folded list
  // (it has no name: Steam drops the label there)
  function placeGameIcon(parent, before, className, src) {
    let icon = parent?.querySelector(`:scope > .${className}`)
    if (!src || !parent) return icon?.remove()
    if (!icon) {
      icon = document.createElement("img")
      icon.className = className
      icon.alt = ""
      before ? before.before(icon) : parent.append(icon)
    }
    if (icon.getAttribute("src") !== src) icon.src = src
  }

  function decorateMembers() {
    const apps = window.opener?.g_FriendsUIApp?.AppInfoStore
    for (const row of document.querySelectorAll(".chatWindow .groupMemberList .friend")) {
      const friend = memberOf(row)
      if (!friend) continue
      const app = friend.persona.is_ingame ? friend.persona.m_unGamePlayedAppID : 0
      let src = ""
      try { src = app ? apps?.GetAppInfo(app)?.icon_url || "" : "" } catch {}
      const label = row.querySelector(":scope > .labelHolder")
      placeGameIcon(label ? row : null, label, "nk-member-game", src)
      placeGameIcon(row.querySelector(".avatarHolder"), null, "nk-member-game-corner", src)
      // Folded list: the name as the hint of the avatar
      const folded = !!row.closest(".MemberListViewCompact")
      const name = folded ? friend.display_name || "" : null
      if (name) { if (row.title !== name) row.title = name }
      else if (row.hasAttribute("title")) row.removeAttribute("title")

      let join = row.querySelector(`:scope > .${MEMBER_JOIN}`)
      if (joinableGame(friend)) {
        if (!join) {
          join = document.createElement("div")
          join.className = MEMBER_JOIN
          join.title = steamText("Friend_Menu_JoinFriendGame", "Join Game")
          row.append(join)
        }
      } else join?.remove()
    }
  }

  // Search of the member list: the number found goes to the search box ("Found · 3", Chat.css). Folded list: its
  // search is a button that unfolds the list and puts the cursor in the field
  function markMemberSearch() {
    for (const column of document.querySelectorAll(".chatWindow .MemberListColumn")) {
      const box = column.querySelector(".MemberListOptionsContainer")
      if (!box) continue
      let found = null
      const key = Object.keys(column).find(name => name.startsWith("__reactFiber"))
      for (let fiber = key && column[key], depth = 0; fiber && depth < 6; fiber = fiber.return, depth++) {
        const view = fiber.memoizedProps?.groupView
        if (!view) continue
        // Steam counts the search as active already when the empty field gets the cursor: only with words in it
        try { if (view.IsMemberSearchActive() && view.GetMemberSearch().trim()) found = String(view.search_results.length) } catch {}
        break
      }
      if (found === null) { if (box.hasAttribute("data-nk-found")) box.removeAttribute("data-nk-found") }
      else if (box.getAttribute("data-nk-found") !== found) box.setAttribute("data-nk-found", found)
    }
  }

  function onFoldedSearch(event) {
    const form = event.target instanceof Element && event.target.closest(".MemberListViewCompact .MemberListOptionsContainer .socialInputContainer")
    if (!form) return
    event.preventDefault()
    event.stopPropagation()
    if (event.type !== "click") return
    const column = form.closest(".MemberListColumn")
    column.querySelector(".ToggleMemberListView")?.click()
    requestAnimationFrame(() => column.querySelector("input.friendSearchInput")?.focus())
  }

  // Avatar of a member: the profile (as in the friends list), not the chat that a press on the row opens
  function onMemberAvatar(event) {
    if (event.button > 0) return // the right button: Steam's menu of the member
    const avatar = event.target instanceof Element && event.target.closest(".chatWindow .groupMemberList .friend .avatarHolder")
    if (!avatar) return
    event.stopPropagation()
    event.preventDefault()
    if (event.type !== "click") return
    const friend = memberOf(avatar.closest(".friend"))
    if (friend?.steamid64) location.href = `steam://url/SteamIDPage/${friend.steamid64}`
  }

  // Name above the messages: the profile, as the avatar
  function onSpeakerName(event) {
    if (event.button > 0) return
    const name = event.target instanceof Element && event.target.closest(".chatWindow .ChatMessageBlock .speakerName")
    if (!name || event.target.closest(".nevko-badge, .nevko-badge-mini, .nevko-badge-modern")) return
    event.stopPropagation()
    event.preventDefault()
    if (event.type !== "click") return
    const friend = memberOf(name)
    if (friend?.steamid64) location.href = `steam://url/SteamIDPage/${friend.steamid64}`
  }

  // Badge after the name: its own tooltip, not the mini profile Steam shows while the cursor is on the name.
  // The badge is inside Steam's hover area: on it the profile is hidden (after Steam's handler has run), and back
  // on the name it is shown again - Steam counts the cursor as never gone out of the area
  const SPEAKER_BADGE = ".chatWindow .ChatSpeaker .speakerHoverArea :is(.nevko-badge, .nevko-badge-mini, .nevko-badge-modern)"

  function onSpeakerBadge(event) {
    const target = event.target instanceof Element ? event.target : null
    const area = target?.closest(".chatWindow .ChatSpeaker .speakerHoverArea")
    if (!area) return
    const fake = {
      currentTarget: area, target, clientX: event.clientX, clientY: event.clientY, nativeEvent: event,
      persist() {}, preventDefault() {}, stopPropagation() {},
    }
    if (target.closest(SPEAKER_BADGE)) {
      setTimeout(() => { try { propsOf(area)?.onMouseLeave?.(fake) } catch { /* Steam changed it */ } })
      return
    }
    const from = event.relatedTarget instanceof Element ? event.relatedTarget : null
    if (from?.closest(SPEAKER_BADGE) && area.contains(from)) {
      try { propsOf(area)?.onMouseEnter?.(fake) } catch { /* Steam changed it */ }
    }
  }

  // Before Steam: a press on the button is not a press on the row (that opens the chat with the member)
  function onMemberJoin(event) {
    const join = event.target instanceof Element && event.target.closest(`.${MEMBER_JOIN}`)
    if (!join) return
    event.stopPropagation()
    event.preventDefault()
    if (event.type !== "click") return
    const row = join.closest(".friend")
    const friend = row && memberOf(row)
    const url = friend && joinUrl(friend)
    if (url) location.href = url
    else row?.querySelector(".labelHolder")?.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true, cancelable: true, view: window, clientX: event.clientX, clientY: event.clientY, button: 2,
    })) // Steam's menu of the member has "Join Game" with its own dialog
  }

  // Titles of the channel sections: "Add Text / Voice Channel" -> "Text / Voice channels" (Steam's words in its
  // language), drawn by Chat.css from the attribute; the "+" at their end makes the channel
  const CHANNEL_TITLES = [
    [".chatRoomTextChannelsGroup", "GroupSettings_Channels_TextChannels", "Text Channels"],
    [".chatRoomVoiceChannelsGroup", "GroupSettings_Channels_VoiceChannels", "Voice channels"],
  ]

  function markChannelTitles() {
    for (const [group, token, fallback] of CHANNEL_TITLES) {
      const title = steamText(token, fallback)
      for (const label of document.querySelectorAll(`.chatWindow ${group} .ChannelTypeLabel`)) {
        if (label.getAttribute("data-nk-label") !== title) label.setAttribute("data-nk-label", title)
      }
    }
  }

  // A block of only stickers and big emoji: no name above it (Chat.css), the picture says who it is with the avatar
  const NO_NAME_ATTR = "data-nk-no-name"
  // Steam puts the hover card of the sticker (its name) beside the picture while the cursor is on it: not counted,
  // or the name above the block would come and go with the cursor
  const STICKER_HOVER = ".HoverPositionOuter"
  function isSticker(message) {
    const text = message.querySelector(":scope > .msgText")
    const holder = text?.querySelector(":scope > div:only-child")
    if (!holder) return false
    const parts = [...holder.children].filter(child => !child.matches(STICKER_HOVER))
    if (parts.length !== 1 || parts[0].tagName !== "IMG") return false
    return ![...text.childNodes].some(node => node !== holder && node.textContent.trim())
  }

  function markStickerBlocks() {
    for (const block of document.querySelectorAll(".chatWindow .ChatMessageBlock")) {
      const messages = block.querySelectorAll(":scope > .msg")
      const only = messages.length > 0 && [...messages].every(message => message.hasAttribute("data-nk-emoji-only") || isSticker(message))
      if (block.hasAttribute(NO_NAME_ATTR) !== only) block.toggleAttribute(NO_NAME_ATTR, only)
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

  // Where Steam takes the cover of an active invite from (its STORE_ITEM_BASE_URL)
  const STORE_ITEMS = "https://shared.steamstatic.com/store_item_assets/"

  function ownInviteExpired(invite) {
    if (!invite) return false
    try {
      if (invite.bOld || invite.bDismissed) return true
    } catch { /* no getter: by the time below */ }
    if (Date.now() / 1000 - invite.rtTimestamp > 6 * 60 * 60) return true
    for (const win of [window, window.opener]) {
      try {
        const game = win?.g_FriendsUIApp?.FriendStore?.self?.persona?.m_unGamePlayedAppID
        if (game !== undefined) return game !== invite.appID
      } catch { /* no store in that window */ }
    }
    return false
  }

  function markInvites() {
    for (const el of document.querySelectorAll(INVITE)) {
      const info = describe(el)
      if (!info) continue
      if (el.getAttribute(GAME_ATTR) !== info.game) el.setAttribute(GAME_ATTR, info.game)
      if (el.getAttribute(TEXT_ATTR) !== info.text) el.setAttribute(TEXT_ATTR, info.text)
      // Steam shows an invite this way once it is old, dismissed, or the friend left that game: it cannot be accepted.
      // Own ones look the same in any state: old (Steam: 6 hours) or we left that game
      const expired = !!el.parentElement?.classList.contains("gameInviteDismissed")
        || (!!el.parentElement?.classList.contains("gameInviteSelf") && ownInviteExpired(inviteOf(el)))
      let mark = el.querySelector(":scope > .nk-invite-expired")
      let cover = el.querySelector(":scope > .nk-invite-cover")
      if (!expired) { mark?.remove(); cover?.remove(); continue }
      // Drawn as the card of an active invite (Chat.css): the game's cover with a tab "Expired" on top
      const appID = inviteOf(el)?.appID
      if (!cover && appID) {
        cover = document.createElement("span")
        cover.className = "nk-invite-cover"
        const picture = document.createElement("img")
        picture.src = `${STORE_ITEMS}steam/apps/${appID}/header.jpg`
        picture.draggable = false
        picture.addEventListener("error", () => cover.remove(), { once: true }) // no cover: the icon card stays
        cover.append(picture)
        el.prepend(cover)
      }
      if (cover && cover.getAttribute(TAB_ATTR) !== ownText("Expired")) cover.setAttribute(TAB_ATTR, ownText("Expired"))
      if (!mark) {
        mark = document.createElement("span")
        mark.className = "nk-invite-expired"
        el.append(mark)
      }
      if (mark.textContent !== ownText("Invite expired")) mark.textContent = ownText("Invite expired")
    }
    // Active one: the tab "Invite" over its cover
    for (const box of document.querySelectorAll(".chatWindow .gameInviteMsg .leftInviteContainer")) {
      if (box.getAttribute(TAB_ATTR) !== ownText("Invite")) box.setAttribute(TAB_ATTR, ownText("Invite"))
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

  // View of the chat a .chatWindow shows: a one-on-one chat has it as a prop, a group chat has only the view of the
  // group, with the chat of its open channel in it
  const chatViewOf = chat => fiberProps(chat, 14, props => props.chatView || props.groupView?.GetActiveChatView?.())

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

  // Group chat: "8 members · 1 in game" in place of a status (Steam's words)
  function groupStatusOf(view) {
    let total = 0
    let inGame = 0
    try {
      total = view?.GetMemberCountTotal?.() || 0
      inGame = view?.GetMemberCountInGame?.() || 0
    } catch { return "" }
    if (!total) return ""
    const members = total === 1
      ? steamText("Chat_Members", "1 member")
      : steamText("Chat_Members_Plural", "%1$s members").replace("%1$s", total)
    const playing = inGame ? ` · ${inGame} ${steamText("FriendGroup_InGame", "In Game").toLowerCase()}` : ""
    return members + playing
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

    const status = friend ? statusOf(friend) : { kind: "group", text: groupStatusOf(view) }
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
    const docked = !!document.querySelector(DOCKED_CHAT)
    const chat = docked ? activeChat() : null
    const id = chat?.friend?.steamid64
    const account = id ? String(BigInt(id) - STEAMID_BASE) : ""
    for (const row of document.querySelectorAll(".rcp-row-wrapper")) {
      const open = !!account && rowAccountId(row) === account
      if (row.classList.contains(OPEN_ROW) !== open) row.classList.toggle(OPEN_ROW, open)
    }
    // Group chats (Steam's list in the Chats tab): the group of the open tab
    let group = null
    try { group = chat?.view?.GetGroup?.() || null } catch { /* tab is closing */ }
    for (const item of document.querySelectorAll(".FriendsListChatSection .ChatRoomListGroupItem")) {
      const open = !!group && fiberProps(item, 6, props => props.group) === group
      if (item.classList.contains(OPEN_ROW) !== open) item.classList.toggle(OPEN_ROW, open)
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

  // A new width lays out the friends list and the chat again: given to Steam once per frame at most (several mouse
  // moves in one frame are one layout), and when the button is let go
  let listWidthWaiting = null // px: the width asked for last, not given to Steam yet
  let listFrame = 0
  let listMouseUp = false
  const LIST_DRAG_CLASS = "nk-list-dragging"

  function giveListWidth(desktop) {
    cancelAnimationFrame(listFrame)
    listFrame = 0
    if (listWidthWaiting === null) return
    const width = listWidthWaiting
    listWidthWaiting = null
    if (desktop.UIDisplayPrefs[LIST_PREF] !== width) desktop.SetUIDisplayPref(LIST_PREF, width)
  }

  function askListWidth(desktop, width) {
    listWidthWaiting = width
    listFrame ||= requestAnimationFrame(() => {
      listFrame = 0
      giveListWidth(desktop)
    })
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
          if (!folded) document.querySelector(".friendListCollapse .friendCollapseButton")?.click()
          return
        }
        if (folded) document.querySelector(".ChatTabs > .chatTabOpenFriendsList")?.click()
        const most = Math.max(LIST_MIN, Math.min(LIST_MAX, innerWidth - LIST_CHAT_MIN))
        askListWidth(desktop, Math.round(Math.max(LIST_MIN, Math.min(width, most))))
      },
    })
    // The button is let go: the last width at once. While dragging the cursor stays ↔ over the whole window and
    // rows under it get no hover (Chat.css)
    if (!listMouseUp) {
      listMouseUp = true
      addEventListener("mousedown", event => {
        if (event.button === 0 && event.target instanceof Element && event.target.closest(".chat_main.singlewindow .singleWindowDivider")) {
          document.documentElement.classList.add(LIST_DRAG_CLASS)
        }
      }, true)
      addEventListener("mouseup", () => {
        document.documentElement.classList.remove(LIST_DRAG_CLASS)
        giveListWidth(desktop)
      }, true)
      addEventListener("blur", () => document.documentElement.classList.remove(LIST_DRAG_CLASS))
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
      const view = chatViewOf(chat)
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
    "Global Custom Chat Background", "Expired", "Invite expired", "Invite", "Online", "Found",
    "View Deleted Messages", "Deleted Messages", "No deleted messages yet",
  ]
  const TEXTS = {
    ru: ["Фон чата", "Пользовательский фон чата", "Добавить картинку", "Без фона", "Удалить картинку", "Положение", "Заполнение", "По размеру", "Растянуть", "Замостить", "По центру", "Размытие", "Затемнение", "Сохранить", "Отмена", "Ответить", "Ответ %s", "Спойлер", "Фото", "Видео", "Стикер", "Глобальный пользовательский фон чата", "Истекло", "Приглашение истекло", "Приглашение", "В сети", "Найдено", "Посмотреть удалённые сообщения", "Удалённые сообщения", "Удалённых сообщений пока нет"],
    uk: ["Фон чату", "Власний фон чату", "Додати зображення", "Без фону", "Видалити зображення", "Положення", "Заповнення", "За розміром", "Розтягнути", "Плиткою", "По центру", "Розмиття", "Затемнення", "Зберегти", "Скасувати", "Відповісти", "Відповідь %s", "Спойлер", "Фото", "Відео", "Стікер", "Глобальний власний фон чату", "Минуло", "Запрошення минуло", "Запрошення", "В мережі", "Знайдено", "Переглянути видалені повідомлення", "Видалені повідомлення", "Видалених повідомлень поки немає"],
    bg: ["Фон на чата", "Собствен фон на чата", "Добавяне на изображение", "Без фон", "Изтриване на изображението", "Позиция", "Запълване", "Побиране", "Разтягане", "Плочки", "Центриране", "Размазване", "Затъмняване", "Запазване", "Отказ", "Отговор", "Отговор на %s", "Спойлер", "Снимка", "Видео", "Стикер", "Общ собствен фон на чата", "Изтекла", "Поканата изтече", "Покана", "На линия", "Намерени", "Преглед на изтритите съобщения", "Изтрити съобщения", "Още няма изтрити съобщения"],
    de: ["Chat-Hintergrund", "Eigener Chat-Hintergrund", "Bild hinzufügen", "Kein Hintergrund", "Bild löschen", "Position", "Füllen", "Anpassen", "Strecken", "Kacheln", "Zentrieren", "Unschärfe", "Abdunkeln", "Speichern", "Abbrechen", "Antworten", "Antwort an %s", "Spoiler", "Foto", "Video", "Sticker", "Globaler eigener Chat-Hintergrund", "Abgelaufen", "Einladung abgelaufen", "Einladung", "Online", "Gefunden", "Gelöschte Nachrichten ansehen", "Gelöschte Nachrichten", "Noch keine gelöschten Nachrichten"],
    fr: ["Fond du chat", "Fond de chat personnalisé", "Ajouter une image", "Aucun fond", "Supprimer l'image", "Position", "Remplir", "Ajuster", "Étirer", "Mosaïque", "Centrer", "Flou", "Assombrissement", "Enregistrer", "Annuler", "Répondre", "Réponse à %s", "Spoiler", "Photo", "Vidéo", "Sticker", "Fond de chat personnalisé global", "Expirée", "Invitation expirée", "Invitation", "En ligne", "Trouvés", "Voir les messages supprimés", "Messages supprimés", "Aucun message supprimé pour l'instant"],
    es: ["Fondo del chat", "Fondo de chat personalizado", "Añadir imagen", "Sin fondo", "Eliminar imagen", "Posición", "Rellenar", "Ajustar", "Estirar", "Mosaico", "Centrar", "Desenfoque", "Oscurecer", "Guardar", "Cancelar", "Responder", "Respuesta a %s", "Spoiler", "Foto", "Vídeo", "Sticker", "Fondo de chat personalizado global", "Caducada", "Invitación caducada", "Invitación", "En línea", "Encontrados", "Ver mensajes eliminados", "Mensajes eliminados", "Aún no hay mensajes eliminados"],
    pt: ["Fundo do chat", "Fundo de chat personalizado", "Adicionar imagem", "Sem fundo", "Eliminar imagem", "Posição", "Preencher", "Ajustar", "Esticar", "Mosaico", "Centrar", "Desfoque", "Escurecer", "Guardar", "Cancelar", "Responder", "Resposta a %s", "Spoiler", "Foto", "Vídeo", "Sticker", "Fundo de chat personalizado global", "Expirado", "Convite expirado", "Convite", "Online", "Encontrados", "Ver mensagens eliminadas", "Mensagens eliminadas", "Ainda não há mensagens eliminadas"],
    "pt-br": ["Fundo do chat", "Fundo de chat personalizado", "Adicionar imagem", "Sem fundo", "Excluir imagem", "Posição", "Preencher", "Ajustar", "Esticar", "Lado a lado", "Centralizar", "Desfoque", "Escurecer", "Salvar", "Cancelar", "Responder", "Resposta a %s", "Spoiler", "Foto", "Vídeo", "Figurinha", "Fundo de chat personalizado global", "Expirado", "Convite expirado", "Convite", "Online", "Encontrados", "Ver mensagens excluídas", "Mensagens excluídas", "Ainda não há mensagens excluídas"],
    it: ["Sfondo della chat", "Sfondo chat personalizzato", "Aggiungi immagine", "Nessuno sfondo", "Elimina immagine", "Posizione", "Riempi", "Adatta", "Estendi", "Affianca", "Centra", "Sfocatura", "Oscuramento", "Salva", "Annulla", "Rispondi", "Risposta a %s", "Spoiler", "Foto", "Video", "Sticker", "Sfondo chat personalizzato globale", "Scaduto", "Invito scaduto", "Invito", "Online", "Trovati", "Visualizza messaggi eliminati", "Messaggi eliminati", "Ancora nessun messaggio eliminato"],
    nl: ["Chatachtergrond", "Aangepaste chatachtergrond", "Afbeelding toevoegen", "Geen achtergrond", "Afbeelding verwijderen", "Positie", "Vullen", "Passend", "Uitrekken", "Naast elkaar", "Centreren", "Vervaging", "Verduistering", "Opslaan", "Annuleren", "Beantwoorden", "Antwoord aan %s", "Spoiler", "Foto", "Video", "Sticker", "Algemene aangepaste chatachtergrond", "Verlopen", "Uitnodiging verlopen", "Uitnodiging", "Online", "Gevonden", "Verwijderde berichten bekijken", "Verwijderde berichten", "Nog geen verwijderde berichten"],
    pl: ["Tło czatu", "Własne tło czatu", "Dodaj obraz", "Bez tła", "Usuń obraz", "Położenie", "Wypełnienie", "Dopasowanie", "Rozciągnięcie", "Sąsiadująco", "Wyśrodkowanie", "Rozmycie", "Przyciemnienie", "Zapisz", "Anuluj", "Odpowiedz", "Odpowiedź dla %s", "Spoiler", "Zdjęcie", "Wideo", "Naklejka", "Globalne własne tło czatu", "Wygasło", "Zaproszenie wygasło", "Zaproszenie", "Dostępni", "Znaleziono", "Zobacz usunięte wiadomości", "Usunięte wiadomości", "Brak usuniętych wiadomości"],
    cs: ["Pozadí chatu", "Vlastní pozadí chatu", "Přidat obrázek", "Bez pozadí", "Smazat obrázek", "Umístění", "Vyplnit", "Přizpůsobit", "Roztáhnout", "Dlaždice", "Na střed", "Rozostření", "Ztmavení", "Uložit", "Zrušit", "Odpovědět", "Odpověď pro %s", "Spoiler", "Fotka", "Video", "Nálepka", "Globální vlastní pozadí chatu", "Vypršelo", "Pozvánka vypršela", "Pozvánka", "Online", "Nalezeno", "Zobrazit smazané zprávy", "Smazané zprávy", "Zatím žádné smazané zprávy"],
    hu: ["Csevegés háttere", "Egyéni csevegőháttér", "Kép hozzáadása", "Nincs háttér", "Kép törlése", "Elhelyezés", "Kitöltés", "Igazítás", "Nyújtás", "Mozaik", "Középre", "Elmosás", "Sötétítés", "Mentés", "Mégse", "Válasz", "Válasz neki: %s", "Spoiler", "Fotó", "Videó", "Matrica", "Globális egyéni csevegőháttér", "Lejárt", "A meghívó lejárt", "Meghívó", "Elérhető", "Találat", "Törölt üzenetek megtekintése", "Törölt üzenetek", "Még nincsenek törölt üzenetek"],
    ro: ["Fundalul chatului", "Fundal de chat personalizat", "Adaugă o imagine", "Fără fundal", "Șterge imaginea", "Poziție", "Umplere", "Potrivire", "Întindere", "Mozaic", "Centrare", "Estompare", "Întunecare", "Salvează", "Anulează", "Răspunde", "Răspuns pentru %s", "Spoiler", "Fotografie", "Video", "Sticker", "Fundal de chat personalizat global", "Expirat", "Invitație expirată", "Invitație", "Online", "Găsite", "Vezi mesajele șterse", "Mesaje șterse", "Încă nu există mesaje șterse"],
    el: ["Φόντο συνομιλίας", "Προσαρμοσμένο φόντο συνομιλίας", "Προσθήκη εικόνας", "Χωρίς φόντο", "Διαγραφή εικόνας", "Θέση", "Γέμισμα", "Προσαρμογή", "Τέντωμα", "Παράθεση", "Στο κέντρο", "Θόλωση", "Σκίαση", "Αποθήκευση", "Ακύρωση", "Απάντηση", "Απάντηση σε %s", "Spoiler", "Φωτογραφία", "Βίντεο", "Αυτοκόλλητο", "Καθολικό προσαρμοσμένο φόντο συνομιλίας", "Έληξε", "Η πρόσκληση έληξε", "Πρόσκληση", "Συνδεδεμένοι", "Βρέθηκαν", "Προβολή διαγραμμένων μηνυμάτων", "Διαγραμμένα μηνύματα", "Δεν υπάρχουν ακόμη διαγραμμένα μηνύματα"],
    da: ["Chatbaggrund", "Brugerdefineret chatbaggrund", "Tilføj billede", "Ingen baggrund", "Slet billedet", "Placering", "Udfyld", "Tilpas", "Stræk", "Side om side", "Centrer", "Sløring", "Dæmpning", "Gem", "Annuller", "Svar", "Svar til %s", "Spoiler", "Foto", "Video", "Klistermærke", "Global brugerdefineret chatbaggrund", "Udløbet", "Invitationen er udløbet", "Invitation", "Online", "Fundet", "Se slettede beskeder", "Slettede beskeder", "Ingen slettede beskeder endnu"],
    sv: ["Chattbakgrund", "Anpassad chattbakgrund", "Lägg till bild", "Ingen bakgrund", "Ta bort bilden", "Placering", "Fyll", "Anpassa", "Sträck ut", "Sida vid sida", "Centrera", "Oskärpa", "Nedtoning", "Spara", "Avbryt", "Svara", "Svar till %s", "Spoiler", "Foto", "Video", "Klistermärke", "Global anpassad chattbakgrund", "Utgånget", "Inbjudan har gått ut", "Inbjudan", "Online", "Hittade", "Visa raderade meddelanden", "Raderade meddelanden", "Inga raderade meddelanden än"],
    no: ["Chatbakgrunn", "Egendefinert chatbakgrunn", "Legg til bilde", "Ingen bakgrunn", "Slett bildet", "Plassering", "Fyll", "Tilpass", "Strekk", "Side ved side", "Midtstill", "Uskarphet", "Nedtoning", "Lagre", "Avbryt", "Svar", "Svar til %s", "Spoiler", "Bilde", "Video", "Klistremerke", "Global egendefinert chatbakgrunn", "Utløpt", "Invitasjonen er utløpt", "Invitasjon", "Pålogget", "Funnet", "Se slettede meldinger", "Slettede meldinger", "Ingen slettede meldinger ennå"],
    fi: ["Keskustelun tausta", "Oma keskustelun tausta", "Lisää kuva", "Ei taustaa", "Poista kuva", "Sijainti", "Täytä", "Sovita", "Venytä", "Vierekkäin", "Keskitä", "Sumennus", "Himmennys", "Tallenna", "Peruuta", "Vastaa", "Vastaus käyttäjälle %s", "Spoileri", "Kuva", "Video", "Tarra", "Yleinen oma keskustelun tausta", "Vanhentunut", "Kutsu vanhentui", "Kutsu", "Paikalla", "Löytyi", "Näytä poistetut viestit", "Poistetut viestit", "Ei vielä poistettuja viestejä"],
    tr: ["Sohbet arka planı", "Özel sohbet arka planı", "Resim ekle", "Arka plan yok", "Resmi sil", "Konum", "Doldur", "Sığdır", "Uzat", "Döşe", "Ortala", "Bulanıklık", "Karartma", "Kaydet", "İptal", "Yanıtla", "%s için yanıt", "Spoiler", "Fotoğraf", "Video", "Çıkartma", "Genel özel sohbet arka planı", "Süresi doldu", "Davetin süresi doldu", "Davet", "Çevrimiçi", "Bulunan", "Silinen mesajları gör", "Silinen mesajlar", "Henüz silinen mesaj yok"],
    ar: ["خلفية المحادثة", "خلفية محادثة مخصصة", "إضافة صورة", "بدون خلفية", "حذف الصورة", "الموضع", "تعبئة", "ملاءمة", "تمديد", "تجانب", "توسيط", "تمويه", "تعتيم", "حفظ", "إلغاء", "رد", "رد على %s", "حرق", "صورة", "فيديو", "ملصق", "خلفية محادثة مخصصة عامة", "منتهية", "انتهت صلاحية الدعوة", "دعوة", "متصل", "النتائج", "عرض الرسائل المحذوفة", "الرسائل المحذوفة", "لا توجد رسائل محذوفة بعد"],
    ja: ["チャットの背景", "カスタムチャット背景", "画像を追加", "背景なし", "画像を削除", "配置", "ページ幅に合わせる", "画面に合わせる", "拡大して表示", "並べて表示", "中央に表示", "ぼかし", "暗さ", "保存", "キャンセル", "返信", "%s への返信", "ネタバレ", "写真", "動画", "ステッカー", "全体のカスタムチャット背景", "期限切れ", "招待の期限切れ", "招待", "オンライン", "見つかった数", "削除されたメッセージを見る", "削除されたメッセージ", "削除されたメッセージはまだありません"],
    ko: ["채팅 배경", "사용자 지정 채팅 배경", "이미지 추가", "배경 없음", "이미지 삭제", "위치", "채우기", "맞춤", "늘이기", "바둑판식", "가운데", "흐림", "어둡게", "저장", "취소", "답장", "%s에게 답장", "스포일러", "사진", "동영상", "스티커", "전체 사용자 지정 채팅 배경", "만료됨", "초대 만료됨", "초대", "온라인", "찾음", "삭제된 메시지 보기", "삭제된 메시지", "아직 삭제된 메시지가 없습니다"],
    "zh-cn": ["聊天背景", "自定义聊天背景", "添加图片", "无背景", "删除图片", "位置", "填充", "适应", "拉伸", "平铺", "居中", "模糊", "变暗", "保存", "取消", "回复", "回复 %s", "剧透", "图片", "视频", "贴纸", "全局自定义聊天背景", "已过期", "邀请已过期", "邀请", "在线", "找到", "查看已删除的消息", "已删除的消息", "还没有已删除的消息"],
    "zh-tw": ["聊天背景", "自訂聊天背景", "新增圖片", "無背景", "刪除圖片", "位置", "填滿", "符合", "延展", "並排", "置中", "模糊", "變暗", "儲存", "取消", "回覆", "回覆 %s", "劇透", "圖片", "影片", "貼圖", "全域自訂聊天背景", "已過期", "邀請已過期", "邀請", "線上", "找到", "查看已刪除的訊息", "已刪除的訊息", "還沒有已刪除的訊息"],
    th: ["พื้นหลังแชต", "พื้นหลังแชตแบบกำหนดเอง", "เพิ่มรูปภาพ", "ไม่มีพื้นหลัง", "ลบรูปภาพ", "ตำแหน่ง", "เติมเต็ม", "พอดี", "ยืด", "เรียงต่อกัน", "กึ่งกลาง", "เบลอ", "ความมืด", "บันทึก", "ยกเลิก", "ตอบกลับ", "ตอบกลับ %s", "สปอยล์", "รูปภาพ", "วิดีโอ", "สติกเกอร์", "พื้นหลังแชตแบบกำหนดเองทั้งหมด", "หมดอายุ", "คำเชิญหมดอายุ", "คำเชิญ", "ออนไลน์", "พบ", "ดูข้อความที่ถูกลบ", "ข้อความที่ถูกลบ", "ยังไม่มีข้อความที่ถูกลบ"],
    vi: ["Nền trò chuyện", "Nền trò chuyện tùy chỉnh", "Thêm ảnh", "Không có nền", "Xóa ảnh", "Vị trí", "Lấp đầy", "Vừa khít", "Kéo giãn", "Xếp lát", "Căn giữa", "Làm mờ", "Làm tối", "Lưu", "Hủy", "Trả lời", "Trả lời %s", "Spoiler", "Ảnh", "Video", "Nhãn dán", "Nền trò chuyện tùy chỉnh chung", "Đã hết hạn", "Lời mời đã hết hạn", "Lời mời", "Trực tuyến", "Đã tìm thấy", "Xem tin nhắn đã xóa", "Tin nhắn đã xóa", "Chưa có tin nhắn nào bị xóa"],
    id: ["Latar obrolan", "Latar obrolan kustom", "Tambah gambar", "Tanpa latar", "Hapus gambar", "Posisi", "Isi", "Sesuaikan", "Regangkan", "Ubin", "Tengah", "Buram", "Peredupan", "Simpan", "Batal", "Balas", "Balasan untuk %s", "Spoiler", "Foto", "Video", "Stiker", "Latar obrolan kustom global", "Kedaluwarsa", "Undangan kedaluwarsa", "Undangan", "Online", "Ditemukan", "Lihat pesan yang dihapus", "Pesan yang dihapus", "Belum ada pesan yang dihapus"],
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
      ...(key.startsWith("room:") ? groupMenuItems() : []),
      key && "separator",
      key && { text: ownText("View Deleted Messages"), run: openDeletedList },
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

  // Buttons of Steam's group header (hidden with it, Chat.css): notifications, invite a friend, group settings.
  // In the menu of a group chat they are items with Steam's own words (their tooltips) that press those buttons
  const GROUP_BUTTONS = [".chatRoomButton.ManageNotifications", ".chatRoomButton.InviteToGroupChat", ".chatRoomButton.GroupChatSettings"]
  // Of the chat on screen: every open chat has its own header
  const shownGroupButton = selector => [...document.querySelectorAll(selector)].find(el => el.closest(".chatWindow")?.offsetParent)

  // For the spare menu (menuItems)
  function groupMenuItems() {
    const items = GROUP_BUTTONS.map(selector => {
      const button = shownGroupButton(selector)
      return button?.title && { text: button.title, run: () => shownGroupButton(selector)?.click() }
    }).filter(Boolean)
    return items.length ? ["separator", ...items] : []
  }

  // key: whose background the item opens (a chat's, or BG_GLOBAL)
  function addOwnItems(menu, key) {
    const list = menu.querySelector(".contextMenuContents")
    if (!list || list.querySelector("[data-nk-own]")) return
    // A plain item of that menu to look like: the last one (the first of the status menu is the lit "Online")
    const sample = [...list.querySelectorAll(".contextMenuItem")].filter(item => !item.querySelector("svg")).pop()
    if (!sample) return
    const doc = menu.ownerDocument // the menu may live in a window of its own
    const separator = () => {
      const el = doc.createElement("div")
      el.className = list.querySelector(".ContextMenuSeparator")?.className || "ContextMenuSeparator"
      return el
    }
    const item = (text, run) => {
      const el = doc.createElement("div")
      el.className = sample.className
      el.setAttribute("role", "menuitem")
      el.setAttribute("data-nk-own", "")
      el.textContent = text
      el.addEventListener("click", () => {
        try { menuInstance(menu)?.Hide() } catch { /* Steam closes it on the lost focus */ }
        run()
      })
      // As Steam's items do: a submenu opened from another item closes (or that item stays lit, its submenu open)
      el.addEventListener("mouseenter", () => {
        try { menuInstance(menu)?.HideSubMenu?.() } catch { /* Steam changed its menus */ }
      })
      return el
    }

    if (key.startsWith("room:")) {
      for (const entry of groupMenuItems()) list.append(entry === "separator" ? separator() : item(entry.text, entry.run))
    }
    list.append(separator())
    // The chat's own deleted messages (not in the menu of the own status, that one is for every chat)
    if (key !== BG_GLOBAL) list.append(item(ownText("View Deleted Messages"), openDeletedList))
    list.append(item(ownText(key === BG_GLOBAL ? "Global Custom Chat Background" : "Custom Chat Background"), () => openBackgroundDialog(key)))
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
        // Chats are closed by their crosses (tabs button, recent chats): no "Close Tab" here
        for (const item of menu.querySelectorAll(".contextMenuItem")) if (item.textContent === closeText) item.style.display = "none"
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

  // Tabs Button

  // A chat (own window or docked) with the header in place of Steam's tabs (option Chat Window Title: Header). The tabs
  // are hidden, so a button right before the "more" one lists them: avatar and name, a dot for unread
  // messages, a cross that closes the chat. Option Auto Close Chat Tabs: no button, a chat opened in the window closes
  // the others (a chat with a call going on is left open)
  const TABS_ID = "nk-chat-tabs"
  const TABS_MENU_ID = "nk-chat-tabs-menu"
  const TABS_ROOM_CLASS = "nk-tabs-button" // on <html>: the button stands before "more", the others step aside (Chat.css)

  const rootFlag = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  // Header in place of the tabs, in a window of its own or docked to the friends list alike
  const headerInWindow = () => rootFlag("--nk-chat-title") === "header" && !!document.querySelector(".multiChatDialog .ChatTabs")
  const chatTabs = () => [...document.querySelectorAll(".ChatTabs .ChatTab")]

  function tabViewOf(tab) {
    for (const el of [tab, ...tab.querySelectorAll("*")]) {
      const view = fiberProps(el, 6, props => props.tab)
      if (view) return view
    }
    return null
  }

  // Steam switches tabs on the press of the mouse; works on a hidden tab too
  function pressTab(tab) {
    const options = { bubbles: true, cancelable: true, button: 0, buttons: 1, view: window }
    tab.dispatchEvent(new MouseEvent("mousedown", options))
    tab.dispatchEvent(new MouseEvent("mouseup", options))
  }
  const closeTab = tab => tab.querySelector(".CloseButton")?.click()

  function closeOtherTabs() {
    const active = document.querySelector(".ChatTabs .ChatTab.Active")
    if (!active) return
    for (const tab of chatTabs()) {
      if (tab === active) continue
      try { if (tabViewOf(tab)?.IsVoiceActive?.()) continue } catch { /* no view: closed */ }
      closeTab(tab)
    }
  }

  function closeTabsMenu() {
    document.getElementById(TABS_MENU_ID)?.remove()
    document.getElementById(TABS_ID)?.classList.remove("nk-open")
  }

  function tabsMenuRow(tab) {
    const view = tabViewOf(tab)
    const row = document.createElement("div")
    row.className = "_1n7Wloe5jZ6fSuvV18NNWI contextMenuItem nk-tabs-item"
    row.setAttribute("role", "menuitem")
    if (tab.classList.contains("Active")) row.classList.add("nk-active")
    const avatar = document.createElement("div")
    avatar.className = "nk-tabs-avatar"
    const picture = tab.querySelector(".avatarHolder, .ChatRoomGroupAvatar, .ChatRoomMultiFriendAvatar")
    if (picture) avatar.append(picture.cloneNode(true))
    const name = document.createElement("span")
    name.className = "nk-tabs-name"
    try { name.textContent = view?.GetTabName?.() || "" } catch { /* tab is closing */ }
    row.append(avatar, name)
    let unread = 0
    try { unread = view?.GetUnreadMessageCount?.() || 0 } catch { /* not known */ }
    if (unread && !tab.classList.contains("Active")) row.append(Object.assign(document.createElement("span"), { className: "nk-tabs-unread" }))
    const close = document.createElement("div")
    close.className = "nk-tabs-close"
    close.setAttribute("role", "button")
    close.title = steamText("Chat_CloseTabAction", "Close Tab")
    close.addEventListener("click", event => {
      event.stopPropagation()
      closeTab(tab)
      // Steam takes the tab out a moment later: the list is made again without it
      setTimeout(() => {
        if (!document.getElementById(TABS_MENU_ID)) return
        closeTabsMenu()
        const button = document.getElementById(TABS_ID)
        if (button && chatTabs().length) openTabsMenu(button)
      }, 100)
    })
    row.append(close)
    row.addEventListener("click", () => {
      closeTabsMenu()
      pressTab(tab)
    })
    return row
  }

  function openTabsMenu(button) {
    const menu = document.createElement("div")
    menu.id = TABS_MENU_ID
    menu.className = "PP7LM0Ow1K5qkR8WElLpt visible ready"
    const list = document.createElement("div")
    list.className = "_2EstNjFIIZm_WUSKm5Wt7n contextMenuContents"
    for (const tab of chatTabs()) list.append(tabsMenuRow(tab))
    menu.append(list)
    document.body.append(menu)
    button.classList.add("nk-open")
    // Under the button, left edges in line; kept inside the window
    const at = button.getBoundingClientRect()
    const left = Math.max(MENU_EDGE, Math.min(at.left, innerWidth - MENU_EDGE - menu.offsetWidth))
    menu.style.left = `${left}px`
    menu.style.top = `${Math.min(at.bottom + MENU_GAP, innerHeight - MENU_EDGE - menu.offsetHeight)}px`
  }

  function ensureTabsButton() {
    const host = document.querySelector(".multiChatDialog .chatDialogs")
    let button = document.getElementById(TABS_ID)
    const header = !!host && headerInWindow()
    const auto = header && rootFlag("--nk-auto-close-tabs") === "on"
    if (auto) closeOtherTabs()
    const wanted = header && !auto && chatTabs().length > 0 // shown with one chat too: the place stays the same
    document.documentElement.classList.toggle(TABS_ROOM_CLASS, wanted)
    if (!wanted) {
      closeTabsMenu()
      return button?.remove()
    }
    if (button?.parentElement !== host) {
      button?.remove()
      button = document.createElement("div")
      button.id = TABS_ID
      button.setAttribute("role", "button")
      button.addEventListener("click", () => {
        if (document.getElementById(TABS_MENU_ID)) return closeTabsMenu()
        openTabsMenu(button)
      })
      host.append(button)
    }
    // An unread chat in a hidden tab: a dot on the button
    const unread = chatTabs().some(tab => {
      if (tab.classList.contains("Active")) return false
      try { return tabViewOf(tab)?.GetUnreadMessageCount?.() > 0 } catch { return false }
    })
    if (button.classList.contains("nk-unread") !== unread) button.classList.toggle("nk-unread", unread)
  }

  function watchMenu() {
    addEventListener("mousedown", event => {
      const target = event.target instanceof Element ? event.target : null
      if (!target?.closest(`#${MENU_ID}, #${MORE_ID}`)) closeMenu()
      if (!target?.closest(`#${TABS_MENU_ID}, #${TABS_ID}`)) closeTabsMenu()
    }, true)
    addEventListener("keydown", event => {
      if (event.key !== "Escape") return
      closeMenu()
      closeTabsMenu()
    }, true)
    addEventListener("blur", () => { closeMenu(); closeTabsMenu() })
    addEventListener("resize", () => { closeMenu(); closeTabsMenu() })
  }


  // Custom Chat Background

  // A picture behind one chat, with its own blur and dimming (set in the window opened from the chat menu).
  // Everything is kept in the theme folder "Cache/Chat Backgrounds": the pictures themselves and backgrounds.json -
  // the list of pictures and, for every chat, its picture, its layout, blur and dimming. The file can be edited or deleted by hand.
  // Read through the theme's own address; written through Steam (a page cannot write files itself). Styles in Chat.css
  const BG_FOLDER = "Cache/Chat Backgrounds"
  const OLD_BG_FOLDER = "Cache" // before Cache had folders: moved from there once
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
  const chatBackgrounds = new Map() // chat key -> { name, picture, blur, dim } of the account signed in
  let draft = null // { key, picture, blur, dim } while the window is open: shown in the chat at once
  // Every Steam account has its own backgrounds (the pictures are one library for all): "accounts" of the file,
  // by the account's id. "chats" of an older file belong to the account that made them - the first one signed in
  // that is not one of those chats itself; they stay in the file until it comes
  let otherAccounts = {} // account id -> its chats, as in the file
  let olderChats = null
  let accountId = ""

  const fileUrl = (folder, name) => `${THEME_URL}${encodeURI(folder)}/${encodeURIComponent(name)}`
  const pictureUrl = name => fileUrl(BG_FOLDER, name)

  // The backgrounds of before the folders: the pictures and the list moved into their folder
  async function moveOldBackgrounds() {
    const old = await fetch(`${fileUrl(OLD_BG_FOLDER, BG_FILE)}?${Date.now()}`, { cache: "no-store" })
    if (!old.ok) return {}
    const data = await old.json()
    const files = await diskAccess()
    for (const name of data.pictures || []) {
      const picture = await fetch(fileUrl(OLD_BG_FOLDER, name)).catch(() => null)
      if (!picture?.ok) continue
      await files.write(name, await picture.arrayBuffer())
      await files.removeAt(`${OLD_BG_FOLDER}/${name}`)
    }
    await files.write(BG_FILE, new TextEncoder().encode(`${JSON.stringify(data, null, 2)}\n`).buffer)
    await files.removeAt(`${OLD_BG_FOLDER}/${BG_FILE}`)
    return data
  }
  const within = (value, max) => Math.max(0, Math.min(Number(value) || 0, max))

  function signedInId() {
    for (const win of [window, window.opener]) {
      try {
        const id = win?.g_FriendsUIApp?.FriendStore?.self?.steamid64
        if (id) return String(id)
      } catch { /* no store in that window */ }
    }
    return ""
  }

  // The account is known a little after the window opens
  async function waitAccount() {
    for (let i = 0; i < 100 && !signedInId(); i++) await new Promise(resolve => setTimeout(resolve, 100))
    return signedInId()
  }

  async function loadBackgrounds() {
    try {
      const response = await fetch(`${fileUrl(BG_FOLDER, BG_FILE)}?${Date.now()}`, { cache: "no-store" })
      // No file: the old place, or no backgrounds yet
      const data = response.ok ? await response.json() : await moveOldBackgrounds().catch(() => ({}))
      for (const name of data.pictures || []) {
        if (typeof name === "string" && name) library.set(name, pictureUrl(name))
      }
      accountId = await waitAccount()
      if (!accountId) throw new Error("the account signed in is not known")
      otherAccounts = { ...(data.accounts || {}) }
      let own = otherAccounts[accountId]
      delete otherAccounts[accountId]
      olderChats = data.chats && typeof data.chats === "object" ? data.chats : null
      if (!own && olderChats && !(`friend:${accountId}` in olderChats)) {
        own = olderChats
        olderChats = null
      }
      for (const [key, chat] of Object.entries(own || {})) {
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
    predecodeUsed()
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

    // Paths from the theme folder; Steam makes the folders on the way itself
    const root = `${themes}/${themeName}`
    // The bytes must belong to the window the request is sent from
    async function writeAt(path, buffer) {
      const result = await service.WriteFile({ path: `${root}/${path}`, data: new shared.Uint8Array(buffer) })
      if (!result.BSuccess()) throw new Error(`"${path}" is not written`)
    }
    // Steam can move a file, not delete it: out to Steam's temporary folder
    async function removeAt(path) {
      const extension = path.includes(".") ? path.split(".").pop() : "tmp"
      await shared.SteamClient.System.MoveFile(`${root}/${path}`, await shared.SteamClient.System.CreateTempPath(extension))
    }
    disk = {
      writeAt,
      removeAt,
      write: (name, buffer) => writeAt(`${BG_FOLDER}/${name}`, buffer),
      remove: name => removeAt(`${BG_FOLDER}/${name}`),
    }
    return disk
  }
  // For the other scripts of the theme (Gif Picker.js: own GIFs in Cache/GIFs)
  window.__nevkoThemeFiles = {
    url: THEME_URL,
    fileUrl,
    write: async (path, buffer) => (await diskAccess()).writeAt(path, buffer),
    remove: async path => (await diskAccess()).removeAt(path),
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
    if (!accountId) return // not read yet: the file would lose the other accounts
    const data = { pictures: [...library.keys()], accounts: { ...otherAccounts, [accountId]: Object.fromEntries(chatBackgrounds) } }
    if (olderChats) data.chats = olderChats
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
    for (const chats of [...Object.values(otherAccounts), olderChats]) {
      for (const [key, chat] of Object.entries(chats || {})) {
        if (chat?.picture === name) delete chats[key]
      }
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
    predecodeUsed()
    writeList()
  }

  // Layer behind the whole chat (messages and the message field): the box that holds both.
  // Every open chat has its window, only one of them is on screen. Each keeps its own layer: going back to a chat
  // does not build it, load and blur its picture again (that was the stutter on switching chats); the hidden
  // chats are display: none, their layers cost nothing
  function backgroundLayer(create) {
    const host = [...document.querySelectorAll(".chatWindow .ChatRoomGroupDialog_contents")].find(el => el.offsetParent)
    let layer = host?.querySelector(`:scope > #${BG_LAYER_ID}`) || null
    if (layer && !create) {
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

  // Pictures decoded once, before they are needed: the first switch to a chat shows its picture at once
  const decoded = new Map() // address -> Image (kept, so the browser keeps it decoded)
  function predecode(url) {
    if (!url || decoded.has(url)) return
    const image = new Image()
    image.src = url
    decoded.set(url, image)
    image.decode?.().catch(() => { /* broken file: the layer shows nothing, as before */ })
  }
  function predecodeUsed() {
    for (const chat of chatBackgrounds.values()) predecode(library.get(chat.picture))
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

  // Deleted Messages

  // The deleted messages of the chat on screen (kept by Message Archive.js), from the chat menu: a list over the
  // chat, as in AyuGram - by days, the author's name over each bubble, its time inside
  const DELETED_ID = "nk-deleted-list"

  function archiveEngine() {
    for (const win of [window.opener, window]) {
      try { if (win?.__nkMessageArchive?.listDeleted) return win.__nkMessageArchive } catch { /* no access */ }
    }
    return null
  }

  const escapeHtml = text => text.replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char])

  // Steam's text (BBCode) as a little HTML: quotes, pictures, emoticons; other tags as their text
  function deletedHtml(text) {
    let html = escapeHtml(withoutMark(text))
    html = html.replace(/\[quote(?:=[^\]]*)?\]([\s\S]*?)\[\/quote\]/g, (_, inner) => `<div class="nk-deleted-quote">${inner.trim()}</div>`)
    // Steam writes the address inside the tag too: [img src=URL ...]URL[/img]
    html = html.replace(/\[img src=(?:&quot;)?([^\s\]&]+)(?:&quot;)?[^\]]*\](?:[\s\S]*?\[\/img\])?/g, (_, src) => `<img class="nk-deleted-picture" src="${src}" alt="">`)
    html = html.replace(/\[emoticon\]([^[]*)\[\/emoticon\]/g, (_, name) => `<img class="nk-deleted-emoticon" src="https://community.fastly.steamstatic.com/economy/emoticon/${encodeURIComponent(name)}" alt=":${name}:">`)
    html = html.replace(/\[sticker[^\]]*\][\s\S]*?\[\/sticker\]|\[sticker[^\]]*\]/g, `<span class="nk-deleted-note">${escapeHtml(ownText("Sticker"))}</span>`)
    html = html.replace(/\[video[^\]]*\][\s\S]*?\[\/video\]|\[video[^\]]*\]/g, `<span class="nk-deleted-note">${escapeHtml(ownText("Video"))}</span>`)
    html = html.replace(/\[\/?[a-z]+[^\]]*\]/g, "")
    return html.replace(/\n/g, "<br>")
  }

  function closeDeletedList() {
    document.getElementById(DELETED_ID)?.remove()
  }

  function openDeletedList() {
    closeDeletedList()
    const chat = shownView()?.m_chat
    const area = document.querySelector(".multiChatDialog .chatDialogs")?.getBoundingClientRect()
    if (!chat || !area) return
    let messages = []
    try { messages = archiveEngine()?.listDeleted(chat) || [] } catch { /* the archive is not running */ }

    const panel = document.createElement("div")
    panel.id = DELETED_ID
    Object.assign(panel.style, { left: `${area.left}px`, top: `${area.top}px`, width: `${area.width}px`, height: `${area.height}px` })
    panel.innerHTML = '<div class="nk-deleted-head"><div class="nk-deleted-title"></div><div class="nk-deleted-close" role="button"></div></div><div class="nk-deleted-body"></div>'
    panel.querySelector(".nk-deleted-title").textContent = `${ownText("Deleted Messages")} · ${messages.length}`
    panel.querySelector(".nk-deleted-close").addEventListener("click", closeDeletedList)
    const body = panel.querySelector(".nk-deleted-body")

    const lang = document.documentElement.lang || undefined
    let day = ""
    for (const message of messages) {
      const date = new Date(message.ts * 1000)
      const dayText = date.toLocaleDateString(lang, { day: "numeric", month: "long", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" })
      if (dayText !== day) {
        day = dayText
        const pill = document.createElement("div")
        pill.className = "nk-deleted-day"
        pill.textContent = dayText
        body.append(pill)
      }
      const bubble = document.createElement("div")
      bubble.className = "nk-deleted-bubble"
      bubble.innerHTML = `<div class="nk-deleted-name"></div><div class="nk-deleted-text">${deletedHtml(message.text)}</div><span class="nk-deleted-time"></span>`
      bubble.querySelector(".nk-deleted-name").textContent = authorName(message.author)
      bubble.querySelector(".nk-deleted-time").textContent = date.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })
      body.append(bubble)
    }
    if (!messages.length) {
      const empty = document.createElement("div")
      empty.className = "nk-deleted-empty"
      empty.textContent = ownText("No deleted messages yet")
      body.append(empty)
    }
    document.body.append(panel)
    body.scrollTop = body.scrollHeight // the newest at the bottom, as in the chat
  }

  function watchDeletedList() {
    addEventListener("keydown", event => {
      if (event.key === "Escape" && document.getElementById(DELETED_ID)) closeDeletedList()
    }, true)
    // A press past the list (another chat, the friends list): it is the chat on screen no more
    document.addEventListener("mousedown", event => {
      if (event.target instanceof Element && !event.target.closest(`#${DELETED_ID}`)) closeDeletedList()
    }, true)
    addEventListener("resize", closeDeletedList)
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
  // Game invites (and group invites) cannot be answered
  const NO_REPLY = ":has(> .msgText > :is([class*='Invite'], [class*='invite']))"
  const REPLY_MAX = 60 // characters of the answered message kept in the quote: a part is enough to know it
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

  // Text as the quote has it. A link in the quote would be sent again and Steam would put its preview into the quote:
  // only its site is kept, without "https://" and "www." (Steam makes a link only of those)
  const quotedText = message => plainText(message).replace(/\b(?:https?:\/\/|www\.)(?:www\.)?([^\s/?#]+)\S*/gi, "$1")

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
    return chat ? chatViewOf(chat) : null
  }

  // Mark of the answered message in the quote, invisible: its time and number, written with zero-width characters
  // after the quoted text. A click on the card goes to exactly that message (older cards: found by the text)
  const MARK_EDGE = "⁣"
  const MARK_DIGITS = ["​", "‌", "‍", "⁠"]
  const MARK = /⁣([​‌‍⁠]+)⁣/
  const withoutMark = text => text.replace(/[⁣​‌‍⁠]/g, "")

  function markOf(msg) {
    let value = Number(msg.rtTimestamp) * 1000 + (Number(msg.unOrdinal) || 0) % 1000
    if (!value) return ""
    let digits = ""
    for (; value > 0; value = Math.floor(value / 4)) digits = MARK_DIGITS[value % 4] + digits
    return MARK_EDGE + digits + MARK_EDGE
  }

  function readMark(text) {
    const found = MARK.exec(text)
    if (!found) return null
    let value = 0
    for (const char of found[1]) value = value * 4 + MARK_DIGITS.indexOf(char)
    return { time: Math.floor(value / 1000), ordinal: value % 1000 }
  }

  function startReply(el) {
    const found = messageOf(el)
    if (!found) return
    const { msg, chatView: view } = found
    let text = withoutMark(quotedText(msg.strMessage))
    // Cut at a word, if one ends in the second half of the length
    if (text.length > REPLY_MAX) {
      const cut = text.slice(0, REPLY_MAX - 1)
      const word = cut.lastIndexOf(" ")
      text = `${(word > REPLY_MAX / 2 ? cut.slice(0, word) : cut).trimEnd()}…`
    }
    const name = authorName(msg.unAccountID)
    if (!text || !name) return
    replies.set(view, { name, text, mark: markOf(msg), el })
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
  // the quote, then the answer. Chat.css draws the quote as a card that stands on the answer.
  // An answer is text, a sticker (Steam sends it as "/sticker name") or a file - a picture, a GIF (Steam's upload;
  // the GIF tab sends through it too). Other commands (room effects...) are no answers: the reply waits for the next
  const ANSWER_COMMAND = /^\/sticker\s/

  function takeReply(view) {
    const reply = replies.get(view)
    replies.delete(view)
    delete view.SendChatMessage
    delete view.UploadFile
    updateReplyBar()
    return reply
  }

  function hookSend(view) {
    if (Object.hasOwn(view, "SendChatMessage")) return
    const send = view.SendChatMessage
    const upload = view.UploadFile
    const quote = (chat, reply) => send.call(chat, `/quote ${reply.name}\n${reply.text}${reply.mark || ""}`)
    view.SendChatMessage = async function (text) {
      const message = String(text)
      if (!message.trim() || (message.startsWith("/") && !ANSWER_COMMAND.test(message))) return send.call(this, text)
      const reply = takeReply(this)
      if (reply) await quote(this, reply)
      return send.call(this, text)
    }
    if (typeof upload !== "function") return
    view.UploadFile = async function (...args) {
      const reply = takeReply(this)
      if (reply) await quote(this, reply)
      return upload.apply(this, args)
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
    for (const addons of document.querySelectorAll(`.chatWindow .ChatMessageBlock > .msg:not(${NO_REPLY}) > .Addons:not(:has(> .${REPLY_BUTTON}))`)) {
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

  // The card was written by the client of whoever answered: their name for the author (a nickname, an older name)
  // and their language for media ("Фото" / "Photo"). So any name of the author fits, media words of every
  // language are one mark, and if no name fits, the nearest message with that text is taken
  function namesOf(accountId) {
    const names = new Set()
    for (const win of [window, window.opener]) {
      try {
        const player = win?.g_FriendsUIApp?.FriendStore?.GetPlayer(accountId)
        for (const name of [player?.display_name, player?.persona?.m_strPlayerName, player?.nickname]) if (name) names.add(String(name))
      } catch { /* no store in that window */ }
    }
    return names
  }

  const MEDIA_KEYS = ["Photo", "Video", "Sticker"]
  let mediaWords = null
  function sameText(text) {
    mediaWords ??= MEDIA_KEYS.map(key => {
      const index = TEXT_KEYS.indexOf(key)
      const words = new Set([key, ...Object.values(TEXTS).map(texts => texts?.[index]).filter(Boolean)])
      return { key, words: [...words].map(word => word.toLowerCase()).sort((a, b) => b.length - a.length) }
    })
    let result = text.toLowerCase().replace(/\s+/g, " ").trim()
    for (const { key, words } of mediaWords) for (const word of words) result = result.split(word).join(`\u0000${key}`)
    return result
  }

  // The answered message may be older than what Steam has loaded: the older history is asked for, page by page,
  // until it is there (a marked card waits for exactly its message; then the text is tried)
  const HISTORY_PAGES = 30
  let seeking = false

  async function showAnswered(card) {
    if (seeking) return
    const from = card.closest(".msg")
    const chat = messageOf(from)?.chatView?.m_chat
    const go = target => {
      target.scrollIntoView({ block: "center", behavior: "smooth" })
      highlightLine(target)
    }

    const mark = readMark(card.textContent)
    const [name] = card.textContent.split("\n")
    // An older quote of a link holds Steam's preview of it: the message is found by that link
    const link = card.querySelector(".ChatMessageOpenGraph a[href]")?.getAttribute("href")
    const rest = withoutMark([...card.childNodes].filter(node => !node.matches?.(".ChatMessageOpenGraph")).map(node => node.textContent).join(""))
    const text = sameText(rest.split("\n").slice(1).join(" ").replace(/…$/, ""))
    if (!mark && !text && !link) return

    const earlier = () => {
      const all = [...document.querySelectorAll(".chatWindow .ChatMessageBlock > .msg")].filter(el => el.offsetParent)
      const index = all.indexOf(from)
      return all.slice(0, index < 0 ? all.length : index).reverse()
    }
    const byMark = () => earlier().find(el => {
      const msg = messageOf(el)?.msg
      return msg && Number(msg.rtTimestamp) === mark.time && (Number(msg.unOrdinal) || 0) % 1000 === mark.ordinal
    })
    const byText = () => {
      if (!text && !link) return null
      const candidates = earlier().filter(el => {
        const found = messageOf(el)
        if (!found) return false
        const message = String(found.msg.strMessage || "")
        if (link && !message.includes(link)) return false
        return !text || sameText(quotedText(message)).startsWith(text) || sameText(plainText(message)).startsWith(text)
      })
      return candidates.find(el => namesOf(messageOf(el).msg.unAccountID).has(name.trim())) || candidates[0] || null
    }

    seeking = true
    try {
      for (let page = 0; page <= HISTORY_PAGES; page++) {
        const target = mark ? byMark() : byText()
        if (target) return go(target)
        if (!chat?.IsMoreHistoryAvailable?.()) break
        await chat.LoadMoreHistory()
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 30))) // drawn
      }
      // The whole history and no message with that mark (deleted): the text, if it is still somewhere
      const target = mark && byText()
      if (target) go(target)
    } catch { /* the chat was closed meanwhile */ } finally {
      seeking = false
    }
  }

  // Ctrl+Up / Ctrl+Down: the reply goes to the message before / after (as in Telegram); past the last - no reply
  function stepReply(up) {
    const view = shownView()
    if (!view) return false
    const list = [...document.querySelectorAll(`.chatWindow .ChatMessageBlock > .msg:not(${NO_REPLY})`)].filter(el => el.offsetParent && messageOf(el))
    if (!list.length) return false
    const current = replies.get(view)?.el
    let index = current && list.includes(current) ? list.indexOf(current) : list.length
    index += up ? -1 : 1
    if (index >= list.length) {
      cancelReply(view)
      return true
    }
    const target = list[Math.max(0, index)]
    startReply(target)
    target.scrollIntoView({ block: "nearest", behavior: "smooth" })
    highlightLine(target)
    return true
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
      if (message?.matches(NO_REPLY)) return
      // Not on the text itself: a double click there selects a word, as everywhere
      if (message && !event.target.closest("a, img, video, .Addons, .MessageReactions, .msgText")) startReply(message)
    })
    addEventListener("keydown", event => {
      if (event.key === "Escape" && document.getElementById(REPLY_BAR_ID)) cancelReply(shownView())
      if (event.ctrlKey && !event.altKey && !event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        if (stepReply(event.key === "ArrowUp")) event.preventDefault()
      }
    }, true)
  }


  // Start

  let frame = null
  function schedule() {
    frame ??= requestAnimationFrame(() => {
      frame = null
      markInvites()
      markEffects()
      markStickerBlocks()
      markMemberGroups()
      patchMemberSections()
      patchMemberStep()
      updateTabNav()
      markGroupLastMessages()
      decorateMembers()
      markMemberSearch()
      markChannelTitles()
      markServerMessages()
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
      ensureTabsButton()
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
    ensureTabsButton()
    watchSpoilers()
    watchReplies()
    watchMenu()
    watchBackgroundDialog()
    watchDeletedList()
    loadBackgrounds()
    patchMemberSections()
    document.documentElement.style.setProperty("--nk-found-text", JSON.stringify(ownText("Found")))
    addEventListener("resize", updateTabNav) // the tabs may fit, or no longer fit
    for (const type of ["click", "mousedown", "pointerdown", "dblclick"]) {
      document.addEventListener(type, onMemberJoin, true)
      document.addEventListener(type, onFoldedSearch, true)
      document.addEventListener(type, onMemberAvatar, true)
      document.addEventListener(type, onSpeakerName, true)
    }
    document.addEventListener("mouseover", onSpeakerBadge)
    // attributes: the active tab changes by a class only
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] })
    setInterval(updateHeader, HEADER_REFRESH)
    setInterval(decorateMembers, HEADER_REFRESH) // a game started or ended changes no element of the row
    setInterval(markGroupLastMessages, HEADER_REFRESH) // nor does a new message in a group that is not open
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
