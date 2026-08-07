;(() => {
  "use strict"

  // ─── CONFIG ──────────────────────────────────────────────────────────────────
  const CONFIG = {
    day:   "1",
    month: "1",   // 1 = январь
    year:  "1990",
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  // Устанавливает значение <select> и триггерит change — работает без React
  function setSelect(select, value) {
    select.value = value
    select.dispatchEvent(new Event("change", { bubbles: true }))
  }

  // ─── MAIN ────────────────────────────────────────────────────────────────────

  function tryBypass() {
    const daySelect   = document.querySelector("select#ageDay")
    const monthSelect = document.querySelector("select#ageMonth")
    const yearSelect  = document.querySelector("select#ageYear")

    if (!daySelect || !monthSelect || !yearSelect) return false

    setSelect(daySelect,   CONFIG.day)
    setSelect(monthSelect, CONFIG.month)
    setSelect(yearSelect,  CONFIG.year)

    // Кнопка уже в DOM вместе с селектами — кликаем сразу без задержки
    const btn = document.querySelector("#view_product_page_btn")
    if (btn) btn.click()

    return true
  }

  function init() {
    if (tryBypass()) return

    // MutationObserver реагирует мгновенно как только селекты появятся в DOM
    const observer = new MutationObserver(() => {
      if (tryBypass()) observer.disconnect()
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true })
  } else {
    init()
  }
})()
