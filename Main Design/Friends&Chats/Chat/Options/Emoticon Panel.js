// Option "Emoticon Side Panel" (styles: Emoticon Panel.css)
// Hover the emoticon button -> Steam's emoticon menu as usual | click -> the same menu stays docked as a side panel
//
// Steam shows one menu at a time: a new menu (of a message, a reaction picker, of the chat) takes the place of the
// one that is open. The docked panel is marked as a menu Steam keeps when another one comes (bRetainOnHide): it
// stays in the page as it is, nothing is built again. It is re-opened only for another chat (the menu belongs to
// the chat it was opened from), and a still copy of it covers that gap

;(() => {
  "use strict"

  const BUTTON = ".chatEntry .EmoticonPickerButton"
  const OURS_ATTR = "data-nk-emoticons" // menu opened by this script (not a reaction picker): styled by Emoticon Panel.css
  const GHOST_ATTR = "data-nk-ghost"    // still copy of the panel: "" covers a re-opening, "parked" waits under another menu
  const MENU = `.contextMenu[${OURS_ATTR}]:not([${GHOST_ATTR}])`
  const OTHER_MENU = `.contextMenu:not([${OURS_ATTR}]):not([${GHOST_ATTR}])`
  const DOCKED_CLASS = "nk-emoticons-docked" // on <html>
  const STORAGE_KEY = "nevko-emoticons-docked"
  const HOVER_CLOSE_MS = 250 // time to move the cursor from the button to the menu
  const SYNC_EVERY = 400
  const EXPECT_MS = 800      // a picker menu that appears this soon after our click is ours

  let docked = localStorage.getItem(STORAGE_KEY) === "1"
  let ownClick = false     // our click on the button: Steam must get it
  let held = null          // { instance, el, parent, button, scroll, emojiScroll }: menu that is kept open
  let parked = null        // { ghost, tab, scroll, emojiScroll }: the panel gave way to another menu
  let hoverOpened = false
  let hoverTimer = null
  let openedAt = 0         // our last click on the button: no second one while the menu is still appearing

  // Width of the docked panel, dragged by its edge (grip from Chat.js)
  const WIDTH_KEY = "nevko-emoticons-width"
  const WIDTH_MIN = 300 // tabs and the window buttons fit in one row
  const WIDTH_MAX = 560
  let panelWidth = Number(localStorage.getItem(WIDTH_KEY)) || 340

  // The chat beside the panel keeps this much. The panel gives way down to its least width; in a window too narrow
  // for both (a chat docked to a narrow friends list) it is not docked at all
  const CHAT_MIN = 300
  function room() {
    const host = document.querySelector(".multiChatDialog")
    // No width yet (the window is still being made, or it is hidden): not known, so nothing is decided by it
    return host?.clientWidth ? host.clientWidth - CHAT_MIN : Infinity
  }
  const hasRoom = () => room() >= WIDTH_MIN

  function applyWidth() {
    const value = `${Math.max(WIDTH_MIN, Math.min(panelWidth, room()))}px`
    const root = document.documentElement
    if (root.style.getPropertyValue("--nk-emoticons-width") !== value) root.style.setProperty("--nk-emoticons-width", value)
  }

  function addGrip() {
    const el = menu()
    if (!el || !window.__nevkoPanelResize) return
    window.__nevkoPanelResize({
      id: "nk-emoticons-resize",
      host: () => el,
      panelSide: () => {
        const rect = el.getBoundingClientRect()
        return rect.left < innerWidth - rect.right ? "left" : "right"
      },
      min: WIDTH_MIN,
      max: WIDTH_MAX,
      apply(width, done) {
        if (width !== null) panelWidth = width
        applyWidth()
        if (done) localStorage.setItem(WIDTH_KEY, String(panelWidth))
      },
    })
  }


  // Menu

  // Button of the chat that is on screen (other chats are display: none)
  const activeButton = () => [...document.querySelectorAll(BUTTON)].find(button => button.offsetParent && !button.disabled)
  const menu = () => [...document.querySelectorAll(MENU)].pop() || null // the newest one

  // Steam's menu manager (taken from the first menu seen): it knows the open menu even when that one is drawn
  // in a window of its own and not in this page
  let manager = null
  const anchorOf = instance => instance?.m_position?.element
  const isOurs = instance => anchorOf(instance) instanceof Element && !!anchorOf(instance).closest(".chatEntry")

  function otherMenuOpen() {
    if (document.querySelector(OTHER_MENU)) return true
    const active = manager?.m_ActiveMenu
    return !!active && active !== held?.instance && !isOurs(active)
  }

  // Steam's menu object: props of the component around the menu element
  function instanceOf(el) {
    const key = Object.keys(el).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && el[key], depth = 0; fiber && depth < 5; fiber = fiber.return, depth++) {
      const instance = fiber.memoizedProps?.instance
      if (typeof instance?.Hide === "function") return instance
    }
    return null
  }

  // force: in place of the menu that is being replaced
  // The menu belongs to the chat whose button was clicked: that button is remembered with it. Chats may be switched
  // again before the menu appears, and a second click on the same button would close the menu instead of opening
  let openedBy = null
  function open(force = false) {
    const button = activeButton()
    if (!button) return null
    if (!force && (menu() || Date.now() - openedAt < 600)) return null
    openedAt = Date.now()
    openedBy = button
    ownClick = true
    try { button.click() } finally { ownClick = false }
    return button
  }

  function close() {
    const el = menu()
    release()
    if (el) instanceOf(el)?.Hide()
  }

  // Docked menu ignores Steam's own "hide" (click outside, emoticon picked, focus lost)
  function keepOpen(el, button) {
    const instance = instanceOf(el)
    if (!instance) return null
    manager ??= instance.m_ContextMenuManager || null
    instance.Hide = () => {}
    instance.ForceHide = () => {}
    retain(instance)
    return { instance, el, parent: el.parentElement, button, scroll: 0, emojiScroll: 0 }
  }

  function hold() {
    const el = menu()
    if (!el || held?.el === el) return
    release()
    held = keepOpen(el, openedBy?.isConnected ? openedBy : activeButton())
  }

  // Steam keeps such a menu drawn when another menu is shown, and drops any other
  function retain(instance) {
    if (instance.m_options && !instance.m_options.bRetainOnHide) instance.m_options.bRetainOnHide = true
  }

  // Back to the methods of the prototype, and no longer kept by Steam: a menu that waits behind another one
  // is not the active one, Steam's own "hide" does not reach it - it is taken out here
  function letGo(kept) {
    const { instance } = kept
    delete instance.Hide
    delete instance.ForceHide
    try {
      if (instance.m_options) instance.m_options.bRetainOnHide = false
      const menus = instance.m_ContextMenuManager
      if (!menus?.m_setHiddenMenus?.has(instance)) return
      instance.m_bVisible = false
      menus.ReleaseHiddenMenu(instance)
      menus.m_callbacksMenusChanged.Dispatch()
    } catch { /* Steam changed its menus: the menu goes when the next one is shown */ }
  }

  function release() {
    if (!held) return
    letGo(held)
    held = null
  }


  // Still Copy

  const tabsOf = el => [...el.querySelectorAll(".Picker > .Tabs > .Tab")]
  const LISTS = [[".Picker > .Content", "scroll"], ["#nk-emoji-pane", "emojiScroll"]]

  // Copy of the panel as it looks now. A removed element has lost its scroll positions: they are tracked while it lives
  function ghostOf(kept, mode) {
    const ghost = kept.el.cloneNode(true)
    ghost.setAttribute(GHOST_ATTR, mode)
    // A copied canvas is empty: the still stickers (Emoji Pack.js) are drawn over again
    const drawn = kept.el.querySelectorAll("canvas")
    ghost.querySelectorAll("canvas").forEach((canvas, index) => {
      try { canvas.getContext("2d").drawImage(drawn[index], 0, 0) } catch { /* nothing drawn there yet */ }
    })
    ghost.querySelector("#nk-emoticons-resize")?.remove()
    return ghost
  }

  function place(ghost, parent, state) {
    parent.append(ghost)
    for (const [selector, key] of LISTS) {
      const list = ghost.querySelector(selector)
      if (list) list.scrollTop = state[key]
    }
  }

  const stateOf = kept => ({
    tab: tabsOf(kept.el).findIndex(tab => tab.classList.contains("Active")),
    scroll: kept.scroll,
    emojiScroll: kept.emojiScroll,
  })

  function onScroll(event) {
    if (!held || !(event.target instanceof Element) || !held.el.contains(event.target)) return
    if (event.target.matches(".Picker > .Content")) held.scroll = event.target.scrollTop
    else if (event.target.id === "nk-emoji-pane") held.emojiScroll = event.target.scrollTop
  }


  // Docked Panel

  // remember: the choice of the user, kept for the next start of Steam. The panel closed for lack of room is not
  // such a choice: it comes back when the room does (it used to be saved as closed - the window is narrow for a
  // moment while Steam starts - and had to be opened by hand after every start)
  let waiting = false // docked by the user, closed for now: no room beside the chat
  function setDocked(value, { remember = true } = {}) {
    docked = value
    if (remember) {
      waiting = false
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0")
    }
    document.documentElement.classList.toggle(DOCKED_CLASS, value)
    hoverOpened = false
    clearTimeout(hoverTimer)
    hoverTimer = null
    if (value) return sync()
    if (swap) endSwap()
    parked?.ghost.remove()
    parked = null
    close()
  }

  // Re-opening (another chat on screen, or back after another menu): the new menu opens faded out and on its first tab.
  // The copy covers the place until the new one stands on the same tab at the same scroll
  const SWAP_STEP = 50
  const SWAP_SETTLE = 120 // the list of the restored tab is drawn
  const SWAP_LIMIT = 1500
  let swap = null // { ghost, button, tab, scroll, emojiScroll, since, tabSet }

  function reopenUnder(ghost, state) {
    ghost.setAttribute(GHOST_ATTR, "") // on top of the menu that comes
    swap = { ghost, ...state, since: Date.now(), tabSet: false }
    swap.button = open(true)
    if (!swap.button) return endSwap()
    setTimeout(stepSwap, SWAP_STEP)
  }

  // The chat on screen changed: Steam's menu belongs to the chat it was opened from (an emoticon would go there)
  function startSwap() {
    const old = held
    held = null
    const state = stateOf(old)
    const ghost = ghostOf(old, "")
    place(ghost, old.parent, state)
    letGo(old) // Steam replaces it itself
    reopenUnder(ghost, state)
  }

  function stepSwap() {
    if (!swap) return
    const fresh = menu()
    const tabs = fresh ? tabsOf(fresh) : []

    if (fresh && tabs.length && !held) held = keepOpen(fresh, swap.button)
    if (held && !swap.tabSet) {
      // Same tab as before (Steam opens on the first one)
      swap.tabSet = true
      const tab = tabs[swap.tab]
      if (tab && !tab.classList.contains("Active")) tab.click()
      return setTimeout(stepSwap, SWAP_SETTLE)
    }
    if (held && swap.tabSet) {
      for (const [selector, key] of LISTS) {
        const list = fresh.querySelector(selector)
        if (list) list.scrollTop = swap[key]
      }
      held.scroll = swap.scroll
      held.emojiScroll = swap.emojiScroll
      // Stickers in view are still loading: the copy stays over them, or they would blink in
      if (!picturesReady(fresh) && Date.now() - swap.since < SWAP_LIMIT) return setTimeout(stepSwap, SWAP_STEP)
      return endSwap()
    }
    if (Date.now() - swap.since > SWAP_LIMIT) return endSwap() // no new menu: the usual pass opens another
    setTimeout(stepSwap, SWAP_STEP)
  }

  // Loaded, and (when stickers stand still, Emoji Pack.js) with their still frames drawn: the copy shows still frames,
  // and the new menu must show the same ones the moment the copy goes
  function picturesReady(el) {
    const view = el.querySelector(".Picker > .Content")?.getBoundingClientRect()
    if (!view) return true
    const still = getComputedStyle(document.documentElement).getPropertyValue("--nk-sticker-motion").trim() !== "always"
    return [...el.querySelectorAll(".StickerButton > img")].every(img => {
      const at = img.parentElement.getBoundingClientRect()
      if (at.bottom < view.top || at.top > view.bottom) return true
      return img.complete && img.naturalWidth > 0 && (!still || img.hasAttribute("data-nk-still"))
    })
  }

  function endSwap() {
    swap.ghost.remove()
    swap = null
    addGrip()
    setTimeout(sync) // chats were switched again meanwhile: the next swap starts at once
  }

  // Another menu (of a message, a reaction picker, ...) took the place of the panel: Steam removed it.
  // The copy stays where the panel was, under that menu; the panel is opened again when that menu is gone -
  // opening it earlier would remove that menu in turn
  function park() {
    const old = held
    held = null
    letGo(old)
    if (!old.parent?.isConnected) return
    const state = stateOf(old)
    // Steam has taken the menu out of the page already: the element itself is put back as the copy. Nothing is built
    // again (a copy of a hundred stickers made the menu that had just opened stutter)
    let ghost = old.el
    if (ghost.isConnected) ghost = ghostOf(old, "parked")
    else {
      ghost.setAttribute(GHOST_ATTR, "parked")
      ghost.querySelector("#nk-emoticons-resize")?.remove()
    }
    place(ghost, old.parent, state)
    parked = { ghost, ...state }
  }

  function unpark() {
    const { ghost, ...state } = parked
    parked = null
    reopenUnder(ghost, state)
  }

  // Keeps the panel alive and tied to the chat on screen
  function sync() {
    if (swap) return
    if (!docked) {
      if (waiting && hasRoom()) {
        waiting = false
        setDocked(true, { remember: false })
      }
      return
    }
    if (!hasRoom()) {
      waiting = true
      return setDocked(false, { remember: false })
    }
    applyWidth()
    const button = activeButton()
    if (!button) return

    if (held && !held.el.isConnected) park() // normally done at once by the observer below
    if (held) retain(held.instance) // Steam makes the options anew when it moves a menu
    if (parked) return otherMenuOpen() ? undefined : unpark()
    if (held && held.button !== button) return startSwap()
    if (!menu()) {
      if (otherMenuOpen()) return // not over somebody else's menu
      open()
    }
    if (!held) hold()
    addGrip()
  }


  // Menus Come and Go

  // Seen before the next frame is drawn: a menu of ours gets its mark (so it never shows unstyled),
  // and the copy takes the place of a removed panel without a gap
  function onMenus(records) {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element) || !node.matches(".contextMenu") || node.hasAttribute(GHOST_ATTR)) continue
        if (!node.querySelector(".Picker")) continue
        // Ours is the one that hangs on the emoticon button of the message field; a reaction picker hangs on a message
        const instance = instanceOf(node)
        manager ??= instance?.m_ContextMenuManager || null
        const ours = instance ? isOurs(instance) : Date.now() - openedAt < EXPECT_MS
        if (ours) node.setAttribute(OURS_ATTR, "")
      }
      for (const node of record.removedNodes) {
        if (docked && !swap && held && node === held.el) park()
      }
    }
    // Another menu has closed: back at once
    if (parked && docked && !swap && !otherMenuOpen()) setTimeout(sync)
  }


  // Events

  function onClick(event) {
    if (ownClick) return
    const button = event.target instanceof Element && event.target.closest(BUTTON)
    if (!button) return
    if (!docked && !hasRoom()) return // no place to dock: Steam's popup as usual
    // Steam would toggle its popup: the click switches the panel instead
    event.preventDefault()
    event.stopImmediatePropagation()
    setDocked(!docked)
  }

  function onHover(event) {
    if (docked || !(event.target instanceof Element)) return
    const overButton = event.target.closest(BUTTON)
    const overMenu = event.target.closest(MENU)

    if (overButton || overMenu) {
      clearTimeout(hoverTimer)
      hoverTimer = null
      if (overButton && !menu() && !otherMenuOpen()) {
        open()
        hoverOpened = true
      }
    } else {
      startHoverClose()
    }
  }

  // Steam closed its menus by a click outside through its layer over the window; that layer is off for this menu
  // (Emoticon Panel.css), so the menu opened by hover is closed here
  function onPress(event) {
    if (docked || !hoverOpened || !(event.target instanceof Element)) return
    if (event.target.closest(BUTTON) || event.target.closest(MENU)) return
    clearTimeout(hoverTimer)
    hoverTimer = null
    hoverOpened = false
    close()
  }

  // Only the menu we opened by hover is closed
  function startHoverClose() {
    if (docked || !hoverOpened || hoverTimer || !menu()) return
    hoverTimer = setTimeout(() => {
      hoverTimer = null
      if (docked) return
      // The cursor is still on the button or the menu (the event came from a redraw elsewhere)
      if (activeButton()?.matches(":hover") || menu()?.matches(":hover")) return
      hoverOpened = false
      close()
    }, HOVER_CLOSE_MS)
  }


  // Start

  function init() {
    new MutationObserver(onMenus).observe(document.body, { childList: true, subtree: true })
    setInterval(sync, SYNC_EVERY)
  }

  document.documentElement.classList.toggle(DOCKED_CLASS, docked)
  applyWidth()
  document.addEventListener("click", onClick, true) // capture: before Steam's handler
  document.addEventListener("mouseover", onHover, true)
  document.addEventListener("mousedown", onPress, true)
  document.addEventListener("scroll", onScroll, true)
  // A chat tab was clicked: no waiting for the timer
  document.addEventListener("click", event => {
    if (docked && event.target instanceof Element && event.target.closest(".ChatTabs .ChatTab")) setTimeout(sync, 30)
  }, true)
  document.documentElement.addEventListener("mouseleave", startHoverClose)
  addEventListener("resize", applyWidth)

  document.body
    ? init()
    : document.addEventListener("DOMContentLoaded", init, { once: true })
})()
