// Tooltips above web pages: a copy in a separate Steam popup window | Store / community pages cover in-page tooltips

;(() => {
  "use strict"

  const shared = window.opener
  if (!shared) return

  // Theme tooltips shown by :hover of their button
  const LABEL_HOSTS = "._1TdaAqMFadi0UTqilrkelR, ._2foCkpRXhqq0UGVE50BWqj, #nk-custom-btn"
  const LABELS = "._3OhUxFVlQYr9W5ThxstR8k, .nk-custom-btn-tip"

  const STYLE_PROPS = [
    "background-color", "background-image", "color", "font-family", "font-size", "font-weight", "font-style",
    "line-height", "letter-spacing", "text-transform", "text-align", "white-space", "padding", "border",
    "border-radius", "box-shadow", "display", "flex-direction", "align-items", "justify-content", "gap",
    "width", "height", "max-width", "fill", "stroke",
  ]

  // Webpack (looked up on first tooltip: at startup SP_REACT / modules may not be ready yet)

  let req
  let deps = null

  let lastTry = 0

  function getDeps() {
    if (deps) return deps
    if (performance.now() - lastTry < 2000) return null // module search is heavy: retry every 2s max
    lastTry = performance.now()
    const React = shared.SP_REACT
    if (!React || !shared.webpackChunksteamui) return null
    if (!req) try { shared.webpackChunksteamui.push([[Symbol("nk-tooltips")], {}, r => { req = r }]) } catch {}
    if (!req?.m) return null
    const registry = Object.values(findExports("GetContextMenuManagerFromWindow",
      e => Object.values(e).some(v => v?.GetContextMenuManager)) || {}).find(v => v?.GetContextMenuManager)
    if (!registry) return null
    deps = {
      React,
      registry,
      steamTooltips: [...classesOf("TextToolTip"), ...classesOf("ToolTipCustom")].join(","),
      webViews: [".BrowserWrapper .Browser", ...classesOf("BrowserViewHost")].join(","),
    }
    return deps
  }

  function findExports(needle, test) {
    for (const [id, factory] of Object.entries(req.m)) {
      if (!factory.toString().includes(needle)) continue
      let exports
      try { exports = req(id) } catch { continue }
      if (exports && test(exports)) return exports
    }
    return null
  }

  function classesOf(key) {
    const classes = new Set()
    for (const [id, factory] of Object.entries(req.m)) {
      if (!factory.toString().includes(key + ":")) continue
      try {
        const name = req(id)?.[key]
        if (typeof name === "string") name.split(" ").forEach(c => c && classes.add(c))
      } catch {}
    }
    return [...classes].map(c => "." + CSS.escape(c))
  }

  // Web View

  function webViewRects(webViews) {
    return [...document.querySelectorAll(webViews)]
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0)
  }

  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

  // Copy

  function inlineStyles(source, copy) {
    const style = getComputedStyle(source)
    for (const prop of STYLE_PROPS) copy.style.setProperty(prop, style.getPropertyValue(prop))
    const sourceKids = source.children
    const copyKids = copy.children
    for (let i = 0; i < sourceKids.length && i < copyKids.length; i++) inlineStyles(sourceKids[i], copyKids[i])
  }

  function makeCopy(tip, rect) {
    const copy = tip.cloneNode(true)
    inlineStyles(tip, copy)
    copy.removeAttribute("id")
    Object.assign(copy.style, {
      position: "static", margin: "0", transform: "none", opacity: "1", visibility: "visible",
      transition: "none", animation: "none", boxSizing: "border-box",
      width: rect.width + "px", height: rect.height + "px",
    })
    return copy.outerHTML
  }

  // Popup: a window per tooltip, created once and kept hidden (a new window on every hover lags)
  // Steam positions a menu window only when it becomes visible, so one shared window can't jump between tooltips

  // Small journal for diagnostics: window.__nkTooltipLog (last 60)
  const journal = window.__nkTooltipLog = []
  const log = (...parts) => { journal.push(new Date().toISOString().slice(14, 23) + " " + parts.join(" ")); if (journal.length > 60) journal.shift() }
  const nameOf = tip => JSON.stringify(tip.textContent.trim().slice(0, 30))

  const MAX_POPUPS = 12
  const shown = new Map() // tooltip -> { visibility, popup }
  const popups = new Map() // key (class + text) -> { instance, holder, manager }

  function getPopup(d, manager, key, x, y) {
    const cached = popups.get(key)
    if (cached?.manager === manager) return cached
    if (popups.size >= MAX_POPUPS) dropOldest()
    const holder = { el: null, html: "" }
    const element = d.React.createElement("div", {
      className: "nk-tooltip-popup",
      ref: el => { holder.el = el; if (el) el.innerHTML = holder.html },
    })
    const instance = manager.CreateContextMenuInstance(element, document.documentElement, x, y, {
      bScreenCoordinates: true, bForcePopup: true, bNoFocusWhenShown: true, bSkipFocusWhenReady: true,
      bDisableMouseOverlay: true, bAlwaysOnTop: true, bRetainOnHide: true, title: "NEVKO Tooltip",
      strClassName: "nk-tooltip-popup-window", // instead of Steam's menu class: no frame / background
    })
    instance.__nkTooltip = true
    // Steam re-shows a hidden (retained) window in TakeFocus: bring it to front without forcing OS focus
    // (k_EWindowBringToFrontWithoutForcingOS = 2, as Steam does for bNoFocusWhenShown menus)
    instance.TakeFocus = () => { try { instance.m_popupContextMenu?.Focus(2) } catch {} }
    const popup = { instance, holder, manager }
    // Steam hid the copy itself (another menu / tooltip shown) -> bring its original back
    instance.SetOnHideCallback(() => {
      for (const [tip, entry] of [...shown]) if (entry.popup === popup) { log("hidden by Steam", nameOf(tip)); restore(tip) }
    })
    popups.set(key, popup)
    return popup
  }

  function dropOldest() {
    const [key, popup] = popups.entries().next().value
    popups.delete(key)
    try {
      popup.instance.Hide()
      popup.manager.ReleaseHiddenMenu(popup.instance) // unmount -> Steam closes its window
      popup.manager.OnMenusChanged.Dispatch()
    } catch {}
  }

  // Returns why the tooltip was not moved (or "" when shown)
  function show(tip) {
    if (shown.has(tip)) return "already shown"
    if (!tip.isConnected) return "gone"
    // Badge tooltip has priority
    if (tip !== badgeTip() && document.documentElement.classList.contains("nevko-badge-hover")) return "badge tooltip shown"
    const d = getDeps()
    if (!d) return "no deps"
    const rect = tip.getBoundingClientRect()
    if (!rect.width || !rect.height) return "zero size"
    if (!webViewRects(d.webViews).some(web => overlaps(rect, web))) return "not over web page"

    let manager
    try { manager = d.registry.GetContextMenuManager(window) } catch (e) { return "no manager: " + e.message }
    // Steam shows one menu at a time: a real menu is open -> leave the tooltip as is (don't close the menu)
    if (manager.ActiveMenu && !manager.ActiveMenu.__nkTooltip) return "menu open: " + (manager.ActiveMenu.m_options?.title || "?")
    const html = makeCopy(tip, rect)
    const key = (tip.className + "|" + tip.textContent.trim()).slice(0, 200)
    const x = window.screenX + rect.left
    const y = window.screenY + rect.top
    let popup
    try {
      popup = getPopup(d, manager, key, x, y)
      const { instance, holder } = popup
      holder.html = html
      if (holder.el) {
        holder.el.innerHTML = html
        holder.el.style.animation = "none" // replay fade in
        void holder.el.offsetWidth
        holder.el.style.removeProperty("animation")
      }
      instance.SetPosition(x, y, {})
      instance.Show() // another tooltip's window is hidden by Steam (one menu at a time)
    } catch (e) { return "error: " + e.message }

    shown.set(tip, { visibility: tip.style.getPropertyValue("visibility"), popup })
    tip.style.setProperty("visibility", "hidden", "important")
    log("shown", nameOf(tip), popup.holder.el ? "(reused window)" : "(new window)")
    return ""
  }

  function restore(tip) {
    const entry = shown.get(tip)
    if (!entry) return
    shown.delete(tip)
    if (entry.visibility) tip.style.setProperty("visibility", entry.visibility)
    else tip.style.removeProperty("visibility")
  }

  function hide(tip, why = "") {
    const entry = shown.get(tip)
    if (!entry) return
    log("hide", nameOf(tip), why)
    restore(tip)
    try { entry.popup.instance.Hide() } catch {}
  }

  // Steam tooltips: appear / disappear in the DOM

  // Steam adds a tooltip first and moves it into place a moment later: re-check new ones for ~0.5s
  const RECHECK_FRAMES = 30
  const pending = new Set()

  function recheck(tip, frames = RECHECK_FRAMES) {
    if (!tip.isConnected || shown.has(tip)) return pending.delete(tip)
    const why = show(tip)
    if (!why) return pending.delete(tip)
    if (frames <= 0) { log("skip steam tooltip", nameOf(tip), why); return pending.delete(tip) }
    requestAnimationFrame(() => recheck(tip, frames - 1))
  }

  function scan() {
    const selector = getDeps()?.steamTooltips
    if (selector) {
      for (const tip of document.querySelectorAll(selector)) {
        if (shown.has(tip) || pending.has(tip)) continue
        pending.add(tip)
        recheck(tip)
      }
    }
    for (const tip of [...shown.keys()]) if (!tip.isConnected) hide(tip, "removed by Steam")
  }

  let queued = false
  new MutationObserver(records => {
    if (queued) return
    // only additions / removals that can be tooltips
    if (!records.some(r => r.addedNodes.length || r.removedNodes.length)) return
    queued = true
    requestAnimationFrame(() => { queued = false; scan() })
  }).observe(document.documentElement, { childList: true, subtree: true }) // body may not exist yet at startup

  // Theme tooltips: :hover of their button

  document.addEventListener("mouseover", event => {
    const host = event.target instanceof Element && event.target.closest(LABEL_HOSTS)
    const label = host?.querySelector(LABELS)
    if (label) requestAnimationFrame(() => {
      const why = show(label)
      if (why && why !== "already shown") log("skip label", nameOf(label), why)
    })
  }, true)

  // Contributor badge tooltip (Badges for Contributors.js)

  const badgeTip = () => document.getElementById("nevko-tooltip")

  document.addEventListener("nevko-badge-tooltip", event => {
    const tip = badgeTip()
    if (!tip) return
    if (!event.detail?.visible) {
      hide(tip, "badge leave")
      scan() // Steam tooltip of the button again
      return
    }
    // Other tooltips away
    for (const other of [...shown.keys()]) if (other !== tip) hide(other, "badge hover")
    hide(tip, "badge changed")
    requestAnimationFrame(() => {
      const why = show(tip)
      if (why) log("skip badge", nameOf(tip), why)
    })
  })

  document.addEventListener("mouseout", event => {
    const host = event.target instanceof Element && event.target.closest(LABEL_HOSTS)
    if (!host || host.contains(event.relatedTarget)) return
    const label = host.querySelector(LABELS)
    if (label) hide(label, "mouseout")
  }, true)
})()
