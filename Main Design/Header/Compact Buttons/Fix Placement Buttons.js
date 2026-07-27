// Compact Buttons - Simply. Dark. - Shadow | Fixed Script
;(() => {
  const TITLE_BAR_SELECTOR = "._3cykd-VfN_xBxf3Qxriccm"
  const BOTTOM_BAR_SELECTOR = "._1_yS5UP7el0aN4vntx3dx"
  const OFFSET_BASE = 121

  let currentTitleBar = null
  let currentBottomBar = null
  let titleBarObserver = null
  let bottomBarObserver = null
  let resizeObserver = null

  function applyPosition() {
    if (!currentTitleBar || !currentBottomBar) return

    const offsetWidth = currentTitleBar.offsetWidth
    currentBottomBar.style.setProperty("position", "absolute", "important")
    currentBottomBar.style.setProperty("left", "auto", "important")
    currentBottomBar.style.setProperty("right", `${offsetWidth + OFFSET_BASE}px`, "important")
  }

  function cleanup() {
    if (titleBarObserver) {
      titleBarObserver.disconnect()
      titleBarObserver = null
    }
    if (bottomBarObserver) {
      bottomBarObserver.disconnect()
      bottomBarObserver = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  function setupObservers() {
    cleanup()

    titleBarObserver = new MutationObserver(() => {
      requestAnimationFrame(applyPosition)
    })
    titleBarObserver.observe(currentTitleBar, {
      attributes: true,
      childList: true,
      subtree: true,
    })

    bottomBarObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "style") {
          requestAnimationFrame(applyPosition)
        }
      }
    })
    bottomBarObserver.observe(currentBottomBar, {
      attributes: true,
      attributeFilter: ["style", "class"],
    })

    resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(applyPosition)
    })
    resizeObserver.observe(currentTitleBar)
  }

  function init() {
    const titleBar = document.querySelector(TITLE_BAR_SELECTOR)
    const bottomBar = document.querySelector(BOTTOM_BAR_SELECTOR)

    if (!titleBar || !bottomBar) return false

    const elementsChanged = titleBar !== currentTitleBar || bottomBar !== currentBottomBar

    currentTitleBar = titleBar
    currentBottomBar = bottomBar

    if (elementsChanged) {
      setupObservers()
    }

    applyPosition()
    return true
  }

  const bodyObserver = new MutationObserver(() => {
    init()
  })

  function startWatching() {
    init()

    if (document.body) {
      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWatching)
  } else {
    startWatching()
  }

  window.addEventListener("load", init)

  setInterval(init, 2000)
})()
