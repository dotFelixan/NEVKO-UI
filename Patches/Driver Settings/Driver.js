// =============================================================================
// TitleCategory.js
// Заменяет внутренние метки категорий Steam на читаемые названия
// =============================================================================

const CONFIG = {
  replacements: {
    "DRIVER = 1": "Users",
    "DRIVER = 2": "Header",
    "DRIVER = 3": "Library",
    "DRIVER = 4": "Chats",
	"DRIVER = 98": "Misc",
    "DRIVER = 99": "Misc",
  },

  styles: {
    color: "#8b929a",
    fontWeight: "bold",
    textAlign: "center",
    display: "block",
    width: "100%",
    fontSize: "1.1em",
    marginBottom: "-8px",
    marginTop: "-4px",
  },

  selectors:              ["._3jMlJm4PQCA8SfNlUR99Fo"],
  removeSelector:         "._1aw7cA3mAZfWt8idAlVJWi",
  parentSelector:         "._2VcTlXFC64Jtg9gvtT6cmY",
  conditionalHideSelector: "._2o2fXzn99OddeqZMjbDuxQ",
}

// =============================================================================

;(() => {
  const seen       = new WeakSet()
  const selectorAll = CONFIG.selectors.join(", ")

  // Паттерны компилируются один раз
  const patterns = Object.entries(CONFIG.replacements).map(([key, val]) => ({
    re: new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*")),
    val,
  }))

  function injectCSS() {
    const hidden = CONFIG.selectors.map((s) => `${s}:not([data-tc])`).join(", ")
    const shown  = CONFIG.selectors.map((s) => `${s}[data-tc]`).join(", ")
    const style  = document.createElement("style")
    style.textContent = `${hidden}{visibility:hidden!important}${shown}{visibility:visible!important}`
    ;(document.head || document.documentElement).appendChild(style)
  }

  function processElement(node) {
    if (seen.has(node)) return
    seen.add(node)

    const match = patterns.find(({ re }) => re.test(node.textContent))
    node.setAttribute("data-tc", "")

    if (!match) return

    node.textContent = match.val
    Object.assign(node.style, CONFIG.styles)

    node.closest(CONFIG.parentSelector)
        ?.querySelector(CONFIG.removeSelector)
        ?.remove()

    node.closest(".eKmEXJCm_lgme24Fp_HWt")
        ?.querySelector(CONFIG.conditionalHideSelector)
        ?.style.setProperty("display", "none", "important")
  }

  function processAll() {
    document.querySelectorAll(selectorAll).forEach(processElement)
  }

  function init() {
    injectCSS()
    processAll()

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", processAll)
    }

    // Повторный проход в первые 2с — ловит элементы которые рендерятся с задержкой
    const pulse = setInterval(processAll, 50)
    setTimeout(() => clearInterval(pulse), 2000)

    new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length)) processAll()
    }).observe(document.body, { childList: true, subtree: true })
  }

  init()
})()

