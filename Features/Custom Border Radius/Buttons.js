; (() => {
  "use strict"

  const CONFIG = {
    targetLabel: "Rounding Buttons",
    hideSelector: "._2o2fXzn99OddeqZMjbDuxQ",
    fieldSelector: ".eKmEXJCm_lgme24Fp_HWt",
    storageKey: "nevko-button-rounding",
    min: 0,
    max: 25,
    default: 6,
  }

  const getSaved = () => {
    const s = localStorage.getItem(CONFIG.storageKey)
    return s !== null ? Number(s) : CONFIG.default
  }

  const formatLabel = val => {
    if (val === CONFIG.min) return "Sharp"
    if (val === CONFIG.max) return "Round"
    return `${val}px`
  }

  // применяем значение: выставляем CSS-переменную и сохраняем
  function applyValue(val) {
    document.documentElement.style.setProperty("--button-radius", `${val}px`)
    localStorage.setItem(CONFIG.storageKey, val)
  }

  function buildSlider(currentVal) {
    // стили слайдера уже инжектит RoundingAvatars — если запущен отдельно, добавляем сами
    if (!document.getElementById("nevko-slider-style")) {
      const s = document.createElement("style")
      s.id = "nevko-slider-style"
      s.textContent = `
        .nk-row {
          display: flex;
          align-items: center;
          width: 100%;
          overflow: visible;
          margin-top: 4px;
          gap: 6px;
          max-width: 35%;
          margin-right: 4px;
        }
        .nk-track-wrap {
          flex: 1;
          height: 32px;
          position: relative;
          display: flex;
          align-items: center;
          overflow: visible;
          cursor: pointer;
          padding: 0px 12px 0px 8px;
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
          color: #dcdedf;
          font-weight: bold;
          white-space: nowrap;
          flex-shrink: 0;
          min-width: 38px;
          text-align: center;
        }
        .nk-reset {
          position: relative;
          flex-shrink: 0;
          padding: 8px 14px;
          font-size: 13px;
          line-height: 18px;
          color: #dfe3e6;
          background-color: rgba(59, 63, 72, .5);
          border: none;
          cursor: pointer;
          white-space: nowrap;
          border-radius: 2px;
        }
        .nk-reset::before {
          pointer-events: none;
          user-select: none;
          content: " ";
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          box-shadow: 0 8px 16px 0 rgba(0,0,0,0.3);
          opacity: 0;
        }
        .nk-reset:hover {
          background-color: #464d58;
          color: #fff;
        }
        .nk-reset:hover::before {
          opacity: 1;
        }
        .nk-reset--default {
          opacity: 0;
          pointer-events: none;
        }
      `
        ; (document.head || document.documentElement).appendChild(s)
    }

    const norm = (currentVal - CONFIG.min) / (CONFIG.max - CONFIG.min)
    const pct = norm * 100

    const row = document.createElement("div")
    row.className = "nk-row"

    const trackWrap = document.createElement("div")
    trackWrap.className = "nk-track-wrap"

    const track = document.createElement("div")
    track.className = "nk-track"

    const fill = document.createElement("div")
    fill.className = "nk-fill"
    fill.style.width = `${pct}%`

    const handle = document.createElement("div")
    handle.className = "nk-handle"
    handle.style.left = `${pct}%`

    const arrowNS = "http://www.w3.org/2000/svg"
    const arrow = document.createElementNS(arrowNS, "svg")
    arrow.setAttribute("viewBox", "0 0 36 36")
    arrow.setAttribute("fill", "none")
    arrow.classList.add("nk-arrow")
    const ap = document.createElementNS(arrowNS, "path")
    ap.setAttribute("d", "M17.98 26.54L3.21 11.77H32.75L17.98 26.54Z")
    ap.setAttribute("fill", "currentColor")
    arrow.appendChild(ap)

    const dot = document.createElement("div")
    dot.className = "nk-dot"

    const input = document.createElement("input")
    input.type = "range"
    input.min = CONFIG.min
    input.max = CONFIG.max
    input.value = currentVal
    input.className = "nk-input"

    handle.append(arrow, dot)
    track.append(fill, handle)
    trackWrap.append(track, input)

    const label = document.createElement("span")
    label.className = "nk-label"
    label.textContent = formatLabel(currentVal)

    const reset = document.createElement("button")
    reset.className = "nk-reset"
    reset.textContent = "Reset"

    const updateResetVisibility = val =>
      reset.classList.toggle("nk-reset--default", val === CONFIG.default)

    updateResetVisibility(currentVal)

    row.append(reset, trackWrap, label)

    // визуал мгновенно, applyValue с задержкой — не грузим DOM при спаме
    let debounceTimer = null

    reset.addEventListener("click", () => {
      const def = CONFIG.default
      const n   = (def - CONFIG.min) / (CONFIG.max - CONFIG.min)
      const p   = n * 100
      input.value         = def
      fill.style.width    = `${p}%`
      handle.style.left   = `${p}%`
      label.textContent   = formatLabel(def)
      updateResetVisibility(def)
      applyValue(def)
    })

    input.addEventListener("input", () => {
      const val = Number(input.value)
      const n = (val - CONFIG.min) / (CONFIG.max - CONFIG.min)
      const p = n * 100

      fill.style.width = `${p}%`
      handle.style.left = `${p}%`
      label.textContent = formatLabel(val)
      updateResetVisibility(val)

      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => applyValue(val), 300)
    })

    return row
  }

  const seen = new WeakSet()

  function processField(field) {
    if (seen.has(field)) return

    // ищем поле именно с текстом "Rounding Buttons"
    const hasLabel = [...field.querySelectorAll("*")].some(el =>
      [...el.childNodes].some(
        n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() === CONFIG.targetLabel
      )
    )
    if (!hasLabel) return

    seen.add(field)

    // скрываем оригинальный дропдаун Steam
    field.querySelector(CONFIG.hideSelector)
      ?.style.setProperty("display", "none", "important")

    const val = getSaved()
    field.appendChild(buildSlider(val))
    applyValue(val)
  }

  function scan() {
    document.querySelectorAll(CONFIG.fieldSelector).forEach(processField)
  }

  function init() {
    applyValue(getSaved()) // применяем сразу — до рендера настроек
    scan()
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init()
})()
