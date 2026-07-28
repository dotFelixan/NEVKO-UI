(() => {
  "use strict"

  const CONFIG = {
    // Элемент, на который нажимают ПКМ для toggle
    trigger: "._2UyOBeiSdBayaFdRa39N2O:nth-of-type(1)",

    // Элементы, которые нужно показать/скрыть
    targets: [
      "._2UyOBeiSdBayaFdRa39N2O:nth-of-type(2)",
      "._2UyOBeiSdBayaFdRa39N2O:nth-of-type(3)",
      "._2UyOBeiSdBayaFdRa39N2O:nth-of-type(4)",
      "._2UyOBeiSdBayaFdRa39N2O:nth-of-type(5)",
    ],

    // Элемент оверлея, которому добавляется фон
    overlay: "._39oUCO1OuizVPwcnnv88no ._3s0lkohH8wU2do0K1il28Y",

    // Стили оверлея при открытом состоянии
    overlayOpen: {
      zIndex: "1",
    },

    // Элементы, которые скрываются при открытии
    hideOnOpen: [
      "._7AlhCx3XGzBeIrQaCneUD",
    ],
  }

  // Состояние
  let isOpen = false

  // --- Инициализация CSS ---
  function injectCSS() {
    const style = document.createElement("style")
    style.id = "cme-style"
    style.textContent = CONFIG.targets
      .map((s) => `${s} { visibility: hidden; }`)
      .join("\n")
    ;(document.head || document.documentElement).appendChild(style)
  }

  // --- Применить открытое состояние ---
  function applyOpen() {
    CONFIG.targets.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.setProperty("visibility", "visible", "important")
      })
    })

    document.querySelectorAll(CONFIG.overlay).forEach((el) => {
      el.style.setProperty("background", CONFIG.overlayOpen.background, "important")
      el.style.setProperty("z-index", CONFIG.overlayOpen.zIndex, "important")
    })

    CONFIG.hideOnOpen.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.setProperty("display", "none", "important")
      })
    })

    isOpen = true
  }

  // --- Применить закрытое состояние ---
  function applyClose() {
    CONFIG.targets.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.removeProperty("visibility")
      })
    })

    document.querySelectorAll(CONFIG.overlay).forEach((el) => {
      el.style.removeProperty("background")
      el.style.removeProperty("z-index")
    })

    CONFIG.hideOnOpen.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.removeProperty("display")
      })
    })

    isOpen = false
  }

  // --- Повесить обработчик на trigger ---
  function bindTrigger() {
    // ПКМ на первом элементе — toggle
    document.querySelectorAll(CONFIG.trigger).forEach((el) => {
      if (el.dataset.cmebound) return
      el.dataset.cmebound = "1"

      el.addEventListener("contextmenu", (e) => {
        e.preventDefault()
        e.stopPropagation()
        isOpen ? applyClose() : applyOpen()
      })
    })

    // Наведение на nth-of-type(2–5) — напрямую вызывает нативный click на элементе
    CONFIG.targets.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.dataset.cmehover) return
        el.dataset.cmehover = "1"

        el.addEventListener("mouseenter", () => {
          el.click()
        })
      })
    })
  }

  // --- MutationObserver на случай динамического появления элементов ---
  function observe() {
    const observer = new MutationObserver(() => {
      bindTrigger()
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  }

  // --- Точка входа ---
  function init() {
    injectCSS()
    bindTrigger()
    observe()
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
})()
