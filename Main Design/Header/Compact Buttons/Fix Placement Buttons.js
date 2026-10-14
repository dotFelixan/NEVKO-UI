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
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
