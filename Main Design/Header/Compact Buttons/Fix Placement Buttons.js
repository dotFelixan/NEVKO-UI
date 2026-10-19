// Compact header buttons | CODE FROM "Simply Dark" | CREDIT BY "shdwmtr"
// Keep row left of account block, same frame

;(() => {
  "use strict"

  const ACCOUNT_BLOCK = "._3cykd-VfN_xBxf3Qxriccm"
  const BUTTONS_ROW = "._1_yS5UP7el0aN4vntx3dx"
  const EXTRA_OFFSET = 135 // window buttons + gaps

  let account = null
  let row = null
  let watchers = []

  // getBoundingClientRect (offsetWidth rounds)
  function place() {
    if (!account || !row) return
    // Round to 0.01px
    const right = Math.round((account.getBoundingClientRect().width + EXTRA_OFFSET) * 100) / 100
    setImportant(row, "position", "absolute")
    setImportant(row, "left", "auto")
    setImportant(row, "right", `${right}px`)
    requestAnimationFrame(clipTabs)
  }

  // Tabs reaching the buttons: cut 8px before the first button, round, as the chat tabs (not hidden under the row)
  const TABS = "._2D64jIEK7wpUR_NlObDW76"
  const BAR = "._3vCzSrrXZzZjVJFZNg9SGu"
  const GAP = 8

  function clipTabs() {
    const tabs = document.querySelector(TABS)
    if (!tabs || !row) return
    const shown = el => el.offsetParent && el.getBoundingClientRect().width > 0
    const buttons = [...row.querySelectorAll(`${BAR} > *`)].filter(shown) // not the alerts beside the bar

    const items = [...tabs.children].filter(shown)
    if (!buttons.length || !items.length) return tabs.style.removeProperty("clip-path")
    const cut = Math.min(...buttons.map(el => el.getBoundingClientRect().left)) - GAP
    const end = Math.max(...items.map(el => el.getBoundingClientRect().right))
    if (end <= cut) return tabs.style.removeProperty("clip-path")
    // Top and bottom of the tabs themselves: they stand out of their row (above it), the cut follows them, not the row
    const box = tabs.getBoundingClientRect()
    const tab = items[0].getBoundingClientRect()
    const inset = Math.max(0, Math.round(box.right - cut))
    const top = Math.round(tab.top - box.top)
    const bottom = Math.round(box.bottom - tab.bottom)
    const value = `inset(${top}px ${inset}px ${bottom}px 0 round var(--button-radius))`
    if (tabs.style.clipPath !== value) tabs.style.clipPath = value
  }

  // Write only on change
  function setImportant(el, property, value) {
    if (el.style.getPropertyValue(property) === value && el.style.getPropertyPriority(property) === "important") return
    el.style.setProperty(property, value, "important")
  }

  function watch() {
    watchers.forEach(watcher => watcher.disconnect())

    // Before paint
    const resize = new ResizeObserver(place)
    resize.observe(account)

    // Account content changed
    const content = new MutationObserver(place)
    content.observe(account, { childList: true, subtree: true, attributes: true })

    // Steam rewrote style
    const rowStyle = new MutationObserver(records => {
      if (records.some(r => r.attributeName === "style")) place()
    })
    rowStyle.observe(row, { attributes: true, attributeFilter: ["style", "class"] })

    // Tabs added, removed or resized: their cut again
    const tabs = document.querySelector(TABS)
    if (tabs) resize.observe(tabs)

    watchers = [resize, content, rowStyle]
  }

  // React Recreate
  function findElements() {
    const newAccount = document.querySelector(ACCOUNT_BLOCK)
    const newRow = document.querySelector(BUTTONS_ROW)
    if (!newAccount || !newRow) return
    if (newAccount === account && newRow === row) return

    account = newAccount
    row = newRow
    watch()
    place()
  }

  function init() {
    findElements()

    // Header recreated
    new MutationObserver(findElements).observe(document.body, { childList: true, subtree: true })

    addEventListener("load", findElements)
    addEventListener("resize", () => requestAnimationFrame(clipTabs))
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
