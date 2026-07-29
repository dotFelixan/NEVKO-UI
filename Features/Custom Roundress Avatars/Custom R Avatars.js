;(() => {
  "use strict"

  // ─── CONFIG ────────────────────────────────────────────────────────────────
  const CONFIG = {
    targetLabel:  "Rounding Avatars",
    hideSelector: "._2o2fXzn99OddeqZMjbDuxQ",
    fieldSelector: ".eKmEXJCm_lgme24Fp_HWt",
    storageKey:   "nevko-avatar-rounding",
    min:     0,
    max:     50,
    default: 50,
  }

  // ─── UTILS ─────────────────────────────────────────────────────────────────

  const getSaved = () => {
    const s = localStorage.getItem(CONFIG.storageKey)
    return s !== null ? Number(s) : CONFIG.default
  }

  const formatLabel = val => {
    if (val === CONFIG.min) return "Sharp"
    if (val === CONFIG.max) return "Circle"
    return `${val}%`
  }

  const toRadius = val => val === CONFIG.max ? "50%" : `${val}%`

  // ─── CSS ───────────────────────────────────────────────────────────────────

  function injectCSS() {
    if (document.getElementById("nevko-rounding-style")) return
    const style = document.createElement("style")
    style.id = "nevko-rounding-style"
    style.textContent = `
      ._1xTATKELHR-lRS_s3A4yzd ._36eQg-jp1ebbdaE6PBniHu,
      ._3dncOt2dhpnFYQn-WYQ3Mb ._2JYwpg3-WbCSXH-w5h-zL_,
      .ChatRoomMultiFriendAvatar,
      ._3h-QRJGxnVOIExtHD1R0f2 {
        border-radius: var(--avatar-radius, 50%) !important;
      }
      ._3h-QRJGxnVOIExtHD1R0f2:has(+ ._2nPONxDUmK4rQXzK4Y3vG2) {
        border-radius: 10% !important;
        outline: unset !important;
      }
      ._3xUpb5DWXPFNcHHIcv-9pe.right,
      ._3xUpb5DWXPFNcHHIcv-9pe.bottom {
        border-radius: var(--status-radius, 28%);
      }
    `
    ;(document.head || document.documentElement).appendChild(style)
  }

  function applyValue(val) {
    const norm = val / CONFIG.max                  // 0..1
    const statusRadius = Math.round(norm * 50)     // 0% (sharp) → 50% (круг)
    document.documentElement.style.setProperty("--avatar-radius", toRadius(val))
    document.documentElement.style.setProperty("--status-radius", `${statusRadius}%`)
    localStorage.setItem(CONFIG.storageKey, val)
  }

  // ─── SLIDER ────────────────────────────────────────────────────────────────

  function injectSliderCSS() {
    if (document.getElementById("nevko-slider-style")) return
    const s = document.createElement("style")
    s.id = "nevko-slider-style"
    s.textContent = `
      .nk-row {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 8px;
        overflow: visible;
        margin-top: 4px;
      }
      .nk-track-wrap {
        flex: 1;
        height: 32px;
        position: relative;
        display: flex;
        align-items: center;
        overflow: visible;
        cursor: pointer;
        /* расширяем зону под кружок: половина кружка 18px = 9px с каждой стороны */
        padding: 0 9px;
        box-sizing: border-box;
      }
      .nk-track {
        width: 100%;
        height: 6px;
        background: rgba(255,255,255,0.15);
        border-radius: 3px;
        position: relative;
        overflow: visible;
        pointer-events: none;
      }
      .nk-fill {
        position: absolute;
        top: 0; left: 0; bottom: 0;
        background: #1a9fff;
        border-radius: 3px;
        transition: none;
        pointer-events: none;
      }
      .nk-handle {
        position: absolute;
        top: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
        overflow: visible;
        z-index: 2;
        /* центрируем по кружку: кружок 18px, стрелка 12px */
        /* центр кружка на 12 + 18/2 = 21px от верха */
        margin-top: -21px;
      }
      .nk-arrow {
        color: #8b929a;
        width: 12px;
        height: 12px;
        display: block;
        flex-shrink: 0;
      }
      .nk-dot {
        width: 18px;
        height: 18px;
        background: #fff;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .nk-input {
        position: absolute;
        top: 0; left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        margin: 0;
        padding: 0;
        z-index: 3;
      }
      .nk-label {
        font-size: 13px;
        color: #c6d4df;
        font-weight: bold;
        white-space: nowrap;
        flex-shrink: 0;
        min-width: 38px;
        text-align: right;
      }
    `
    ;(document.head || document.documentElement).appendChild(s)
  }

  function buildSlider(currentVal) {
    injectSliderCSS()

    const norm = (currentVal - CONFIG.min) / (CONFIG.max - CONFIG.min)
    const pct  = norm * 100

    // Строка: [трек] [лейбл]
    const row = document.createElement("div")
    row.className = "nk-row"

    // Обёртка трека
    const trackWrap = document.createElement("div")
    trackWrap.className = "nk-track-wrap"

    // Трек
    const track = document.createElement("div")
    track.className = "nk-track"

    // Заливка
    const fill = document.createElement("div")
    fill.className = "nk-fill"
    fill.style.width = `${pct}%`

    // Ручка
    const handle = document.createElement("div")
    handle.className = "nk-handle"
    handle.style.left = `${pct}%`

    // Стрелка (SVG)
    const arrowNS = "http://www.w3.org/2000/svg"
    const arrow = document.createElementNS(arrowNS, "svg")
    arrow.setAttribute("viewBox", "0 0 36 36")
    arrow.setAttribute("fill", "none")
    arrow.classList.add("nk-arrow")
    const ap = document.createElementNS(arrowNS, "path")
    ap.setAttribute("d", "M17.98 26.54L3.21 11.77H32.75L17.98 26.54Z")
    ap.setAttribute("fill", "currentColor")
    arrow.appendChild(ap)

    // Кружок
    const dot = document.createElement("div")
    dot.className = "nk-dot"

    // Input
    const input = document.createElement("input")
    input.type  = "range"
    input.min   = CONFIG.min
    input.max   = CONFIG.max
    input.value = currentVal
    input.className = "nk-input"

    handle.append(arrow, dot)
    track.append(fill, handle)
    trackWrap.append(track, input)

    // Лейбл
    const label = document.createElement("span")
    label.className = "nk-label"
    label.textContent = formatLabel(currentVal)

    row.append(trackWrap, label)

    // Обновление
    let debounceTimer = null
    input.addEventListener("input", () => {
      const val = Number(input.value)
      const n   = (val - CONFIG.min) / (CONFIG.max - CONFIG.min)
      const p   = n * 100

      fill.style.width    = `${p}%`
      handle.style.left   = `${p}%`
      label.textContent   = formatLabel(val)

      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => applyValue(val), 300)
    })

    return row
  }

  // ─── PROCESS FIELD ─────────────────────────────────────────────────────────

  const seen = new WeakSet()

  function processField(field) {
    if (seen.has(field)) return

    const hasLabel = [...field.querySelectorAll("*")].some(el =>
      [...el.childNodes].some(
        n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() === CONFIG.targetLabel
      )
    )
    if (!hasLabel) return

    seen.add(field)

    field.querySelector(CONFIG.hideSelector)
         ?.style.setProperty("display", "none", "important")

    const val = getSaved()
    field.appendChild(buildSlider(val))
    applyValue(val)
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────

  function scan() {
    document.querySelectorAll(CONFIG.fieldSelector).forEach(processField)
  }

  function init() {
    injectCSS()
    applyValue(getSaved())
    scan()
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init()
})()
