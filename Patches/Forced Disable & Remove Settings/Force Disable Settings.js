// Forced Steam settings: hides their rows in the Settings window (and fixes the switch if it is wrong)
// Values are written on launch by Apply Forced Settings.js, no window needed

;(() => {
  "use strict"

  // page: tab (PAGE_NAMES key) | index: row on tab, from 0 | turn: "off" / "on" | hide: hide row
  const FORCED = [
    { page: "friends",       index: 7, turn: "off", hide: true },
    { page: "friends",       index: 8, turn: "off", hide: true },
    { page: "friends",       index: 9, turn: "on",  hide: true }, // dock chats to the friends list
    { page: "friends",       index: 10, turn: "off", hide: true }, // new chats in a new window
    { page: "library",       index: 3, turn: "on",  hide: true },
    { page: "library",       index: 4, turn: "off", hide: true },
    { page: "accessibility", index: 1, turn: "off", hide: true },
    { page: "accessibility", index: 2, turn: "off", hide: true },
  ]

  // Tab names, lowercase
  const PAGE_NAMES = {
    friends: [
      "друзья", "friends", "amis", "freunde", "amigos", "znajomi", "arkadaşlar",
      "друзі", "友達", "친구", "好友", "เพื่อน", "vrienden", "přátelé", "barátok",
      "prieteni", "φίλοι", "ystävät", "vänner", "venner",
    ],
    library: [
      "библиотека", "library", "bibliothèque", "bibliothek", "biblioteca", "biblioteka",
      "kütüphane", "бібліотека", "ライブラリ", "라이브러리", "库", "ห้องสมุด",
      "bibliotheek", "knihovna", "könyvtár",
    ],
    accessibility: [
      "доступность", "accessibility", "accessibilité", "barrierefreiheit", "accesibilidad",
      "dostępność", "erişilebilirlik", "доступність", "アクセシビリティ", "접근성",
      "辅助功能", "การเข้าถึง", "toegankelijkheid", "přístupnost", "akadálymentesség",
    ],
  }

  const ROW = ".eKmEXJCm_lgme24Fp_HWt"
  const TOGGLE = "[role='checkbox']"
  const NAV_BUTTON = "._1-vlriAtKYDViAEunue4VO"
  const ACTIVE_TAB = ".PagedSettingsDialog_PageListItem.Active"
  const SETTINGS_WINDOW = "MillenniumWindow_Settings" // Millennium class on <html>

  const CHECK_EVERY = 500            // ms

  // Checked by Apply Forced Settings.js in main window
  window.__nk_drs_ready = true


  // Tabs

  function pageOf(text) {
    const lower = (text || "").trim().toLowerCase()
    for (const [page, names] of Object.entries(PAGE_NAMES)) {
      if (names.some(name => lower.includes(name))) return page
    }
    return null
  }

  // Windows: Active class | Linux: aria / Active / Selected
  function getCurrentPage() {
    const active = document.querySelector(ACTIVE_TAB) || document.querySelector(
      `${NAV_BUTTON}[aria-selected="true"], ${NAV_BUTTON}[aria-current], ` +
      `${NAV_BUTTON}[class*="Active" i], ${NAV_BUTTON}[class*="Selected" i]`
    )
    return pageOf(active?.textContent)
  }



  // Apply

  // .click() is not always enough
  function reactClick(el) {
    const options = { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 }
    el.dispatchEvent(new PointerEvent("pointerdown", options))
    el.dispatchEvent(new MouseEvent("mousedown", options))
    el.dispatchEvent(new PointerEvent("pointerup", options))
    el.dispatchEvent(new MouseEvent("mouseup", options))
    el.click()
  }

  const isOn = toggle => toggle.classList.contains("On") || toggle.getAttribute("aria-checked") === "true"

  // Inline !important (Linux loads its styles later)
  const hiddenRows = new Set()

  function hideRow(row) {
    hiddenRows.add(row)
    if (row.style.getPropertyValue("display") === "none") return
    row.setAttribute("data-nk-hidden", "1")
    row.style.setProperty("display", "none", "important")
  }

  function unhideRow(row) {
    hiddenRows.delete(row)
    row.removeAttribute("data-nk-hidden")
    row.style.removeProperty("display")
  }

  const rowsFor = (page, rows) => FORCED
    .filter(rule => rule.page === page)
    .map(rule => ({ rule, row: rows[rule.index] }))
    .filter(({ row }) => row)

  // Hide instantly, from observer
  function hideRows(page) {
    if (!page) return
    for (const { rule, row } of rowsFor(page, document.querySelectorAll(ROW))) {
      if (rule.hide) hideRow(row)
    }
  }

  // Switches after tab settled, unhide wrong rows
  function applyRules(page) {
    if (!page) return
    const targets = rowsFor(page, document.querySelectorAll(ROW))
    const shouldBeHidden = new Set(targets.filter(({ rule }) => rule.hide).map(({ row }) => row))

    for (const row of [...hiddenRows]) {
      if (!row.isConnected) hiddenRows.delete(row)
      else if (!shouldBeHidden.has(row)) unhideRow(row)
    }

    for (const { rule, row } of targets) {
      if (rule.hide) hideRow(row)
      const toggle = row.querySelector(TOGGLE)
      if (toggle && isOn(toggle) !== (rule.turn === "on")) reactClick(toggle)
    }
  }


  // Modes

  let lastVisitedPage = null
  const currentPage = () => getCurrentPage() || lastVisitedPage

  // Wait for tab to settle before switches
  const SETTLE_TIME = 300
  let settledPage = null
  let settleTimer = null

  function applyWhenSettled() {
    const page = currentPage()
    if (page !== settledPage) {
      settledPage = page
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        settleTimer = null
        applyWhenSettled()
      }, SETTLE_TIME)
      return
    }
    if (!settleTimer) applyRules(page)
  }

  // Hide on every change, switches every 300ms max
  function keepApplying() {
    let timer = null
    new MutationObserver(() => {
      hideRows(currentPage())
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        applyWhenSettled()
      }, 300)
    }).observe(document.body, { childList: true, subtree: true })
  }

  function start() {
    keepApplying()
    hideRows(currentPage())
    applyWhenSettled()
  }


  // Wait for Settings Window

  // Millennium marker -> no delay, else check rarely
  function waitForSettings() {
    if (document.querySelector(NAV_BUTTON)) return start()

    if (document.documentElement.classList.contains(SETTINGS_WINDOW)) {
      const observer = new MutationObserver(() => {
        if (!document.querySelector(NAV_BUTTON)) return
        observer.disconnect()
        start()
      })
      return observer.observe(document.body, { childList: true, subtree: true })
    }

    // First change right away, then CHECK_EVERY
    let lastCheck = 0
    let timer = null
    const check = () => {
      lastCheck = Date.now()
      if (!document.querySelector(NAV_BUTTON)) return
      observer.disconnect()
      clearTimeout(timer)
      start()
    }
    const observer = new MutationObserver(() => {
      if (Date.now() - lastCheck >= CHECK_EVERY) return check()
      timer ??= setTimeout(() => {
        timer = null
        check()
      }, CHECK_EVERY)
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", waitForSettings, { once: true })
    : waitForSettings()
})()
