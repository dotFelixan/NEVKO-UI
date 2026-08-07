; (() => {
  "use strict"

  // ─── CONFIG ────────────────────────────────────────────────────────────────
  const CONFIG = {
    // --- слайдер 1: обычные аватарки
    avatarLabel:       "Rounding Avatars",
    avatarStorageKey:  "nevko-avatar-rounding",
    avatarDefault:     50,
    avatarMin:         0,
    avatarMax:         50,

    // --- слайдер 2: аватарки с фреймом / игровой иконкой
    framedLabel:       "Rounding Framed Avatars",
    framedStorageKey:  "nevko-framed-avatar-rounding",
    framedDefault:     8,
    framedMin:         0,
    framedMax:         50,

    // селекторы
    hideSelector:  "._2o2fXzn99OddeqZMjbDuxQ",
    fieldSelector: ".eKmEXJCm_lgme24Fp_HWt",
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  const getSaved = (key, def) => {
    const s = localStorage.getItem(key)
    return s !== null ? Number(s) : def
  }

  const formatLabel = (val, max) => {
    if (val === 0)   return "Sharp"
    if (val === max) return "Circle"
    return `${val}%`
  }

  const toRadius = (val, max) => val === max ? "50%" : `${val}%`

  // ─── CSS VARS ──────────────────────────────────────────────────────────────
  function buildRootCSS(avatarVal, framedVal) {
    const norm = avatarVal / CONFIG.avatarMax
    const statusRadius = Math.round(norm * 50)
    return `:root {
      --avatar-radius:       ${toRadius(avatarVal, CONFIG.avatarMax)} !important;
      --status-radius:       ${statusRadius}% !important;
      --frame-avatar-radius: ${toRadius(framedVal, CONFIG.framedMax)} !important;
      --game-avatar-radius:  ${toRadius(framedVal, CONFIG.framedMax)} !important;
    }`
  }

  function applyAll() {
    const av = getSaved(CONFIG.avatarStorageKey, CONFIG.avatarDefault)
    const fr = getSaved(CONFIG.framedStorageKey, CONFIG.framedDefault)
    const pre = document.getElementById("nevko-avatar-radius-preload")
    const css = buildRootCSS(av, fr)
    if (pre) {
      pre.textContent = css
    } else {
      const s = document.createElement("style")
      s.id = "nevko-avatar-radius-preload"
      s.textContent = css
        ; (document.head || document.documentElement).appendChild(s)
    }
    // также ставим через inline style на :root (перебивает specificity)
    const norm = av / CONFIG.avatarMax
    const statusRadius = Math.round(norm * 50)
    document.documentElement.style.setProperty("--avatar-radius",       toRadius(av, CONFIG.avatarMax))
    document.documentElement.style.setProperty("--status-radius",       `${statusRadius}%`)
    document.documentElement.style.setProperty("--frame-avatar-radius", toRadius(fr, CONFIG.framedMax))
    document.documentElement.style.setProperty("--game-avatar-radius",  toRadius(fr, CONFIG.framedMax))
  }

  // ─── BASE CSS ──────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById("nevko-rounding-style")) return
    // Ставим переменные до вставки style-блока чтобы не было fallback-мигания
    applyAll()
    const style = document.createElement("style")
    style.id = "nevko-rounding-style"
    style.textContent = `
      ._1xTATKELHR-lRS_s3A4yzd ._36eQg-jp1ebbdaE6PBniHu,
      ._3dncOt2dhpnFYQn-WYQ3Mb ._2JYwpg3-WbCSXH-w5h-zL_,
      .ChatRoomMultiFriendAvatar,
      ._3h-QRJGxnVOIExtHD1R0f2 {
        border-radius: var(--avatar-radius, 50%) !important;
      }

      /* аватарка с рамкой (любой статус, включая офлайн) — без игровой иконки */
      .avatarHolder:has(.avatarFrame):not(:has(.FavoriteFriend_GameIcon)) img.avatar,
      .avatarHolder:has(.avatarFrame):not(:has(.FavoriteFriend_GameIcon)) ._3h-QRJGxnVOIExtHD1R0f2,
      ._3h-QRJGxnVOIExtHD1R0f2:has(+ ._2nPONxDUmK4rQXzK4Y3vG2) {
        border-radius: var(--frame-avatar-radius) !important;
        outline: unset !important;
      }

      /* аватарка с рамкой + игровой иконкой */
      .avatarHolder:has(.FavoriteFriend_GameIcon):has(.avatarFrame) img.avatar,
      .avatarHolder:has(.FavoriteFriend_GameIcon):has(.avatarFrame) ._3h-QRJGxnVOIExtHD1R0f2 {
        border-radius: var(--game-avatar-radius) !important;
      }

      /* рамка и её изображение остаются прямоугольными */
      .avatarFrame,
      img.avatarFrameImg {
        border-radius: 0 !important;
      }

      ._3xUpb5DWXPFNcHHIcv-9pe.right,
      ._3xUpb5DWXPFNcHHIcv-9pe.bottom {
        border-radius: var(--status-radius, 28%);
      }
    `
      ; (document.head || document.documentElement).appendChild(style)
  }

  // ─── SLIDER CSS ────────────────────────────────────────────────────────────
  function injectSliderCSS() {
    if (document.getElementById("nevko-slider-style")) return
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
        transform: translateX(-50%) translateY(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
        overflow: visible;
        z-index: 2;
      }
      .nk-arrow { display: none; }
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
      .nk-reset:hover { background-color: #464d58; color: #fff; }
      .nk-reset:hover::before { opacity: 1; }
      .nk-reset--default { opacity: 0; pointer-events: none; }
      .nk-default-marker {
        position: absolute;
        top: -18px;
        transform: translateX(-50%);
        pointer-events: none;
        z-index: 1;
        color: rgba(255,255,255,0.6);
        width: 12px;
        height: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .nk-default-marker svg { width: 12px; height: 12px; display: block; }
    `
      ; (document.head || document.documentElement).appendChild(s)
  }

  // ─── SLIDER BUILDER ────────────────────────────────────────────────────────
  // storageKey, min, max, defaultVal — конфиг конкретного слайдера
  // onchange(val) — колбэк при изменении (применяет нужные CSS-переменные)
  function buildSlider({ storageKey, min, max, defaultVal, onchange }) {
    injectSliderCSS()

    const currentVal = getSaved(storageKey, defaultVal)
    const norm  = (currentVal - min) / (max - min)
    const pct   = norm * 100

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

    const ns = "http://www.w3.org/2000/svg"
    const arrow = document.createElementNS(ns, "svg")
    arrow.setAttribute("viewBox", "0 0 36 36")
    arrow.setAttribute("fill", "none")
    arrow.classList.add("nk-arrow")
    const ap = document.createElementNS(ns, "path")
    ap.setAttribute("d", "M17.98 26.54L3.21 11.77H32.75L17.98 26.54Z")
    ap.setAttribute("fill", "currentColor")
    arrow.appendChild(ap)

    const dot = document.createElement("div")
    dot.className = "nk-dot"

    const input = document.createElement("input")
    input.type  = "range"
    input.min   = min
    input.max   = max
    input.value = currentVal
    input.className = "nk-input"

    // маркер дефолтного значения
    const defNorm = (defaultVal - min) / (max - min)
    const defMarker = document.createElement("div")
    defMarker.className = "nk-default-marker"
    defMarker.style.left = `${defNorm * 100}%`
    const defSvg  = document.createElementNS(ns, "svg")
    defSvg.setAttribute("viewBox", "0 0 36 36")
    defSvg.setAttribute("fill", "none")
    const defPath = document.createElementNS(ns, "path")
    defPath.setAttribute("d", "M17.98 26.54L3.21 11.77H32.75L17.98 26.54Z")
    defPath.setAttribute("fill", "currentColor")
    defSvg.appendChild(defPath)
    defMarker.appendChild(defSvg)
    track.appendChild(defMarker)

    handle.append(arrow, dot)
    track.append(fill, handle)
    trackWrap.append(track, input)

    const label = document.createElement("span")
    label.className = "nk-label"
    label.textContent = formatLabel(currentVal, max)

    const reset = document.createElement("button")
    reset.className = "nk-reset"
    reset.textContent = "Reset"

    const updateResetVisibility = val =>
      reset.classList.toggle("nk-reset--default", val === defaultVal)
    updateResetVisibility(currentVal)

    row.append(reset, trackWrap, label)

    let debounceTimer = null

    reset.addEventListener("click", () => {
      const n = (defaultVal - min) / (max - min)
      const p = n * 100
      input.value           = defaultVal
      fill.style.width      = `${p}%`
      handle.style.left     = `${p}%`
      label.textContent     = formatLabel(defaultVal, max)
      updateResetVisibility(defaultVal)
      localStorage.setItem(storageKey, defaultVal)
      onchange(defaultVal)
    })

    input.addEventListener("input", () => {
      const val = Number(input.value)
      const n   = (val - min) / (max - min)
      const p   = n * 100
      fill.style.width  = `${p}%`
      handle.style.left = `${p}%`
      label.textContent = formatLabel(val, max)
      updateResetVisibility(val)
      localStorage.setItem(storageKey, val)
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => onchange(val), 300)
    })

    return row
  }

  // ─── FIELD INJECTION ──────────────────────────────────────────────────────
  const seen = new WeakSet()

  function processField(field) {
    if (seen.has(field)) return

    const labelNodes = [...field.querySelectorAll("*")].flatMap(el =>
      [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE)
    )
    const text = labelNodes.map(n => n.textContent.trim()).find(t =>
      t === CONFIG.avatarLabel || t === CONFIG.framedLabel
    )
    if (!text) return

    seen.add(field)

    field.querySelector(CONFIG.hideSelector)
      ?.style.setProperty("display", "none", "important")

    if (text === CONFIG.avatarLabel) {
      field.appendChild(buildSlider({
        storageKey:  CONFIG.avatarStorageKey,
        min:         CONFIG.avatarMin,
        max:         CONFIG.avatarMax,
        defaultVal:  CONFIG.avatarDefault,
        onchange:    () => applyAll(),
      }))
    }

    if (text === CONFIG.framedLabel) {
      field.appendChild(buildSlider({
        storageKey:  CONFIG.framedStorageKey,
        min:         CONFIG.framedMin,
        max:         CONFIG.framedMax,
        defaultVal:  CONFIG.framedDefault,
        onchange:    () => applyAll(),
      }))
    }
  }

  function scan() {
    document.querySelectorAll(CONFIG.fieldSelector).forEach(processField)
  }

  function init() {
    injectCSS()
    applyAll()
    scan()
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init()
})()
