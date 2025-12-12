// Compact Buttons - Simply. Dark. - Shadow | Fixed Script
;(() => {
  const CONTAINER_CLASS = "_3mz8wQ6Q44B8P7pzPP4Iyw"
  const TITLE_BAR_SELECTOR = "._3cykd-VfN_xBxf3Qxriccm"
  const BOTTOM_BAR_SELECTOR = "._1_yS5UP7el0aN4vntx3dx"
  const OFFSET_BASE = 121

  let titleBarObserver = null
  let isInitialized = false
  let retryInterval = null

  function changeOffset(bottom, offsetWidth) {
    if (!bottom) return
    bottom.style.setProperty("position", "absolute", "important")
    bottom.style.setProperty("left", "auto", "important")
    bottom.style.setProperty("right", `${offsetWidth + OFFSET_BASE}px`, "important")
  }

  function init() {
    if (isInitialized) return

    const titleBar = document.querySelector(TITLE_BAR_SELECTOR)
    const bottomBar = document.querySelector(BOTTOM_BAR_SELECTOR)

    if (!titleBar || !bottomBar) return

    isInitialized = true

    if (retryInterval) {
      clearInterval(retryInterval)
      retryInterval = null
    }

    changeOffset(bottomBar, titleBar.offsetWidth)

    if (titleBarObserver) {
      titleBarObserver.disconnect()
    }

    titleBarObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        changeOffset(bottomBar, titleBar.offsetWidth)
      })
    })

    titleBarObserver.observe(titleBar, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    })
  }

  init()

  if (!isInitialized) {
    let attempts = 0
    retryInterval = setInterval(() => {
      attempts++
      init()
      if (isInitialized || attempts >= 50) {
        clearInterval(retryInterval)
        retryInterval = null
      }
    }, 100)
  }

  document.addEventListener("DOMContentLoaded", init)
  window.addEventListener("load", init)

  const bodyObserver = new MutationObserver((mutations) => {
    if (isInitialized) {
      bodyObserver.disconnect()
      return
    }

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.classList?.contains(CONTAINER_CLASS)) {
          init()
          if (isInitialized) bodyObserver.disconnect()
          return
        }
      }
    }
  })

  if (document.body) {
    bodyObserver.observe(document.body, { childList: true, subtree: true })
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      bodyObserver.observe(document.body, { childList: true, subtree: true })
    })
  }
})()
