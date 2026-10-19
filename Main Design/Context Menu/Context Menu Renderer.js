// Context menus inside the page instead of separate popup windows | Patches Steam in SharedJSContext (window.opener)

;(() => {
  "use strict"

  const MIN_WINDOW_WIDTH = 400 // same limit Steam uses for in-page menus

  const shared = window.opener
  if (!shared?.webpackChunksteamui || shared.__nkInlineMenus) return

  // Webpack require of SharedJSContext
  function getRequire() {
    let req
    try { shared.webpackChunksteamui.push([[Symbol("nk-menus")], {}, r => { req = r }]) } catch {}
    return req
  }

  // Find a class by module source + own prototype methods (module ids change with updates)
  function findClass(req, needle, methods) {
    for (const [id, factory] of Object.entries(req.m)) {
      if (!factory.toString().includes(needle)) continue
      let exports
      try { exports = req(id) } catch { continue }
      for (const value of Object.values(exports || {})) {
        if (typeof value !== "function" || !value.prototype) continue
        const names = Object.getOwnPropertyNames(value.prototype)
        if (methods.every(name => names.includes(name))) return value
      }
    }
    return null
  }

  // Class names of all BrowserViewHost elements (hashed, differ per module) -> one selector
  function browserHostSelector(req) {
    const classes = new Set()
    for (const [id, factory] of Object.entries(req.m)) {
      if (!factory.toString().includes("BrowserViewHost:")) continue
      try {
        const name = req(id)?.BrowserViewHost
        if (typeof name === "string") name.split(" ").forEach(c => c && classes.add(c))
      } catch {}
    }
    // + main window store / community page: div.Browser inside div.BrowserWrapper
    return [".BrowserWrapper .Browser", ...[...classes].map(c => "." + CSS.escape(c))].join(",")
  }

  function ownerWindow(instance) {
    return instance.m_position?.element?.ownerDocument?.defaultView
  }

  // Main window only (friends / chat windows are small: in-page menus get cut and flip), not standalone.
  // Another window may ask for one menu of its own in its page (the chat's "more" menu, Chat.js): a window of
  // its own takes Steam about half a second to make. Asked for by shared.__nkInlineNext = that window, while it shows the menu
  const asked = instance => !!(instance.__nkInlineAsked || instance.m_parentInstance?.__nkInlineAsked)
  // Option "Menu Rendering: Popup Windows" (Popup Menus.css): Steam's own windows. Read on every show: the setting may change
  const popupsChosen = () => getComputedStyle(document.documentElement).getPropertyValue("--nk-menus-popup").trim() === "on"
  function canInline(instance) {
    if (popupsChosen()) return false
    const options = instance.m_options
    if (!options?.bForcePopup || options.bStandalone || options.bScreenCoordinates) return false
    // Header menus ("Steam Root Menu" ...): plugins wait for their windows by title and add items there
    if (/Root Menu$/.test(options.title || "")) return false
    const win = ownerWindow(instance)
    return !!win && (win === window || asked(instance)) && win.innerWidth >= MIN_WINDOW_WIDTH
  }

  function patch() {
    const req = getRequire()
    if (!req?.m) return
    const Manager = findClass(req, "CreateContextMenuInstance", ["CreateContextMenuInstance", "ShowMenu", "ReleaseHiddenMenu"])
    const Instance = findClass(req, "ShowSubMenu", ["Show", "BIsSubMenu"])
    const Base = Instance && Object.getPrototypeOf(Instance.prototype)
    const getOptions = Base && Object.getOwnPropertyDescriptor(Base, "options")?.get
    if (!Manager || !getOptions) return

    // options.bForcePopup -> false for menus we render in the page
    // No retain: in-page menu takes focus only on mount, and closes on blur (outside click)
    // Mouse overlay stays as Steam set it: over the header tabs it closes hover menus at once
    const copies = new WeakMap()
    Object.defineProperty(Base, "options", {
      configurable: true,
      get() {
        const options = getOptions.call(this)
        if (!this.__nkInline || !canInline(this)) return options
        let copy = copies.get(options)
        if (!copy) {
          copy = { ...options, bForcePopup: false, bRetainOnHide: false }
          copies.set(options, copy)
        }
        return copy
      },
    })

    // Store / community pages are a native browser view drawn above the page: menus under it are hidden
    const browserHosts = browserHostSelector(req)
    const webViewVisible = win => !!browserHosts && [...win.document.querySelectorAll(browserHosts)]
      .some(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })

    // Decided on every real show: in the page, or popup while a web page is open
    // (Steam never hides pre-created bCreateHidden menus in the page, so not before the first show)
    // Mode changed -> new key, React remounts the menu
    const showMenu = Manager.prototype.ShowMenu
    Manager.prototype.ShowMenu = function (instance) {
      try {
        const sub = instance.BIsSubMenu()
        if (!sub && shared.__nkInlineNext && shared.__nkInlineNext === ownerWindow(instance)) instance.__nkInlineAsked = true
        const inline = canInline(instance)
          && (sub ? !!instance.m_parentInstance?.__nkInline : !webViewVisible(ownerWindow(instance)))
        if (!!instance.__nkInline !== inline) {
          instance.__nkInline = inline
          if (!sub) instance.m_nKey = null
        }
        if (inline && !sub) watchWebView(instance)
        // Not for a menu that is on screen already (Steam shows it again when its size changes): that would blink
        if (!inline && !instance.__nkTooltip && !instance.visible) replayPopupAnimation(instance)
      } catch {}
      return showMenu.call(this, instance)
    }

    // Popup window: content is rendered (and animated) while the window is still hidden,
    // retained windows are just shown again -> restart the open animation
    // Reset to the start frame before the window shows (restarting a menu already on screen = blink),
    // play on the window's first frame (no frames while it is hidden)
    function replayPopupAnimation(instance) {
      let tries = 0
      const run = first => {
        if ((!first && !instance.visible) || ++tries > 40) return
        const popup = instance.m_popupContextMenu
        const doc = popup?.root_element?.ownerDocument || popup?.window?.document || instance.m_element?.ownerDocument
        const el = doc?.querySelector("._2EstNjFIIZm_WUSKm5Wt7n")
        const win = doc?.defaultView
        if (!el || !win) return setTimeout(run, 16)
        const animation = el.getAnimations?.().find(a => a.animationName === "nk-menu-in")
        if (!animation) return
        if (animation.playState === "running" && animation.currentTime < 40) return // just started on screen
        animation.pause()
        animation.currentTime = 0
        win.requestAnimationFrame(() => animation.play())
        setTimeout(() => { if (animation.playState === "paused") animation.play() }, 300) // never stay invisible
      }
      run(true) // still hidden here: ShowMenu runs after
    }

    // Menu item opened a store / profile page: the in-page menu stays open under it -> close it
    function watchWebView(instance) {
      clearInterval(instance.__nkWebWatch)
      instance.__nkWebWatch = setInterval(() => {
        if (!instance.visible || !instance.__nkInline) return clearInterval(instance.__nkWebWatch)
        if (!webViewVisible(ownerWindow(instance))) return
        clearInterval(instance.__nkWebWatch)
        try { instance.Hide() } catch {}
      }, 200)
    }

    patchPopupPosition(req)

    // Fast moves over submenu items: the menu loses focus for a moment and Steam closes it
    // (overlay windows lose focus even more often). Cursor over the menu -> keep it
    const menuHovered = instance => {
      const el = instance.m_element || instance.m_popupContextMenu?.root_element
      return !!el?.ownerDocument?.querySelector(".PP7LM0Ow1K5qkR8WElLpt:hover")
    }

    const hideIfNotInFocus = Base.HideIfNotInFocus
    if (hideIfNotInFocus) {
      Base.HideIfNotInFocus = function () {
        if (menuHovered(this)) return
        return hideIfNotInFocus.call(this)
      }
    }

    // Submenu opened / closed: remember when (the focus flicker comes right after it)
    for (const name of ["ShowSubMenu", "InternalHideSubMenu"]) {
      const original = Base[name]
      if (!original) continue
      Base[name] = function (...args) {
        this.__nkSubmenuAt = performance.now()
        return original.apply(this, args)
      }
    }

    // OnCancel from a blur (focusout) right after a submenu change, cursor over the menu -> skip
    // A click that navigates (focus leaves for real) still closes it, Escape too. Refocus so an outside click closes it later
    const onCancel = Base.OnCancel
    if (onCancel) {
      Base.OnCancel = function (...args) {
        try {
          const type = (shared.event || window.event)?.type
          const submenuJustChanged = performance.now() - (this.__nkSubmenuAt || 0) < 400
          if ((type === "focusout" || type === "blur") && submenuJustChanged && menuHovered(this)) {
            setTimeout(() => { if (this.visible) this.TakeFocus() }, 0)
            return
          }
        } catch {}
        return onCancel.apply(this, args)
      }
    }

    shared.__nkInlineMenus = true
  }

  // Popup menu with no room below: Steam puts it fully above the cursor -> center it on the cursor instead
  function centerVertically(menu, state) {
    const options = menu.props?.options
    const win = menu.parentWin
    let y = menu.props?.clientY
    if (!menu.props?.popup || !options || options.bOverlapVertical || !win || y === undefined) return
    if (state.menuTop === undefined || state.menuHeight === undefined) return
    if (!options.bScreenCoordinates) y += win.screenTop
    const height = state.menuHeight
    if (Math.abs(state.menuTop + height - y) > 2) return // opened below, keep
    const top = options.targetMonitor?.nScreenTop ?? win.screen.availTop ?? 0
    const screenHeight = options.targetMonitor?.nScreenHeight ?? win.screen.availHeight
    state.menuTop = Math.round(Math.max(top + 4, Math.min(y - height / 2, top + screenHeight - height - 4)))
  }

  function patchPopupPosition(req) {
    const Menu = findClass(req, "PositionPopupWindow", ["PositionMenu", "PositionPopupWindow"])
    if (!Menu) return
    const position = Menu.prototype.PositionMenu
    Menu.prototype.PositionMenu = function (...args) {
      const setState = this.setState
      this.setState = state => {
        try { centerVertically(this, state) } catch {}
        // Steam compares with its own numbers: same position after centering -> no update (no render loop)
        const current = this.state || {}
        if (Object.keys(state).every(key => state[key] === current[key])) return
        return setState.call(this, state)
      }
      try { return position.apply(this, args) }
      finally { delete this.setState }
    }
  }

  try { patch() } catch {}
})()
