// Compact Buttons - Simply. Dark. - Shadow | Fixed Script
;(() => {
  const TITLE_BAR_SELECTOR = "._3cykd-VfN_xBxf3Qxriccm"
  const BOTTOM_BAR_SELECTOR = "._1_yS5UP7el0aN4vntx3dx"
  const OFFSET_BASE = 135

  let currentTitleBar = null
  let currentBottomBar = null
  let titleBarObserver = null
  let bottomBarObserver = null
  let resizeObserver = null
  let rafPending = false

  function applyPosition() {
    rafPending = false
    if (!currentTitleBar || !currentBottomBar) return

    // getBoundingClientRect даёт субпиксельную точность, offsetWidth округляет —
    // это и вызывало периодический сдвиг на 1px
    const exactWidth = currentTitleBar.getBoundingClientRect().width
    currentBottomBar.style.setProperty("position", "absolute", "important")
    currentBottomBar.style.setProperty("left", "auto", "important")
    currentBottomBar.style.setProperty("right", `${exactWidth + OFFSET_BASE}px`, "important")
  }

  function scheduleApply() {
    if (rafPending) return
    rafPending = true
    requestAnimationFrame(applyPosition)
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
      scheduleApply()
    })
    titleBarObserver.observe(currentTitleBar, {
      attributes: true,
      childList: true,
      subtree: true,
    })

    bottomBarObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "style") {
          scheduleApply()
        }
      }
    })
    bottomBarObserver.observe(currentBottomBar, {
      attributes: true,
      attributeFilter: ["style", "class"],
    })

    resizeObserver = new ResizeObserver(() => {
      scheduleApply()
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
