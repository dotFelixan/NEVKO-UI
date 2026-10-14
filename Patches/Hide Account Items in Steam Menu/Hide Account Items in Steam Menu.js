// Steam menu: hide Change Account / Sign Out / Go Offline (Go Online), View menu: hide Small Mode
// Menus of the friends window (of a friend, of a chat): hide Send Message / Start Voice Chat - the theme has
// its own buttons for both (the chat button of a friend's row, the call button of the chat header)
// Matched by localization token, any language

;(() => {
  "use strict"

  const TOKENS = ["#Menu_ChangeAccount", "#Menu_SignOut", "#Menu_GoOffline", "#Menu_GoOnline", "#Menu_SmallMode"]
  // Only in menus opened from the friends window: elsewhere (friends who play a game, in the library) there are no such buttons
  const FRIENDS_TOKENS = ["#Friend_Menu_SendMessage", "#Friend_Menu_StartVoiceChat"]
  const MENU = "._2EstNjFIIZm_WUSKm5Wt7n"
  const ACCOUNT_MENU = ".HoGkIKTQnkTEFGjqO-GMl" // has its own Change Account / Sign Out: keep
  const ITEM = "._1n7Wloe5jZ6fSuvV18NNWI"
  const SEPARATOR = "._21GPYlKBCLsHQpTsHw_RL_, .WUOrULWKkGLl3ZUQdDXg8, .IjIBR_wDDi2N77Oz4KAT4"

  let labels = null
  let friendsLabels = null

  // Texts in the current language (Steam's own strings)
  function localized(tokens) {
    const manager = window.LocalizationManager || window.opener?.LocalizationManager
    const localize = token => {
      try { return manager?.LocalizeString(token) } catch {}
      try { return window.LocalizeString?.(token) || window.opener?.LocalizeString?.(token) } catch {}
    }
    return new Set(tokens.map(localize).filter(text => text && !text.startsWith("#")).map(text => text.trim()))
  }

  // A menu may be drawn in a window of its own: where it was opened from is kept by Steam's menu object
  // (the element the menu hangs on), found above the menu element
  function fromFriendsWindow(menu) {
    let doc = document
    try {
      const key = Object.keys(menu).find(name => name.startsWith("__reactFiber"))
      for (let fiber = key && menu[key], depth = 0; fiber && depth < 12; fiber = fiber.return, depth++) {
        let instance = fiber.memoizedProps?.instance
        if (!instance) continue
        // A submenu hangs on an item of its parent menu (drawn in a window of its own): the top menu says where it all began
        for (let i = 0; instance.m_parentInstance && i < 8; i++) instance = instance.m_parentInstance
        const anchor = instance.m_position?.element
        if (anchor?.ownerDocument) { doc = anchor.ownerDocument; break }
      }
    } catch { /* Steam changed its menus: the page the menu is in */ }
    return doc.documentElement.classList.contains("friendsui-container")
  }

  function getLabels(menu) {
    if (!labels?.size) labels = localized(TOKENS)
    if (!fromFriendsWindow(menu)) return labels
    if (!friendsLabels?.size) friendsLabels = localized(FRIENDS_TOKENS)
    return new Set([...labels, ...friendsLabels])
  }

  const hide = el => {
    if (el.style.getPropertyValue("display") !== "none") el.style.setProperty("display", "none", "important")
  }

  function clean(menu) {
    const texts = getLabels(menu)
    if (!texts.size) return
    const kids = [...menu.children]
    const hidden = kids.filter(el => el.matches(ITEM) && texts.has(el.textContent.trim()))
    if (!hidden.length) return
    hidden.forEach(hide)

    // Separator left with only hidden items above it (start of menu or another separator) -> hide too
    let onlyHidden = true
    for (const el of kids) {
      if (el.matches(SEPARATOR)) {
        if (onlyHidden) hide(el)
        onlyHidden = true
      } else if (el.style.getPropertyValue("display") !== "none") onlyHidden = false
    }
    markGroups(kids)
  }

  // Group corners: hidden items break the CSS "separator + item" selectors -> mark first / last visible
  function markGroups(kids) {
    const isHidden = el => el.style.getPropertyValue("display") === "none"
    let group = []
    const groups = [group]
    for (const el of kids) {
      if (el.matches(SEPARATOR)) groups.push(group = [])
      else if (el.matches(ITEM) && !isHidden(el)) group.push(el)
    }
    for (const el of kids) {
      const items = groups.find(g => g.includes(el))
      // toggle with force: no change -> no mutation
      el.classList.toggle("nk-group-first", !!items && items[0] === el)
      el.classList.toggle("nk-group-last", !!items && items[items.length - 1] === el)
    }
  }

  function scan() {
    for (const menu of document.querySelectorAll(MENU)) if (!menu.closest(ACCOUNT_MENU)) clean(menu)
  }

  // Before paint (popup windows are hidden while rendering: no animation frames there)
  let queued = false
  new MutationObserver(() => {
    if (queued) return
    queued = true
    queueMicrotask(() => { queued = false; scan() })
  }).observe(document.documentElement, { childList: true, subtree: true })

  scan()
})()
