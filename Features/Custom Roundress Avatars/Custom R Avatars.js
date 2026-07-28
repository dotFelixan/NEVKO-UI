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

  function buildSlider(currentVal) {
    const norm = (currentVal - CONFIG.min) / (CONFIG.max - CONFIG.min)

    // Трек
    const track = document.createElement("div")
    track.className = "_2_vG6TwMW2XtyLlTEaODH9"
    track.style.cssText = "overflow: visible;"
    track.style.setProperty("--normalized-slider-value", norm)
    track.style.setProperty("--normalized-slider-origin", 0)
    track.style.setProperty("--slider-extra-notch-padding", "0px")

    // Обёртка ручки
    const handleWrap = document.createElement("div")
    handleWrap.className = "_2aCoHO7mXYYdPXMN0USBAW"
    handleWrap.style.cssText = "overflow: visible; contain: none;"
    handleWrap.style.setProperty("--inverse-normalized-default-value", 1 - norm)

    // Ручка: стрелка + кружок
    const handle = document.createElement("div")
    handle.className = "_1NgUy7a2LKuF-moe-rzsiH"
    handle.style.cssText = "overflow: visible; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; margin-top: -5px;"

    const mkSvg = (viewBox) => {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      s.setAttribute("viewBox", viewBox)
      s.setAttribute("fill", "none")
      return s
    }

    // Стрелка
    const arrow = mkSvg("0 0 36 36")
    arrow.style.cssText = "color: #8b929a; width: 16px; height: 16px; display: block; position: relative; z-index: 11; transform: translateY(-50%);"
    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    arrowPath.setAttribute("d", "M17.98 26.54L3.20996 11.77H32.75L17.98 26.54Z")
    arrowPath.setAttribute("fill", "currentColor")
    arrow.appendChild(arrowPath)

    // Кружок
    const dot = mkSvg("0 0 24 24")
    dot.style.cssText = "width: 24px; height: 24px; display: block; position: relative; z-index: 10; flex-shrink: 0;"
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    circle.setAttribute("cx", "12")
    circle.setAttribute("cy", "12")
    circle.setAttribute("r", "10")
    circle.setAttribute("fill", "#ffffff")
    dot.appendChild(circle)

    handle.append(arrow, dot)
    handleWrap.appendChild(handle)
    track.appendChild(handleWrap)

    // Скрытый input поверх трека
    const input = document.createElement("input")
    input.type = "range"
    input.min = CONFIG.min
    input.max = CONFIG.max
    input.value = currentVal
    input.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; margin: 0; z-index: 20;"

    // Обёртка трека + input
    const wrap = document.createElement("div")
    wrap.className = "_1udlGGE4F5pggcpxovorUd"
    wrap.style.cssText = "flex: 1; cursor: pointer; position: relative; overflow: visible;"
    wrap.style.setProperty("--slider-handle-width", "24px")
    wrap.append(track, input)

    // Лейбл
    const label = document.createElement("span")
    label.textContent = formatLabel(currentVal)
    label.style.cssText = "min-width: 42px; text-align: right; font-size: 13px; color: #c6d4df; font-weight: bold; margin-left: 8px; flex-shrink: 0;"

    input.addEventListener("input", () => {
      const val = Number(input.value)
      const n   = (val - CONFIG.min) / (CONFIG.max - CONFIG.min)
      label.textContent = formatLabel(val)
      track.style.setProperty("--normalized-slider-value", n)
      handleWrap.style.setProperty("--inverse-normalized-default-value", 1 - n)
      applyValue(val)
    })

    const outer = document.createElement("div")
    outer.style.cssText = "display: flex; align-items: center; flex: 1; overflow: visible;"
    outer.append(wrap, label)

    return outer
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

  // ─── INIT ──────────────────────────────────────────────────────────────────

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
