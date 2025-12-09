// Скрипт для отслеживания кликов - расширенная версия для Steam

document.addEventListener(
  "click",
  (event) => {
    const target = event.target

    console.log("%c═══════════ КЛИК ═══════════", "color: #22c55e; font-weight: bold; font-size: 14px;")

    console.log("%cHTML элемента:", "color: #f59e0b; font-weight: bold;")
    console.log(target.outerHTML.slice(0, 500))

    console.log("%cВСЕ атрибуты:", "color: #3b82f6; font-weight: bold;")
    const allAttrs = {}
    Array.from(target.attributes || []).forEach((attr) => {
      allAttrs[attr.name] = attr.value
    })
    console.table(allAttrs)

    if (target.parentElement) {
      console.log("%cHTML родителя:", "color: #ec4899; font-weight: bold;")
      console.log(target.parentElement.outerHTML.slice(0, 500))

      console.log("%cАтрибуты родителя:", "color: #ec4899; font-weight: bold;")
      const parentAttrs = {}
      Array.from(target.parentElement.attributes || []).forEach((attr) => {
        parentAttrs[attr.name] = attr.value
      })
      console.table(parentAttrs)
    }

    const clickable = target.closest("a, [onclick], [data-url], [data-href], [data-link], [href]")
    if (clickable && clickable !== target) {
      console.log("%cНайден кликабельный элемент:", "color: #a855f7; font-weight: bold;")
      console.log(clickable.outerHTML.slice(0, 500))
    }

    console.log("%cDOM элемент (можно развернуть):", "color: #06b6d4; font-weight: bold;")
    console.dir(target)

    console.log("%c════════════════════════════", "color: #22c55e; font-weight: bold;")
  },
  true,
)

console.log(
  "%c✓ Full Element Logger активирован! Кликай на любой элемент",
  "color: #22c55e; font-weight: bold; font-size: 14px; background: #000; padding: 5px;",
)
