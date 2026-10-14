// Button press animation: shrink while pressed, spring back | Web Animations + scale

;(() => {
  "use strict"

  const QUICK_TILE = ".quickAccessFriends > .favoriteElement"
  const MENU_ITEM = "._2EstNjFIIZm_WUSKm5Wt7n ._1n7Wloe5jZ6fSuvV18NNWI:not(.ContextMenuAction, .disabled, .d8GPmAyQdRQwoHiPbc8Js)"

  // Buttons
  const BUTTONS = [
    // Header
    "._7AlhCx3XGzBeIrQaCneUD",   // tabs
    "._2UyOBeiSdBayaFdRa39N2O",  // Steam, View, Friends, Games, Help
    "._3yD46y5pd3zOGR7CzKs0mC",  // account
    ".RtSv39ZoBOySnb8XQ5hJf",    // icon buttons
    "._3LKQ3S_yqrebeNLF6aeiog",
    "._5wILZhsLODVwGfcJ0hKmJ",
    "._13vrqU6oOqmmxrsZSW5O39",  // family view
    "._3arz-hc3FJ0QKXLPRUSaah",
    "._1TdaAqMFadi0UTqilrkelR",  // compact buttons
    "._2foCkpRXhqq0UGVE50BWqj",
    "._2EQ7ghgqIdjKv9jsQC0Zq9",  // downloads
    "#nk-custom-btn",            // Steam Modes
    ".title-area-icon",          // window buttons
    // Friends
    "#nk-nodrag-hole :is(.friendRequestButton, .addFriendButton)",
    ".chatWindow .inviteAnotherFriendButton, #nk-chat-call:not(.Disabled), #nk-chat-more", // chat: invite a friend, call, menu
    ".ChatTabs > .chatTabOpenFriendsList", // docked chat: open the folded friends list
    ".Picker .Tabs > .Tab",      // emoticon menu: its tabs
    "#nk-emoji-packs > button",  // emoticon menu: Steam / Emoji
    ".Picker .ItemList > .Item", // emoticon menu: emoticons
    ".Picker .StickerButton",    // emoticon menu: stickers
    "#nk-emoji-pane .nk-emoji",  // emoticon menu: emoji
    ".currentUserContainer .AvatarAndUser", // nickname plate
    ".socialTabContainer > .friendTab:not(#recent-chats-tab-host, #nk-chats-tab) > .tabLabel", // Friends tab
    ".socialTabContainer > :is(#recent-chats-tab-host, #nk-chats-tab)", // Chats tab (plugin / placeholder)
    ".rcp-toolbar .rcp-refresh", // Chats refresh
    ".rcp-row",                  // Chats: a chat in the list
    ".FriendsListChatSection .ChatRoomListGroupItem_header", // Chats: a group chat
    ".nk-friend-button",         // friend row: chat / join
    // Chat
    ".chatEntry .chatSubmitButton:not(.disabled)", // attach, send, emoticons
    ".chatWindow .msg > .Addons > *",              // message buttons: reply, reaction, more
    ".chatWindow .MessageReaction",                // reaction under a message
    ".chatWindow .ScrollToBottomButton",           // scroll to the last message
    ".chatWindow .msg[data-nk-effect] .RoomEffectContainer button", // play the effect again
    "#nk-reply-bar .nk-reply-cancel",              // cancel the reply
    ".nk-bg-button, .nk-bg-tile, .nk-bg-fit",      // chat background window
    ".nk-qa-nav",                // Quick Access arrows
    QUICK_TILE,                  // Quick Access tiles (+ name)
    // Settings
    ".nevko-boosty-btn",
    ".nk-reset",
    // Context Menu
    MENU_ITEM,                   // context menu items
    ".ContextMenuAction:not(.disabled)", // menu action button (Install)
  ].join(",")

  // Tooltips (don't shrink)
  const TOOLTIPS = [
    "._3OhUxFVlQYr9W5ThxstR8k", // compact buttons
    ".nk-custom-btn-tip",       // Steam Modes
    "._2FxbHJzYoH024ko7zqcJOf", // Steam tooltips
  ].join(",")

  const PRESSED_SCALE = 0.96
  const PRESS_MS = 60
  const RELEASE_MS = 160
  const SPRING = "cubic-bezier(.2, .7, .3, 1.4)" // spring

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)")
  let pressed = null // [{ element, property, cleanup, animation }]

  // Tooltip: known class or absolute/fixed element outside the button
  function isTooltip(element, box) {
    if (element.matches(TOOLTIPS)) return true
    const position = getComputedStyle(element).position
    if (position !== "absolute" && position !== "fixed") return false
    const r = element.getBoundingClientRect()
    if (!r.width || !r.height) return false
    return r.top >= box.bottom - 1 || r.bottom <= box.top + 1 || r.left >= box.right - 1 || r.right <= box.left + 1
  }

  // Button with tooltip: shrink a background fill instead of the button
  const SIZE_VAR = "--nk-press-size"
  const BG_CSS = `
    @property ${SIZE_VAR} {
      syntax: "<percentage>";
      inherits: false;
      initial-value: 100%;
    }`
  // Transitions off (no flicker)
  const BG_PROPERTIES = ["transition", "background-color", "background-image", "background-size", "background-position", "background-repeat"]

  function ensureStyle(doc) {
    if (doc.getElementById("nk-button-press-style")) return
    const style = doc.createElement("style")
    style.id = "nk-button-press-style"
    style.textContent = BG_CSS
    ;(doc.head || doc.documentElement).append(style)
  }

  function hasBackground(button) {
    const style = getComputedStyle(button)
    const bg = style.backgroundColor
    return style.backgroundImage === "none" && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"
  }

  // Rounded fill (SVG), radius in px
  function cornerRadius(button, style) {
    const value = style.borderTopLeftRadius.split(" ")[0]
    const number = parseFloat(value) || 0
    if (!value.endsWith("%")) return number
    return (Math.min(button.offsetWidth, button.offsetHeight) * number) / 100
  }

  function roundedFill(color, radius) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" rx="${radius}" fill="${color}"/></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }

  // button -> restore background
  const pendingRestore = new WeakMap()

  function moveBackground(button) {
    // Pressed again, restore first
    pendingRestore.get(button)?.()
    ensureStyle(button.ownerDocument)

    const style = getComputedStyle(button)
    const color = style.backgroundColor
    const saved = BG_PROPERTIES.map(name => [name, button.style.getPropertyValue(name), button.style.getPropertyPriority(name)])
    const set = (name, value) => button.style.setProperty(name, value, "important")
    set("transition", "none")
    set("background-color", "transparent")
    set("background-image", roundedFill(color, cornerRadius(button, style)))
    set("background-size", `var(${SIZE_VAR}) var(${SIZE_VAR})`)
    set("background-position", "center")
    set("background-repeat", "no-repeat")

    const restore = () => {
      if (pendingRestore.get(button) !== restore) return
      pendingRestore.delete(button)
      // Background first, then transitions
      const [transition, ...background] = saved
      for (const [name, value, priority] of background) {
        if (value) button.style.setProperty(name, value, priority)
        else button.style.removeProperty(name)
      }
      void getComputedStyle(button).backgroundColor // apply before transitions
      const [name, value, priority] = transition
      if (value) button.style.setProperty(name, value, priority)
      else button.style.removeProperty(name)
    }
    pendingRestore.set(button, restore)
    return restore
  }

  // ::after tooltip (Requests / Add Friend)
  function hasPseudoTooltip(button) {
    const after = getComputedStyle(button, "::after")
    // Empty ::after = hover layer
    const empty = after.content === "none" || after.content === "normal" || after.content === '""'
    return !empty && (after.position === "absolute" || after.position === "fixed")
  }

  // No tooltip -> button | Tooltip -> content around it
  function targets(button) {
    const box = button.getBoundingClientRect()
    const tips = [...button.querySelectorAll("*")].filter(el => isTooltip(el, box))
    if (!tips.length && !hasPseudoTooltip(button)) return [{ element: button }]

    const result = []
    if (hasBackground(button)) {
      result.push({ element: button, property: SIZE_VAR, cleanup: moveBackground(button) })
    }
    // Shrink to button center as one
    const cx = box.left + box.width / 2
    const cy = box.top + box.height / 2
    const collect = parent => {
      for (const child of parent.children) {
        if (tips.includes(child)) continue
        if (tips.some(tip => child.contains(tip))) collect(child)
        else result.push({ element: child, cleanup: originToward(child, cx, cy) })
      }
    }
    collect(button)
    return result
  }

  // Temporary transform-origin
  const pendingOrigin = new WeakMap()

  // transition: all -> off while pressed
  function setOrigin(element, origin) {
    pendingOrigin.get(element)?.()
    const names = ["transform-origin"]
    const transitions = getComputedStyle(element).transitionProperty.split(",").map(name => name.trim())
    if (transitions.includes("all") || transitions.includes("transform-origin")) names.push("transition")
    const saved = names.map(name => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)])

    if (names.includes("transition")) element.style.setProperty("transition", "none", "important")
    element.style.setProperty("transform-origin", origin, "important")
    const cleanup = () => {
      if (pendingOrigin.get(element) !== cleanup) return
      pendingOrigin.delete(element)
      // Origin first, then transitions
      for (const [name, value, priority] of saved) {
        if (value) element.style.setProperty(name, value, priority)
        else element.style.removeProperty(name)
        if (name === "transform-origin") void getComputedStyle(element).transformOrigin
      }
    }
    pendingOrigin.set(element, cleanup)
    return cleanup
  }

  // Center origin (unless own scale / rotate)
  function centerOrigin(element) {
    const style = getComputedStyle(element)
    const matrix = style.transform === "none" ? null : new DOMMatrixReadOnly(style.transform)
    if (matrix && !(matrix.a === 1 && matrix.b === 0 && matrix.c === 0 && matrix.d === 1)) return null
    if (style.transformOrigin === `${element.offsetWidth / 2}px ${element.offsetHeight / 2}px`) return null
    return setOrigin(element, "50% 50%")
  }

  // Origin = screen point, minus translate
  function originToward(element, x, y) {
    const style = getComputedStyle(element)
    const matrix = style.transform === "none" ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(style.transform)
    if (!(matrix.a === 1 && matrix.b === 0 && matrix.c === 0 && matrix.d === 1)) return null
    const r = element.getBoundingClientRect()
    return setOrigin(element, `${x - (r.left - matrix.e)}px ${y - (r.top - matrix.f)}px`)
  }

  // Quick Access name shrinks with tile
  function companions(button) {
    if (!button.matches(QUICK_TILE)) return []
    const name = button.nextElementSibling
    if (!name?.matches(".playerNameQuickAccessContainer")) return []

    const box = button.getBoundingClientRect()
    const cx = box.left + box.width / 2
    const cy = box.top + box.height / 2
    return [...name.children].map(element => ({ element, cleanup: originToward(element, cx, cy) }))
  }

  // scale = number, fill = %
  const pressedFrom = (property, value) => (property === "scale" ? value : `${value * 100}%`)

  function press(event) {
    if (event.button !== 0 || reduceMotion.matches) return
    const button = event.target instanceof Element && event.target.closest(BUTTONS)
    if (!button || button.matches(":disabled")) return

    release()
    const list = targets(button).map(target => (target.cleanup ? target : { ...target, cleanup: centerOrigin(target.element) }))
    pressed = [...list, ...companions(button)].map(({ element, property = "scale", cleanup }) => ({
      element,
      property,
      cleanup,
      animation: element.animate(
        [{ [property]: pressedFrom(property, 1) }, { [property]: pressedFrom(property, PRESSED_SCALE) }],
        { duration: PRESS_MS, easing: "ease-out", fill: "forwards" },
      ),
    }))
  }

  function release() {
    if (!pressed) return
    const list = pressed
    pressed = null

    // From current point
    for (const { element, property, cleanup, animation } of list) {
      const current = getComputedStyle(element).getPropertyValue(property).trim()
      animation.cancel()
      if (!current || current === "none") {
        cleanup?.()
        continue
      }
      const back = element.animate(
        [{ [property]: current }, { [property]: pressedFrom(property, 1) }],
        { duration: RELEASE_MS, easing: SPRING },
      )
      // Restore background after fill is back
      if (cleanup) back.addEventListener("finish", cleanup, { once: true })
    }
  }

  document.addEventListener("pointerdown", press, true)
  for (const type of ["pointerup", "pointercancel", "dragstart"]) {
    document.addEventListener(type, release, true)
  }
  window.addEventListener("blur", release)
})()
