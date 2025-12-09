// ==============================================================================
// НАСТРОЙКИ / SETTINGS
// Здесь вы можете легко изменить текст замены и стили
// Here you can easily change replacement text and styles
// ==============================================================================

const CONFIG = {
  // ============================================
  // ЗАМЕНА ТЕКСТА / TEXT REPLACEMENTS
  // Формат: "Искомый текст": "Новый текст"
  // Format: "Search text": "New text"
  // ============================================
  replacements: {
    "DRIVER = 1": "Users",
    "DRIVER = 2": "Misc",
    "DRIVER = 3": "Main",
    "DRIVER = 4": "Library",
    "DRIVER = 5": "Chats",
    "DRIVER = 6": "Misc",
    // Добавьте свои замены ниже / Add your replacements below:
    // "DRIVER = *": "Custom",
  },

  // ============================================
  // СТИЛИ ТЕКСТА / TEXT STYLES
  // ============================================
  styles: {
    color: "#8b929a", // Цвет текста / Text color
    fontWeight: "bold", // Жирность / Font weight
    textAlign: "center", // Выравнивание / Alignment
    display: "block", // Тип отображения / Display type
    width: "100%", // Ширина / Width
    fontSize: "1.1em", // Размер шрифта / Font size
    marginBottom: "-8px", // Отступ снизу / Bottom margin
  },

  // ============================================
  // CSS СЕЛЕКТОРЫ / CSS SELECTORS
  // Элементы для обработки (не меняйте если не уверены)
  // Elements to process (don't change if unsure)
  // ============================================
  selectors: ["._3jMlJm4PQCA8SfNlUR99Fo"],

  // Элемент для удаления / Element to remove
  removeSelector: "._1aw7cA3mAZfWt8idAlVJWi",
  parentSelector: "._2VcTlXFC64Jtg9gvtT6cmY",
}

// ==============================================================================
// КОД СКРИПТА / SCRIPT CODE
// Не редактируйте ниже, если не знаете что делаете
// Don't edit below unless you know what you're doing
// ==============================================================================
;(() => {
  const processedElements = new WeakSet()
  let debounceTimer = null
  let immediateInterval = null

  // Создаем регулярные выражения из настроек
  const replacements = Object.entries(CONFIG.replacements).map(([search, replace]) => ({
    pattern: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*"), "g"),
    replacement: replace,
  }))

  // CSS для скрытия необработанных элементов
  function injectCSS() {
    const style = document.createElement("style")
    const selectors = CONFIG.selectors.join(", ")
    style.textContent = `
      ${selectors} { visibility: hidden !important; }
      ${CONFIG.selectors.map((s) => `${s}[data-processed="true"]`).join(", ")} { visibility: visible !important; }
    `
    ;(document.head || document.documentElement).appendChild(style)
  }

  // Применить стили к элементу
  function applyStyles(element) {
    if (!element) return
    Object.assign(element.style, CONFIG.styles)
  }

  // Удалить целевой элемент
  function removeTargetElement(element) {
    const parent = element?.closest(CONFIG.parentSelector)
    parent?.querySelector(CONFIG.removeSelector)?.remove()
  }

  // Обработать текст элемента
  function processElement(element) {
    if (processedElements.has(element)) return

    const text = element.textContent
    let newText = text
    let changed = false

    for (const { pattern, replacement } of replacements) {
      if (pattern.test(text)) {
        newText = replacement
        changed = true
        break
      }
    }

    if (changed) {
      element.textContent = newText
      applyStyles(element)
      removeTargetElement(element)
    }

    processedElements.add(element)
    element.setAttribute("data-processed", "true")
  }

  // Найти и обработать все элементы
  function processAll() {
    const selector = CONFIG.selectors.join(", ")
    document.querySelectorAll(selector).forEach(processElement)
  }

  // Наблюдатель за изменениями DOM
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length > 0)) {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(processAll, 1)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  // Инициализация
  function init() {
    injectCSS()
    processAll()

    // Быстрая проверка первые 2 секунды
    immediateInterval = setInterval(processAll, 10)
    setTimeout(() => clearInterval(immediateInterval), 2000)

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", processAll)
    }

    setupObserver()
  }

  init()
})()
