// Whole main header button is clickable (not only text)

;(() => {
  "use strict"

  const MAIN_BUTTON = "._7AlhCx3XGzBeIrQaCneUD"
  const BUTTON_TEXT = "._19axKcqYRuaJ8vdYKYmtTQ"

  document.addEventListener("click", event => {
    // Text click handled by Steam
    if (event.target.closest(BUTTON_TEXT)) return

    const button = event.target.closest(MAIN_BUTTON)
    button?.querySelector(BUTTON_TEXT)?.click()
  })
})()
