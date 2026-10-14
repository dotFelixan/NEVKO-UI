// Friends tab list: chat / join buttons instead of double click, parties in one row, group counters
// Styles: Friends List.css | Friend data comes from Steam's own row component (React props)

;(() => {
  "use strict"

  const LIST = ".friendlistListContainer:not(.rcp-list)"
  const ROW = `${LIST} .friend`
  const ACTIONS = "nk-friend-actions"
  const PARTY_ATTR = "nkParty" // data-nk-party: lead / member
  const REFRESH_EVERY = 3000   // ms, unread counts and joinable games change without DOM changes

  const MENU_CLASS = "_2EstNjFIIZm_WUSKm5Wt7n contextMenuContents"
  const ITEM_CLASS = "_1n7Wloe5jZ6fSuvV18NNWI contextMenuItem"

  const shared = window.opener


  // Texts (Steam's own strings)

  function localize(token, fallback) {
    for (const win of [window, shared]) {
      try {
        const text = win?.LocalizationManager?.LocalizeString(token)
        if (text && !text.startsWith("#")) return text
      } catch {}
    }
    return fallback
  }


  // Steam Data

  // Row -> { friend, browserContext } of Steam's friend row component
  function dataOf(row) {
    const fiberKey = Object.keys(row).find(key => key.startsWith("__reactFiber"))
    for (let fiber = fiberKey && row[fiberKey], depth = 0; fiber && depth < 8; fiber = fiber.return, depth++) {
      const props = fiber.memoizedProps
      if (props?.friend?.persona && props.browserContext) return { friend: props.friend, browserContext: props.browserContext }
    }
    return null
  }

  const nameOf = (row, friend) => friend?.display_name || row.querySelector(".playerName")?.textContent.trim() || ""

  // accountId -> unread messages
  function unreadCounts() {
    const counts = new Map()
    try {
      for (const chat of shared.g_FriendsUIApp.ChatStore.FriendChatStore.m_rgFriendChats) {
        if (chat.unread_message_count > 0) counts.set(chat.m_unAccountIDFriend, chat.unread_message_count)
      }
    } catch {}
    return counts
  }

  // Same link Steam's "Join Game" menu item opens; null = Steam asks in its own dialog
  function joinUrl(friend) {
    const persona = friend.persona
    const app = persona.m_unGamePlayedAppID
    const lobby = persona.m_game_lobby_id && persona.m_game_lobby_id !== "0" ? persona.m_game_lobby_id : null
    const connect = persona.connect_string
    if (lobby) return `steam://joinlobby/${app}/${lobby}/${friend.steamid64}`
    if (persona.has_joinable_game_flag && !connect?.length) return null
    return `steam://rungame/${app}/${friend.steamid64}` + (connect !== undefined ? "/" + encodeURIComponent(connect) : "")
  }

  // Steam's own is_in_joinable_game is true for everyone with an empty lobby id (offline friends too)
  const isJoinable = friend => {
    try {
      const persona = friend.persona
      const lobby = persona.m_game_lobby_id
      return persona.m_unGamePlayedAppID > 0
        && (!!persona.has_joinable_game_flag || (!!lobby && lobby !== "0") || !!persona.has_server_ip)
    } catch {
      return false
    }
  }


  // Actions

  let ownEvent = false // our own dblclick / contextmenu, let it through

  function openChat(row) {
    const data = dataOf(row)
    try {
      data.friend.OpenChatDialog(data.browserContext)
      shared.g_FriendsUIApp.UIStore.FocusChatTextEntryByAccountID(data.browserContext, data.friend.accountid)
    } catch {
      // Steam changed something: its own double click still opens the chat
      ownEvent = true
      row.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, view: window }))
      ownEvent = false
    }
  }

  // Steam opens a friend's menu from a right click inside the row (name / avatar), a click on the row
  // element itself gives the menu of the whole list
  function openSteamMenu(row, x, y) {
    const target = row.querySelector(".labelHolder") || row
    ownEvent = true
    target.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 2 }))
    ownEvent = false
  }

  function joinGame(row, x, y) {
    const friend = dataOf(row)?.friend
    const url = friend && joinUrl(friend)
    if (url) location.href = url
    else openSteamMenu(row, x, y) // Steam's menu has "Join Game" with its own dialog
  }


  // Party Menu: pick a friend of the party, then the action runs for that friend

  let registry = null

  function getRegistry() {
    if (registry) return registry
    let req
    try { shared.webpackChunksteamui.push([[Symbol("nk-friends-list")], {}, r => { req = r }]) } catch { return null }
    for (const [id, factory] of Object.entries(req?.m || {})) {
      if (!factory.toString().includes("GetContextMenuManagerFromWindow")) continue
      try { registry = Object.values(req(id)).find(value => value?.GetContextMenuManager) || null } catch {}
      if (registry) break
    }
    return registry
  }

  // Steam's own menu of a friend as a React element, without showing it:
  // our right click goes to Steam, the menu it creates is caught and kept hidden
  function steamMenuOf(row, x, y) {
    const manager = getRegistry()?.GetContextMenuManager(window)
    const proto = manager && Object.getPrototypeOf(manager)
    if (!proto) return null

    const create = proto.CreateContextMenuInstance
    let element = null
    proto.CreateContextMenuInstance = function (content, ...rest) {
      const instance = create.call(this, content, ...rest)
      instance.Show = () => {} // nothing opens while we look (the same click also makes the list's own menu)
      if (!element && content?.props?.friend) element = content
      return instance
    }
    try { openSteamMenu(row, x, y) } catch {} finally { proto.CreateContextMenuInstance = create }
    return element
  }

  // rows: party rows | onPick(row): what to do with the picked friend
  // submenu: hovering a name opens that friend's Steam menu beside (right click on a party)
  function pickFromParty(rows, anchor, x, y, onPick, { submenu = false } = {}) {
    const React = shared?.SP_REACT
    const manager = React && getRegistry()?.GetContextMenuManager(window)
    if (!manager) return onPick(rows[0])

    let instance = null
    const menus = new Map() // row -> Steam menu element
    const showSubmenu = (row, item) => {
      if (!menus.has(row)) menus.set(row, steamMenuOf(row, x, y))
      const menu = menus.get(row)
      try { if (menu) instance.ShowSubMenu(item, () => menu) } catch {}
    }

    const items = rows.map((row, index) => React.createElement("div", {
      key: index,
      className: `${ITEM_CLASS} nk-party-menu-item`,
      onMouseEnter: submenu ? event => showSubmenu(row, event.currentTarget) : undefined,
      onClick: event => {
        // With a submenu the name only opens it; if Steam's menu could not be caught, fall back to it as a new menu
        if (submenu && menus.get(row)) return showSubmenu(row, event.currentTarget)
        try { instance?.Hide() } catch {}
        onPick(row)
      },
    },
      React.createElement("span", null, nameOf(row, dataOf(row)?.friend)),
      submenu ? React.createElement("span", { className: "nk-party-menu-arrow" }, "›") : null,
    ))
    instance = manager.CreateContextMenuInstance(React.createElement("div", { className: MENU_CLASS }, items), anchor, x, y, {
      bForcePopup: true, title: "NEVKO Party Menu",
    })
    instance.Show()
  }

  const partyOf = lead => {
    const rows = [lead]
    for (let row = lead.nextElementSibling; row?.dataset[PARTY_ATTR] === "member"; row = row.nextElementSibling) rows.push(row)
    return rows
  }


  // Rows

  const CHAT_TEXT = localize("#Friend_Menu_SendMessage", "Send Message")
  const JOIN_TEXT = localize("#Friend_Menu_JoinFriendGame", "Join Game")

  function button(className, title) {
    const el = document.createElement("button")
    el.type = "button"
    el.className = `nk-friend-button ${className}`
    el.title = title
    return el
  }

  function ensureActions(row) {
    let actions = row.querySelector(`:scope > .${ACTIONS}`)
    if (!actions) {
      actions = document.createElement("div")
      actions.className = ACTIONS
      actions.append(button("nk-friend-join", JOIN_TEXT), button("nk-friend-chat", CHAT_TEXT))
      row.append(actions)
    }
    return actions
  }

  // Write only on change (the observer watches the list)
  function setAttr(el, name, value) {
    if (value === null || value === undefined) { if (el.hasAttribute(name)) el.removeAttribute(name) }
    else if (el.getAttribute(name) !== String(value)) el.setAttribute(name, value)
  }

  // Sent friend request: "Cancel Invite" under the row | first press arms it, second one (within a few seconds) cancels
  const CANCEL_TEXT = localize("#Friend_Invites_CancelInvite", "Cancel Invite")
  const CONFIRM_TEXT = localize("#Button_Confirm", "Confirm")
  const CONFIRM_TIME = 4000

  function ensureCancelButton(row) {
    const sent = !!row.closest(".friendOutgoingRequests")
    let cancel = row.querySelector(":scope > .nk-friend-wide")
    if (!sent) return cancel?.remove()
    if (cancel) return
    cancel = button("nk-friend-wide", "")
    cancel.classList.remove("nk-friend-button")
    cancel.textContent = CANCEL_TEXT
    row.append(cancel)
  }

  function onCancelInvite(cancel, row) {
    if (!cancel.hasAttribute("data-nk-confirm")) {
      cancel.setAttribute("data-nk-confirm", "")
      cancel.textContent = CONFIRM_TEXT
      setTimeout(() => {
        cancel.removeAttribute("data-nk-confirm")
        cancel.textContent = CANCEL_TEXT
      }, CONFIRM_TIME)
      return
    }
    // The same call Steam makes for "Cancel Invite" in Big Picture
    const friend = dataOf(row)?.friend
    try { if (friend) shared.g_FriendsUIApp.FriendStore.RemoveFriend(friend) } catch {}
  }

  function updateRow(row, rows, unread) {
    ensureCancelButton(row)
    const actions = ensureActions(row)
    const friends = rows.map(member => dataOf(member)?.friend).filter(Boolean)

    const count = friends.reduce((sum, friend) => sum + (unread.get(friend.accountid) || 0), 0)
    setAttr(actions.querySelector(".nk-friend-chat"), "data-nk-unread", count > 0 ? (count > 99 ? "99+" : count) : null)

    const join = actions.querySelector(".nk-friend-join")
    const joinable = friends.some(isJoinable)
    if (join.hidden === joinable) join.hidden = !joinable
  }

  // Steam's last line of a party, "+3 With 3 more players" (players who are not friends): row of the party -> that line.
  // The line itself is hidden (Friends List.css), its number is shown in the row as a chip
  const moreOf = new WeakMap()

  function setMore(row, footer) {
    let chip = row.querySelector(`:scope > .${ACTIONS} > .nk-party-more`)
    const count = footer?.querySelector(".count")?.textContent.trim() || ""
    if (!count) return chip?.remove()
    if (!chip) {
      chip = document.createElement("div")
      chip.className = "nk-party-more"
      ensureActions(row).prepend(chip)
    }
    const label = footer.querySelector(".SteamPlayerGroupFooterLabel")?.textContent.trim() || ""
    if (chip.textContent !== count) chip.textContent = count
    if (chip.title !== label) chip.title = label
  }

  // Party = rows from .firstInGroup to .lastInGroup (Steam's bracket): the first row stands for all of them
  function markParties(container) {
    let party = null
    let lastFriend = null
    const parties = []
    for (const row of container.children) {
      if (row.classList.contains("friend")) moreOf.delete(row)
      // The "more players" line closes the bracket in place of the last friend
      if (row.classList.contains("SteamPlayerGroupFooter")) {
        const lead = party?.[0] || lastFriend
        if (lead) moreOf.set(lead, row)
        if (party) parties.push(party)
        party = null
        continue
      }
      if (!row.classList.contains("friend")) { party = null; continue }
      lastFriend = row
      if (row.classList.contains("firstInGroup")) party = []
      if (party) party.push(row)
      else setAttr(row, "data-nk-party", null)
      if (party && row.classList.contains("lastInGroup")) {
        parties.push(party)
        party = null
      }
    }
    if (party) party.forEach(row => setAttr(row, "data-nk-party", null)) // open bracket: not a party

    for (const rows of parties) {
      if (rows.length < 2) { setAttr(rows[0], "data-nk-party", null); continue }
      rows.forEach((row, index) => setAttr(row, "data-nk-party", index ? "member" : "lead"))
      decorateLead(rows)
    }
  }

  // Lead row: avatars of the others next to its own, all names in one line
  function decorateLead(rows) {
    const lead = rows[0]
    const others = rows.slice(1)
    // src + status classes of each member's avatar
    const avatars = others.map(row => {
      const holder = row.querySelector(".avatarHolder")
      const status = ["online", "offline", "ingame", "awayOrSnooze"].filter(name => holder?.classList.contains(name)).join(" ")
      return { src: holder?.querySelector("img.avatar")?.src || "", status }
    }).filter(avatar => avatar.src)
    const names = rows.map(row => nameOf(row, dataOf(row)?.friend)).filter(Boolean).join(", ")

    const holder = lead.querySelector(".avatarHolder")?.parentElement
    if (holder) {
      let stack = holder.querySelector(":scope > .nk-party-avatars")
      if (!stack) {
        stack = document.createElement("div")
        stack.className = "nk-party-avatars"
        holder.append(stack)
      }
      const signature = avatars.map(avatar => avatar.src + " " + avatar.status).join("|")
      if (stack.dataset.nkSources !== signature) {
        stack.dataset.nkSources = signature
        // Steam's avatar markup: the theme's status indicator (Modern / Legacy) styles it
        stack.replaceChildren(...avatars.map(({ src, status }) => {
          const copy = document.createElement("div")
          copy.className = `nibodjvvrm86uCfnnAn4g avatarHolder no-drag Medium ${status}`
          const mark = document.createElement("div")
          mark.className = "_3xUpb5DWXPFNcHHIcv-9pe avatarStatus"
          const img = document.createElement("img")
          img.className = "_3h-QRJGxnVOIExtHD1R0f2 avatar"
          img.src = src
          img.draggable = false
          copy.append(mark, img)
          return copy
        }))
      }
    }

    const line = lead.querySelector(".statusAndName")
    if (line) {
      let label = line.querySelector(":scope > .nk-party-names")
      if (!label) {
        label = document.createElement("div")
        label.className = "nk-party-names"
        line.append(label)
      }
      if (label.textContent !== names) label.textContent = names
    }
  }

  // Not a party lead any more: remove our parts
  function cleanRow(row) {
    row.querySelector(".nk-party-avatars")?.remove()
    row.querySelector(".nk-party-names")?.remove()
  }

  function refresh() {
    const list = document.querySelector(LIST)
    if (!list || !list.offsetHeight) return // Chats tab is open

    for (const count of list.querySelectorAll(".groupName > .groupCount")) {
      setAttr(count, "data-nk-count", count.textContent.replace(/\D/g, "") || null)
    }

    for (const container of new Set([...list.querySelectorAll(".friend")].map(row => row.parentElement))) markParties(container)

    const unread = unreadCounts()
    for (const row of list.querySelectorAll(".friend")) {
      const role = row.dataset[PARTY_ATTR]
      if (role === "member") continue
      if (role !== "lead") cleanRow(row)
      updateRow(row, role === "lead" ? partyOf(row) : [row], unread)
      setMore(row, moreOf.get(row))
    }
  }


  // Events

  const openProfile = row => {
    const id = dataOf(row)?.friend?.steamid64
    if (id) location.href = `steam://url/SteamIDPage/${id}`
  }

  // Avatar (own or one of the party's): that friend's profile
  function onAvatarClick(event, target) {
    const row = target.closest(".friend")
    const extra = target.closest(".nk-party-avatars > .avatarHolder")
    const own = target.closest(".avatarHolder")
    if (!row || (!extra && !own)) return false
    event.preventDefault()
    event.stopPropagation()
    const index = extra ? [...extra.parentElement.children].indexOf(extra) + 1 : 0
    openProfile(partyOf(row)[index] || row)
    return true
  }

  function onClick(event) {
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest(ROW) && onAvatarClick(event, target)) return

    const cancel = target?.closest(".nk-friend-wide")
    if (cancel) {
      event.preventDefault()
      event.stopPropagation()
      return onCancelInvite(cancel, cancel.closest(".friend"))
    }

    const pressed = target?.closest(".nk-friend-button")
    const row = pressed?.closest(".friend")
    if (!row) return
    event.preventDefault()
    event.stopPropagation()

    const rows = row.dataset[PARTY_ATTR] === "lead" ? partyOf(row) : [row]
    const { clientX: x, clientY: y } = event

    if (pressed.classList.contains("nk-friend-join")) {
      const joinable = rows.filter(member => isJoinable(dataOf(member)?.friend))
      if (joinable.length > 1) pickFromParty(joinable, pressed, x, y, picked => joinGame(picked, x, y))
      else joinGame(joinable[0] || row, x, y)
    } else if (rows.length > 1) {
      pickFromParty(rows, pressed, x, y, openChat)
    } else {
      openChat(row)
    }
  }

  // Mini profile of the others in a party: their avatars here are copies, Steam knows nothing of them. The cursor
  // over a copy calls what Steam's own avatar of that friend (in the hidden row) does on hover
  const EXTRA_AVATAR = ".nk-party-avatars > .avatarHolder"
  let profileOf = null // { avatar, copy }: whose mini profile is open from a copy

  const propsOf = el => {
    const key = Object.keys(el).find(name => name.startsWith("__reactProps"))
    return key ? el[key] : null
  }
  // What the handler reads from the event: the element to stand beside, and the window
  const hoverEvent = el => ({ currentTarget: el, target: el, view: window, nativeEvent: {}, preventDefault() {}, stopPropagation() {} })

  function hideExtraProfile() {
    if (!profileOf) return
    const { avatar, copy } = profileOf
    profileOf = null
    try { propsOf(avatar)?.onMouseLeave?.(hoverEvent(copy)) } catch { /* the row is gone */ }
  }

  function onExtraHover(event) {
    const target = event.target instanceof Element ? event.target : null
    const copy = target?.closest(EXTRA_AVATAR) || null
    if (event.type === "mouseout") {
      const to = event.relatedTarget instanceof Element ? event.relatedTarget : null
      if (profileOf && !profileOf.copy.contains(to)) hideExtraProfile()
      return
    }
    if (!copy || profileOf?.copy === copy) return
    hideExtraProfile()
    const lead = copy.closest(".friend")
    const member = lead && partyOf(lead)[[...copy.parentElement.children].indexOf(copy) + 1]
    const avatar = member?.querySelector(".avatarHolder")
    if (!avatar) return
    try {
      propsOf(avatar)?.onMouseEnter?.(hoverEvent(copy))
      profileOf = { avatar, copy }
    } catch { /* Steam changed the handler */ }
  }

  // Our buttons are not part of Steam's row: no drag, no row press / double click from them
  function swallowOnButtons(event) {
    if (event.target instanceof Element && event.target.closest(`.${ACTIONS}, .nk-party-avatars, .nk-friend-wide`)) event.stopPropagation()
  }

  // Chat opens by the button now
  function onDoubleClick(event) {
    if (ownEvent) return
    if (event.target instanceof Element && event.target.closest(ROW)) event.stopPropagation()
  }

  // Right click on a party: whose menu?
  function onContextMenu(event) {
    if (ownEvent) return
    const row = event.target instanceof Element && event.target.closest(ROW)
    if (!row || row.dataset[PARTY_ATTR] !== "lead") return
    event.preventDefault()
    event.stopPropagation()
    const { clientX: x, clientY: y } = event
    pickFromParty(partyOf(row), row, x, y, picked => openSteamMenu(picked, x, y), { submenu: true })
  }


  // Start

  function init() {
    document.addEventListener("click", onClick, true) // before React
    document.addEventListener("dblclick", onDoubleClick, true)
    document.addEventListener("contextmenu", onContextMenu, true)
    document.addEventListener("mouseover", onExtraHover)
    document.addEventListener("mouseout", onExtraHover)
    for (const type of ["mousedown", "pointerdown", "dragstart"]) document.addEventListener(type, swallowOnButtons, true)

    let frame = null
    const schedule = () => {
      frame ??= requestAnimationFrame(() => {
        frame = null
        refresh()
      })
    }
    new MutationObserver(records => {
      // class changes: only friend rows (party brackets), not every hover in the window
      const relevant = records.some(record => record.type === "childList" || record.target.classList?.contains("friend"))
      if (relevant) schedule()
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] })

    // Accept Request applies at once: Steam only marks the choice and waits for Confirm, press it for the user
    // (after Steam's own handler; a second press that un-marks the choice does nothing)
    document.addEventListener("click", event => {
      const accept = event.target instanceof Element && event.target.closest(`${LIST} .acceptFriendInvite`)
      if (!accept) return
      // Confirm stays hidden meanwhile (CSS): it would flash for a moment between the two presses
      const root = document.documentElement
      root.classList.add("nk-accepting-invite")
      setTimeout(() => root.classList.remove("nk-accepting-invite"), 1500)
      setTimeout(() => {
        if (!accept.isConnected || accept.classList.contains("dim")) return
        document.querySelector(`${LIST} .confirmInvites:not(.dim)`)?.click()
      }, 0)
    }, true) // capture: the class is set before Steam redraws the buttons

    // List scrolled -> fade at its top (CSS)
    document.addEventListener("scroll", event => {
      const list = event.target
      if (!(list instanceof Element) || !list.matches(LIST)) return
      document.documentElement.classList.toggle("nk-friends-scrolled", list.scrollTop > 0)
    }, true)

    setInterval(refresh, REFRESH_EVERY)
    refresh()
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
