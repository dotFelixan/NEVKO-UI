// добавляет бейджик "Beta" (или любой другой) рядом с нужными надписями в настройках Steam

;(() => {

  // ── настройки ──────────────────────────────────────────────────────────────
  //
  // Ключ   — точный текст надписи в настройках (на любом языке)
  // Значение — объект { label, tooltip }
  //   label   — текст бейджика
  //   tooltip — текст тултипа при наведении (опционально, можно не указывать)
  //
  // Чтобы добавить новый бейджик — просто допиши строку:
  //   "Название настройки": { label: "Beta", tooltip: "..." },
  //
  const BADGES = {
    "Rounding Buttons": {
      label:   "Beta",
      tooltip: "This feature is not yet stable and is still in development.",
    },
	"Rounding Avatars": {
      label:   "Beta",
      tooltip: "This feature is not yet stable and is still in development.",
    },
	"Avatar Decoration": {
      label:   "Beta",
      tooltip: "This feature is not yet stable and is still in development.",
    },
  }

  // ── стили ──────────────────────────────────────────────────────────────────

  function injectCSS() {
    if (document.getElementById("nevko-badge-style")) return
    const s = document.createElement("style")
    s.id = "nevko-badge-style"
    s.textContent = `
      .nk-badge {
        display: inline-block;
        align-self: center;
        padding: 1px 6px;
        font-size: 10px;
        font-weight: bold;
        line-height: 16px;
        height: 18px;
        color: #fff;
        background-color: #FFA500;
        border-radius: 3px;
        margin-left: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        user-select: none;
        cursor: default;
        flex-shrink: 0;
      }
      .nk-tooltip {
        box-shadow: 1px 1px 8px #0005, 2px 2px 16px 1px #0005 !important;
        transition: opacity .25s !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
        white-space: nowrap !important;
        border-radius: 2px !important;
        position: fixed !important;
        width: fit-content !important;
        max-width: none !important;
        user-select: none !important;
        padding: 6px 8px !important;
        overflow: visible !important;
        font-size: 13px !important;
        font-family: "Motiva Sans", Arial, Helvetica, sans-serif !important;
        background-color: #696773 !important;
        color: #E0E1E6 !important;
        z-index: 2147483647 !important;
        opacity: 0;
        top: 0;
        left: 0;
      }
    `
    ;(document.head || document.documentElement).appendChild(s)
  }

  // ── логика ─────────────────────────────────────────────────────────────────

  const processed = new WeakSet()

  // вместо TreeWalker — обходим все элементы и проверяем textContent
  // не трогаем DOM во время обхода — бейджик добавляем через appendChild, не replaceWith
  function scan(root = document.documentElement) {
    const all = root.querySelectorAll ? root.querySelectorAll("*") : []
    for (const el of all) {
      if (processed.has(el)) continue

      // ищем элементы у которых прямой текст (без дочерних тегов) совпадает с ключом
      const directText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .join("")

      if (!BADGES[directText]) continue
      processed.add(el)

      const { label, tooltip } = BADGES[directText]

      // добавляем бейджик в конец элемента — не трогаем существующие узлы
      const badge = document.createElement("span")
      badge.className = "nk-badge"
      badge.textContent = label
      el.appendChild(badge)

      if (!tooltip) continue

      // вставляем тултип в documentElement — максимально высокий уровень,
      // гарантирует что он не обрезается никаким родителем Steam
      const tip = document.createElement("span")
      tip.className = "nk-tooltip"
      tip.textContent = tooltip
      document.documentElement.appendChild(tip)

      // Steam может блокировать pointer-events — слушаем mousemove на document
      // и сравниваем координаты мыши с bounding rect бейджика
      let visible = false
      document.addEventListener("mousemove", (e) => {
        const r = badge.getBoundingClientRect()
        const inside = e.clientX >= r.left && e.clientX <= r.right
                    && e.clientY >= r.top  && e.clientY <= r.bottom

        if (inside && !visible) {
          visible = true
          tip.style.left    = `${r.left - 40}px`
          tip.style.top     = `${r.bottom + 6}px`
          tip.style.opacity = "1"
        } else if (!inside && visible) {
          visible = false
          tip.style.opacity = "0"
        }
      })
    }
  }

  function init() {
    injectCSS()
    scan()
    new MutationObserver(() => scan()).observe(
      document.documentElement,
      { childList: true, subtree: true }
    )
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init()

})()
