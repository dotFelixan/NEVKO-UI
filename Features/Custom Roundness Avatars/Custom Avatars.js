; (() => {
  "use strict"

  // ─── CONFIG ────────────────────────────────────────────────────────────────
  const CONFIG = {
    targetLabel: "Rounding Avatars",
    hideSelector: "._2o2fXzn99OddeqZMjbDuxQ",
    fieldSelector: ".eKmEXJCm_lgme24Fp_HWt",
    storageKey: "nevko-avatar-rounding",
    min: 0,
    max: 50,
    default: 50,
    // Rounding for avatars with a custom frame OR a game icon.
    // Change this one value (0–50) to control both cases at once.
    framedAvatarRounding: 4,
  }

  // достаём сохранённое значение, если нет — берём дефолт
  const getSaved = () => {
    const s = localStorage.getItem(CONFIG.storageKey)
    return s !== null ? Number(s) : CONFIG.default
  }

  // текст рядом со слайдером
  const formatLabel = val => {
    if (val === CONFIG.min) return "Sharp"
    if (val === CONFIG.max) return "Circle"
    return `${val}%`
  }

  // значение → css border-radius
  const toRadius = val => val === CONFIG.max ? "50%" : `${val}%`

  // вставляем стили один раз — они нужны чтобы аватарки реагировали на CSS-переменную
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

      /* Avatar WITH a custom frame but WITHOUT a game icon — use frame-specific rounding.
         When FavoriteFriend_GameIcon is present (ingame), keep standard avatar rounding. */
      img.avatar:has(+ .avatarFrame):not(:has(~ .FavoriteFriend_GameIcon)):not(:has(+ .FavoriteFriend_GameIcon)),
      ._3h-QRJGxnVOIExtHD1R0f2:has(+ .avatarFrame):not(:has(~ .FavoriteFriend_GameIcon)):not(:has(+ .FavoriteFriend_GameIcon)) {
        border-radius: var(--frame-avatar-radius, 5%) !important;
        outline: unset !important;
      }
      /* avatarHolder with BOTH a game icon AND a frame — use framed avatar rounding */
      .avatarHolder:has(.FavoriteFriend_GameIcon):has(.avatarFrame) img.avatar,
      .avatarHolder:has(.FavoriteFriend_GameIcon):has(.avatarFrame) ._3h-QRJGxnVOIExtHD1R0f2 {
        border-radius: var(--game-avatar-radius, 0%) !important;
      }

      /* Frame image and frame container are NEVER rounded — decorative overlay only */
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

  // инжектируем сохранённое значение через <style> немедленно — до любого рендера
  function injectSavedAsStyle() {
    const id = "nevko-avatar-radius-preload"
    if (document.getElementById(id)) return
    const val = getSaved()
    const norm = val / CONFIG.max
    const statusRadius = Math.round(norm * 50)
    const s = document.createElement("style")
    s.id = id
    s.textContent = `:root { --avatar-radius: ${toRadius(val)} !important; --status-radius: ${statusRadius}% !important; --frame-avatar-radius: ${CONFIG.framedAvatarRounding}% !important; --game-avatar-radius: ${CONFIG.framedAvatarRounding}% !important; }`
      ; (document.head || document.documentElement).appendChild(s)
  }

  // применяем значение: обновляем CSS-переменные и сохраняем в localStorage
  function applyValue(val) {
    const norm = val / CONFIG.max
    const statusRadius = Math.round(norm * 50)
    const framedRadius = `${CONFIG.framedAvatarRounding}%`
    document.documentElement.style.setProperty("--avatar-radius", toRadius(val))
    document.documentElement.style.setProperty("--status-radius", `${statusRadius}%`)
    document.documentElement.style.setProperty("--frame-avatar-radius", framedRadius)
    document.documentElement.style.setProperty("--game-avatar-radius", framedRadius)
    localStorage.setItem(CONFIG.storageKey, val)
    const pre = document.getElementById("nevko-avatar-radius-preload")
    if (pre) pre.textContent = `:root { --avatar-radius: ${toRadius(val)} !important; --status-radius: ${statusRadius}% !important; --frame-avatar-radius: ${framedRadius} !important; --game-avatar-radius: ${framedRadius} !important; }`
  }

  injectSavedAsStyle()

  // стили слайдера — отдельно от основных, чтобы не пересобирать при каждом вызове
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
      .nk-arrow {
        display: none;
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
      /* при дефолтном значении кнопка визуально пропадает */
      .nk-reset--default {
        opacity: 0;
        pointer-events: none;
      }
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
      .nk-default-marker svg {
        width: 12px;
        height: 12px;
        display: block;
      }
    `
      ; (document.head || document.documentElement).appendChild(s)
  }

  function buildSlider(currentVal) {
    injectSliderCSS()

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

    // маркер дефолтного значения на треке
    const defaultNorm = (CONFIG.default - CONFIG.min) / (CONFIG.max - CONFIG.min)
    const defaultPct = defaultNorm * 100
    const defMarker = document.createElement("div")
    defMarker.className = "nk-default-marker"
    defMarker.style.left = `${defaultPct}%`
    const defNS = "http://www.w3.org/2000/svg"
    const defSvg = document.createElementNS(defNS, "svg")
    defSvg.setAttribute("viewBox", "0 0 36 36")
    defSvg.setAttribute("fill", "none")
    const defPath = document.createElementNS(defNS, "path")
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
    label.textContent = formatLabel(currentVal)

    const reset = document.createElement("button")
    reset.className = "nk-reset"
    reset.textContent = "Reset"

    // показываем кнопку только когда значение отличается от дефолт��
    const updateResetVisibility = val =>
      reset.classList.toggle("nk-reset--default", val === CONFIG.default)

    updateResetVisibility(currentVal)

    row.append(reset, trackWrap, label)

    // визуал обновляется мгновенно, applyValue с задержкой — не грузим DOM при спаме
    let debounceTimer = null

    reset.addEventListener("click", () => {
      const def = CONFIG.default
      const n = (def - CONFIG.min) / (CONFIG.max - CONFIG.min)
      const p = n * 100
      input.value = def
      fill.style.width = `${p}%`
      handle.style.left = `${p}%`
      label.textContent = formatLabel(def)
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

    // ищем поле именно с текстом "Rounding Avatars" — не трогаем ��ужие элементы
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
    injectCSS()
    applyValue(getSaved()) // применяем сразу — до рендера настроек
    scan()
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init()
})()
