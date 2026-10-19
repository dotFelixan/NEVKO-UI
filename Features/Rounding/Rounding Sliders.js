// Rounding sliders (avatars, framed avatars, group avatars, buttons, chat messages) | localStorage -> CSS vars
// --avatar-radius, --status-radius, --frame-avatar-radius, --game-avatar-radius, --group-avatar-radius,
// --button-radius, --message-radius

;(() => {
  "use strict"

  const SLIDERS = [
    {
      label: "Rounding Avatars",
      key: "nevko-avatar-rounding",
      min: 0, max: 50, default: 50,
      format: value => value === 0 ? "Sharp" : value === 50 ? "Circle" : `${value}%`,
    },
    {
      label: "Rounding Framed Avatars",
      key: "nevko-framed-avatar-rounding",
      min: 0, max: 50, default: 20,
      format: value => value === 0 ? "Sharp" : value === 50 ? "Circle" : `${value}%`,
    },
    {
      label: "Rounding Group Avatars",
      key: "nevko-group-avatar-rounding",
      min: 0, max: 50, default: 25,
      format: value => value === 0 ? "Sharp" : value === 50 ? "Circle" : `${value}%`,
    },
    {
      label: "Rounding Buttons",
      key: "nevko-button-rounding",
      min: 0, max: 25, default: 6,
      format: value => value === 0 ? "Sharp" : value === 25 ? "Round" : `${value}px`,
    },
    {
      label: "Rounding Messages",
      key: "nevko-message-rounding",
      min: 0, max: 16, default: 16, // 16px = half of a one-line bubble
      format: value => value === 0 ? "Sharp" : value === 16 ? "Round" : `${value}px`,
    },
  ]

  const [AVATARS, FRAMED, GROUPS, BUTTONS, MESSAGES] = SLIDERS

  const SETTINGS_ROW = ".eKmEXJCm_lgme24Fp_HWt"
  const NATIVE_DROPDOWN = "._2o2fXzn99OddeqZMjbDuxQ"


  // Values & CSS Vars

  function readValue(slider) {
    const saved = localStorage.getItem(slider.key)
    return saved === null ? slider.default : Number(saved)
  }

  // Framed avatar dot: min 25%, Sharp stays Sharp
  const framedStatusRadius = framed => framed === 0 ? 0 : Math.max(framed, 25)

  function applyVariables() {
    const avatar = readValue(AVATARS)
    const framed = readValue(FRAMED)
    const group = readValue(GROUPS)
    const button = readValue(BUTTONS)
    const message = readValue(MESSAGES)

    let style = document.getElementById("nevko-rounding-vars")
    if (!style) {
      style = document.createElement("style")
      style.id = "nevko-rounding-vars"
      ;(document.head || document.documentElement).append(style)
    }
    style.textContent = `:root {
      --avatar-radius: ${avatar}% !important;
      --status-radius: ${avatar}% !important;
      --frame-avatar-radius: ${framed}% !important;
      --game-avatar-radius: ${framed}% !important;
      --frame-status-radius: ${framedStatusRadius(framed)}% !important;
      --group-avatar-radius: ${group}% !important;
      --button-radius: ${button}px !important;
      --message-radius: ${message}px !important;
    }`
  }


  // Slider

  const ARROW_PATH = "M17.98 26.54L3.21 11.77H32.75L17.98 26.54Z"

  function element(tag, className) {
    const el = document.createElement(tag)
    if (className) el.className = className
    return el
  }

  // Default Marker
  function defaultMarker(percent) {
    const marker = element("div", "nk-default-marker")
    marker.style.left = `${percent}%`
    marker.innerHTML = `<svg viewBox="0 0 36 36" fill="none"><path d="${ARROW_PATH}" fill="currentColor"/></svg>`
    return marker
  }

  function createSlider(slider) {
    const toPercent = value => (value - slider.min) / (slider.max - slider.min) * 100

    const row = element("div", "nk-row")
    const reset = element("button", "nk-reset")
    const trackWrap = element("div", "nk-track-wrap")
    const track = element("div", "nk-track")
    const fill = element("div", "nk-fill")
    const handle = element("div", "nk-handle")
    const input = element("input", "nk-input")
    const label = element("span", "nk-label")

    reset.textContent = "Reset"
    handle.append(element("div", "nk-dot"))
    track.append(defaultMarker(toPercent(slider.default)), fill, handle)
    trackWrap.append(track, input)
    row.append(reset, trackWrap, label)

    Object.assign(input, { type: "range", min: slider.min, max: slider.max })

    // Redraw
    function show(value) {
      input.value = value
      fill.style.width = handle.style.left = `${toPercent(value)}%`
      label.textContent = slider.format(value)
      reset.classList.toggle("nk-reset--default", value === slider.default)
    }

    // Save on release only (each localStorage write wakes all windows)
    function save(value) {
      show(value)
      if (localStorage.getItem(slider.key) === String(value)) return
      localStorage.setItem(slider.key, value)
      applyVariables()
    }

    // Dragging
    input.addEventListener("input", () => show(Number(input.value)))
    // Released / arrow key
    input.addEventListener("change", () => save(Number(input.value)))
    reset.addEventListener("click", () => save(slider.default))

    show(readValue(slider))
    return row
  }


  // Find Rows

  const done = new WeakSet()

  function findLabel(row) {
    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const slider = SLIDERS.find(s => s.label === node.textContent.trim())
      if (slider) return slider
    }
    return null
  }

  function addSliders() {
    for (const row of document.querySelectorAll(SETTINGS_ROW)) {
      if (done.has(row)) continue
      const slider = findLabel(row)
      if (!slider) continue

      done.add(row)
      row.querySelector(NATIVE_DROPDOWN)?.style.setProperty("display", "none", "important")
      row.append(createSlider(slider))
    }
  }


  // Styles

  const AVATAR_CSS = `
    ._1xTATKELHR-lRS_s3A4yzd ._36eQg-jp1ebbdaE6PBniHu,
    ._3dncOt2dhpnFYQn-WYQ3Mb ._2JYwpg3-WbCSXH-w5h-zL_,
    ._3h-QRJGxnVOIExtHD1R0f2 {
      border-radius: var(--avatar-radius, 50%) !important;
    }

    /* Group chats and groups: their own slider */
    .ChatRoomGroupAvatar,
    .ChatRoomGroupAvatar img,
    .ChatRoomMultiFriendAvatar {
      border-radius: var(--group-avatar-radius, 50%) !important;
    }

    /* Framed Avatar */
    .avatarHolder:has(.avatarFrame):not(:has(.FavoriteFriend_GameIcon)) :is(img.avatar, ._3h-QRJGxnVOIExtHD1R0f2),
    ._3h-QRJGxnVOIExtHD1R0f2:has(+ ._2nPONxDUmK4rQXzK4Y3vG2) {
      border-radius: var(--frame-avatar-radius) !important;
      outline: unset !important;
    }

    /* Framed Avatar + Game Icon */
    .avatarHolder:has(.FavoriteFriend_GameIcon):has(.avatarFrame) :is(img.avatar, ._3h-QRJGxnVOIExtHD1R0f2) {
      border-radius: var(--game-avatar-radius) !important;
    }

    /* Framed Avatar: dot, game icon, nickname bracket */
    .avatarHolder:has(.avatarFrame),
    .nibodjvvrm86uCfnnAn4g:has(._2nPONxDUmK4rQXzK4Y3vG2),
    .favoriteElement:has(.avatarFrame) + .playerNameQuickAccessContainer,
    .favoriteElement:has(.avatarFrame) .playerNameQuickAccessContainer {
      --status-radius: var(--frame-status-radius, 25%);
    }

    /* Frame Stays Square */
    .avatarFrame,
    img.avatarFrameImg { border-radius: 0 !important; }

    ._3xUpb5DWXPFNcHHIcv-9pe:is(.right, .bottom) { border-radius: var(--status-radius, 28%); }
  `

  const SLIDER_CSS = `
    .nk-row {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      max-width: 35%;
      margin: 4px 4px 0 0;
      overflow: visible;
    }
    .nk-track-wrap {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      height: 32px;
      padding: 0 12px 0 8px;
      overflow: visible;
      cursor: pointer;
    }
    .nk-track {
      position: relative;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var(--slider-track);
      pointer-events: none;
    }
    .nk-fill {
      position: absolute;
      inset: 0 auto 0 0;
      border-radius: 3px;
      background: var(--slider-fill);
      pointer-events: none;
    }
    .nk-handle {
      position: absolute;
      top: 50%;
      z-index: 2;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .nk-dot { width: 18px; height: 18px; border-radius: 50%; background: var(--slider-thumb); }
    .nk-input {
      position: absolute;
      inset: 0;
      z-index: 3;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      opacity: 0;
      cursor: pointer;
    }
    .nk-label {
      flex-shrink: 0;
      min-width: 38px;
      color: var(--text-soft-color);
      font-size: 13px;
      font-weight: bold;
      text-align: center;
      white-space: nowrap;
    }
    .nk-reset {
      position: relative;
      flex-shrink: 0;
      padding: 8px 14px;
      border: none;
      border-radius: 2px;
      background-color: var(--settings-button-background);
      color: var(--text-light-color);
      font-size: 13px;
      line-height: 18px;
      white-space: nowrap;
      cursor: pointer;
    }
    .nk-reset::before {
      content: " ";
      position: absolute;
      inset: 0;
      box-shadow: 0 8px 16px 0 var(--shadow-soft);
      opacity: 0;
      pointer-events: none;
    }
    .nk-reset:hover { background-color: var(--settings-button-hover-background); color: var(--text-bright-color); }
    .nk-reset:hover::before { opacity: 1; }
    .nk-reset--default { opacity: 0; pointer-events: none; }
    .nk-default-marker {
      position: absolute;
      top: -18px;
      z-index: 1;
      display: flex;
      width: 12px;
      height: 12px;
      transform: translateX(-50%);
      color: var(--slider-marker);
      pointer-events: none;
    }
    .nk-default-marker svg { display: block; width: 12px; height: 12px; }
  `


  // Start

  // Vars before DOM, no flash
  applyVariables()

  function init() {
    const style = document.createElement("style")
    style.id = "nevko-rounding-style"
    style.textContent = AVATAR_CSS + SLIDER_CSS
    document.head.append(style)

    addSliders()

    let frame = null
    new MutationObserver(() => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = null
        addSliders()
      })
    }).observe(document.body, { childList: true, subtree: true })

    // Changed in another window
    addEventListener("storage", event => {
      if (SLIDERS.some(slider => slider.key === event.key)) applyVariables()
    })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
