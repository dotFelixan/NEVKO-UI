// Auto pass store age check

;(() => {
  "use strict"

  const BIRTHDAY = { day: "1", month: "1", year: "1990" } // month: 1 = January

  // Plain selects
  function choose(select, value) {
    select.value = value
    select.dispatchEvent(new Event("change", { bubbles: true }))
  }

  function tryBypass() {
    const day = document.querySelector("select#ageDay")
    const month = document.querySelector("select#ageMonth")
    const year = document.querySelector("select#ageYear")
    if (!day || !month || !year) return false

    choose(day, BIRTHDAY.day)
    choose(month, BIRTHDAY.month)
    choose(year, BIRTHDAY.year)
    document.querySelector("#view_product_page_btn")?.click()
    return true
  }

  function init() {
    if (tryBypass()) return
    // Form may appear later
    const observer = new MutationObserver(() => {
      if (tryBypass()) observer.disconnect()
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
