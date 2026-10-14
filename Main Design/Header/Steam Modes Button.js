// Steam Modes button in header (Big Picture, SteamVR)

;(() => {
  "use strict"

  const BUTTON_ID = "nk-custom-btn"
  const BAR = "._3vCzSrrXZzZjVJFZNg9SGu" // header right buttons

  const MODES = [
    { label: "Big Picture", url: "steam://open/bigpicture" },
    { label: "SteamVR",     url: "steam://rungameid/250820" },
  ]

  const ICON = "M 18.8891 3.1665 H 1.11133 V 14.7776 H 5.88911 L 5.00022 17.9443 H 15.0002 L 14.1113 14.7776 H 18.8891 V 3.1665 Z M 16.6669 12.6665 H 3.33355 V 5.27762 H 16.6669 V 12.6665 Z"


  // Language

  const STEAM_LANGUAGES = {
    english: "en", russian: "ru", ukrainian: "uk", german: "de", french: "fr",
    polish: "pl", spanish: "es", latam: "es-419", portuguese: "pt", brazilian: "pt-br",
    italian: "it", dutch: "nl", czech: "cs", hungarian: "hu", romanian: "ro",
    greek: "el", finnish: "fi", swedish: "sv", norwegian: "no", danish: "da",
    turkish: "tr", arabic: "ar", thai: "th", vietnamese: "vi", indonesian: "id",
    koreana: "ko", japanese: "ja", schinese: "zh-cn", tchinese: "zh-tw",
  }

  function getLanguage() {
    const steamName = window.LocalizationManager?.m_strLanguage || window.g_strLanguage
    const fromSteam = steamName && STEAM_LANGUAGES[steamName.toLowerCase()]
    return (fromSteam || document.documentElement.lang || navigator.language || "en").toLowerCase()
  }

  function translate(table) {
    const lang = getLanguage()
    return table[lang] ?? table[lang.split("-")[0]] ?? table.en
  }

  const TOOLTIP_TEXT = translate({
    en: "Steam Modes", ru: "Режимы Steam", uk: "Режими Steam", de: "Steam-Modi",
    fr: "Modes Steam", pl: "Tryby Steam", es: "Modos de Steam", pt: "Modos Steam",
    it: "Modalità Steam", nl: "Steam-modi", cs: "Režimy Steam", hu: "Steam módok",
    ro: "Moduri Steam", el: "Λειτουργίες Steam", fi: "Steam-tilat", sv: "Steam-lägen",
    no: "Steam-modi", da: "Steam-tilstande", tr: "Steam Modları", ar: "أوضاع Steam",
    th: "โหมด Steam", vi: "Chế độ Steam", id: "Mode Steam", ko: "Steam 모드",
    ja: "Steamモード", "zh-cn": "Steam 模式", "zh-tw": "Steam 模式",
  })


  // Menu: a real Steam menu (theme style, in the page or above a web page like the other menus)

  const MENU_CLASS = "_2EstNjFIIZm_WUSKm5Wt7n contextMenuContents _3pofGqV0buiKAfMPEs3_82 MenuPopup"
  const ITEM_CLASS = "_2jXHP0742MyApMUVUM8IFn MenuItem _1n7Wloe5jZ6fSuvV18NNWI contextMenuItem"

  let registry = null
  let instance = null
  let openOnMouseDown = false

  // Steam menu manager of this window (SharedJSContext webpack), looked up on first click
  function getRegistry() {
    if (registry) return registry
    const shared = window.opener
    let req
    try { shared.webpackChunksteamui.push([[Symbol("nk-modes")], {}, r => { req = r }]) } catch { return null }
    for (const [id, factory] of Object.entries(req?.m || {})) {
      if (!factory.toString().includes("GetContextMenuManagerFromWindow")) continue
      try { registry = Object.values(req(id)).find(v => v?.GetContextMenuManager) || null } catch {}
      if (registry) break
    }
    return registry
  }

  const isMenuOpen = () => !!instance?.visible

  function openMenu(button) {
    const React = window.opener?.SP_REACT
    const manager = React && getRegistry()?.GetContextMenuManager(window)
    if (!manager) return

    const items = MODES.map(mode => React.createElement("div", {
      key: mode.url,
      className: ITEM_CLASS,
      onClick: () => {
        closeMenu()
        location.href = mode.url
      },
    }, mode.label))
    const element = React.createElement("div", { className: MENU_CLASS }, items)

    instance = manager.CreateContextMenuInstance(element, button, undefined, undefined, {
      bOverlapHorizontal: true, bForcePopup: true, title: "Steam Modes Menu",
    })
    instance.SetOnHideCallback(() => button.classList.remove("nk-menu-open"))
    instance.Show()
    button.classList.add("nk-menu-open")
  }

  function closeMenu() {
    try { instance?.Hide() } catch {}
    document.getElementById(BUTTON_ID)?.classList.remove("nk-menu-open")
  }


  // Button

  function createButton() {
    const button = document.createElement("div")
    button.id = BUTTON_ID

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("viewBox", "0 0 20 20")
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", ICON)
    svg.append(path)

    const tip = document.createElement("span")
    tip.className = "nk-custom-btn-tip"
    tip.textContent = TOOLTIP_TEXT

    button.append(svg, tip)

    // Fixed tooltip
    button.addEventListener("mouseenter", () => requestAnimationFrame(() => {
      const r = button.getBoundingClientRect()
      tip.style.left = Math.round(r.left + r.width / 2 - (tip.offsetWidth || 80) / 2) + "px"
      tip.style.top = Math.round(r.bottom + 8) + "px"
    }))

    // The open menu closes on mousedown (focus leaves it): remember it so the click doesn't reopen it
    button.addEventListener("mousedown", () => { openOnMouseDown = isMenuOpen() }, true)
    button.addEventListener("click", event => {
      event.stopPropagation()
      if (openOnMouseDown || isMenuOpen()) closeMenu()
      else openMenu(button)
      openOnMouseDown = false
    })

    return button
  }

  // React redraw
  function ensureButton() {
    if (document.getElementById(BUTTON_ID)) return
    document.querySelector(BAR)?.append(createButton())
  }


  // Start

  function injectStyles() {
    const style = document.createElement("style")
    style.id = "nk-custom-btn-style"
    style.textContent = `
      /* Second Place */
      #${BUTTON_ID} { order: 2; }
      ._2EQ7ghgqIdjKv9jsQC0Zq9 { order: 3 !important; }
      ._1TdaAqMFadi0UTqilrkelR { order: 4 !important; }

      #${BUTTON_ID} {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        min-width: 24px;
        min-height: 32px;
        max-height: 32px;
        padding: 0 4px;
        border-radius: var(--button-radius);
        background-color: var(--button-background);
        cursor: pointer;
        -webkit-app-region: no-drag;
        transition: background-color .15s ease-out;
      }
      #${BUTTON_ID}:hover { background-color: var(--button-hover-background); }

      #${BUTTON_ID} svg {
        display: block;
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        fill: currentColor;
        color: var(--icon-color);
        transition: color .1s ease-in-out;
      }
      #${BUTTON_ID}:hover svg { color: var(--text-bright-color); }

      #${BUTTON_ID} .nk-custom-btn-tip {
        position: fixed;
        top: -9999px;
        left: -9999px;
        z-index: 999999;
        width: fit-content;
        max-width: 300px;
        padding: 6px 8px;
        border-radius: 2px;
        background-color: var(--tooltip-background);
        color: var(--tooltip-text);
        font-size: 13px;
        white-space: nowrap;
        box-shadow: 1px 1px 8px var(--tooltip-shadow), 2px 2px 16px 1px var(--tooltip-shadow);
        pointer-events: none;
        user-select: none;
        opacity: 0;
        transition: opacity .25s;
      }
      #${BUTTON_ID}:hover .nk-custom-btn-tip { opacity: 1; }
      #${BUTTON_ID}.nk-menu-open .nk-custom-btn-tip { opacity: 0 !important; }

    `
    document.head.append(style)
  }

  function init() {
    injectStyles()
    ensureButton()

    let frame = null
    new MutationObserver(() => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = null
        ensureButton()
      })
    }).observe(document.body, { childList: true, subtree: true })

    addEventListener("resize", closeMenu)
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
