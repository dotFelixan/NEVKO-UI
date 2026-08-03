;(() => {
  // ── настройки ──────────────────────────────────────────────────────────────
  const BUTTON_ID      = "nk-custom-btn"
  const STYLE_ID       = "nk-custom-btn-style"
  // контейнер кнопок в шапке Steam
  const BAR_SEL        = "._3vCzSrrXZzZjVJFZNg9SGu"
  // иконка кнопки (SVG path)
  const ICON_PATH      = "M 18.8891 3.1665 H 1.11133 V 14.7776 H 5.88911 L 5.00022 17.9443 H 15.0002 L 14.1113 14.7776 H 18.8891 V 3.1665 Z M 16.6669 12.6665 H 3.33355 V 5.27762 H 16.6669 V 12.6665 Z"
  // ._2foCkpRXhqq0UGVE50BWqj = order:1, наша = order:2, ._2EQ7ghgqIdjKv9jsQC0Zq9 сдвигаем на 3, ._1TdaAqMFadi0UTqilrkelR на 4
  const BUTTON_ORDER   = 2
  // переводы тултипа на все языки Steam (определяется по языку интерфейса)
  const TOOLTIP_TRANSLATIONS = {
    // английский
    "english":    "Steam Modes",
    // русский
    "russian":    "Режимы Steam",
    // украинский
    "ukrainian":  "Режими Steam",
    // немецкий
    "german":     "Steam-Modi",
    // французский
    "french":     "Modes Steam",
    // польский
    "polish":     "Tryby Steam",
    // испанский
    "spanish":    "Modos de Steam",
    // portuguese
    "portuguese": "Modos Steam",
    // итальянский
    "italian":    "Modalità Steam",
    // нидерландский
    "dutch":      "Steam-modi",
    // чешский
    "czech":      "Režimy Steam",
    // венгерский
    "hungarian":  "Steam módok",
    // румынский
    "romanian":   "Moduri Steam",
    // греческий
    "greek":      "Λειτουργίες Steam",
    // финский
    "finnish":    "Steam-tilat",
    // шведский
    "swedish":    "Steam-lägen",
    // норвежский
    "norwegian":  "Steam-modi",
    // датский
    "danish":     "Steam-tilstande",
    // турецкий
    "turkish":    "Steam Modları",
    // арабский
    "arabic":     "أوضاع Steam",
    // тайский
    "thai":       "โหมด Steam",
    // вьетнамский
    "vietnamese": "Chế độ Steam",
    // индонезийский
    "indonesian": "Mode Steam",
    // корейский
    "koreana":    "Steam 모드",
    // японский
    "japanese":   "Steamモード",
    // упрощённый китайский
    "schinese":   "Steam 模式",
    // традиционный китайский
    "tchinese":   "Steam 模式",
    // бразильский португальский
    "brazilian":  "Modos Steam",
    // испанский латиноамериканский
    "latam":      "Modos de Steam",
  }

  // карта ISO кодов → Steam языки для фолбэка через navigator.language
  const ISO_TO_STEAM = {
    "ru": "russian", "uk": "ukrainian", "de": "german", "fr": "french",
    "pl": "polish",  "es": "spanish",   "pt": "portuguese", "it": "italian",
    "nl": "dutch",   "cs": "czech",     "hu": "hungarian",  "ro": "romanian",
    "el": "greek",   "fi": "finnish",   "sv": "swedish",    "no": "norwegian",
    "da": "danish",  "tr": "turkish",   "ar": "arabic",     "th": "thai",
    "vi": "vietnamese", "id": "indonesian", "ko": "koreana",
    "ja": "japanese", "zh": "schinese", "en": "english",    "br": "brazilian",
  }

  function getTooltipText() {
    // Steam хранит язык в нескольких местах
    const steamLang = window?.g_strLanguage
      || window?.GetCurrentLanguage?.()
      || document.documentElement.getAttribute("xml:lang")
      || document.documentElement.lang
      || ""

    if (steamLang && TOOLTIP_TRANSLATIONS[steamLang]) {
      return TOOLTIP_TRANSLATIONS[steamLang]
    }

    // фолбэк через navigator.language (ISO код → Steam название)
    const iso = navigator.language?.toLowerCase()?.split("-")[0] || "en"
    const mapped = ISO_TO_STEAM[iso] || "english"
    return TOOLTIP_TRANSLATIONS[mapped] || TOOLTIP_TRANSLATIONS["english"]
  }

  // ── стили ──────────────────────────────────────────────────────────────────
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = `
      #${BUTTON_ID} {
        background-color: rgba(103, 112, 123, .2);
        justify-content: center;
        align-items: center;
        border-radius: var(--button-radius);
        max-height: 32px;
        padding: 0 4px;
        min-height: 32px;
        min-width: 24px;
        display: flex;
        height: 100%;
        cursor: pointer;
        order: ${BUTTON_ORDER};
        position: relative;
        -webkit-app-region: no-drag;
        transition: background-color .15s ease-out;
      }
      #${BUTTON_ID}:hover {
        background-color: #6363632e;
      }
      #${BUTTON_ID} svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
        color: #8B929A;
        display: block;
        flex-shrink: 0;
        transition-property: color;
        transition-duration: .1s;
        transition-timing-function: ease-in-out;
      }
      #${BUTTON_ID}:hover svg {
        color: #ffffff;
      }
      /* сдвигаем вторую и третью кнопки чтобы наша встала между первой и второй */
      ._2EQ7ghgqIdjKv9jsQC0Zq9 { order: 3 !important; }
      ._1TdaAqMFadi0UTqilrkelR { order: 4 !important; }

      #${BUTTON_ID} .nk-custom-btn-tip {
        box-shadow: 1px 1px 8px #0005, 2px 2px 16px 1px #0005;
        transition: opacity .25s;
        pointer-events: none;
        white-space: nowrap;
        border-radius: 2px;
        position: fixed;
        width: fit-content;
        user-select: none;
        padding: 6px 8px;
        max-width: 300px;
        font-size: 13px;
        background-color: #696773;
        color: #E0E1E6;
        z-index: 999999;
        opacity: 0;
        top: -9999px;
        left: -9999px;
      }
      #${BUTTON_ID}:hover .nk-custom-btn-tip {
        opacity: 1;
      }
      #${BUTTON_ID}.nk-menu-open .nk-custom-btn-tip {
        opacity: 0 !important;
      }

      #nk-steam-modes-menu {
        position: fixed;
        z-index: 1600;
        background: #3d4450;
        box-shadow: 0 10px 32px 0px rgba(0, 0, 0, .6705882353);
        padding: 4px;
        user-select: none;
        opacity: 0;
        pointer-events: none;
        top: -9999px;
        left: -9999px;
        transition: opacity 200ms;
      }
      #nk-steam-modes-menu.visible {
        opacity: 1;
        pointer-events: all;
      }
      #nk-steam-modes-menu .nk-menu-items {
        display: flex;
        flex-direction: column;
        padding: 0;
        font-size: 14px;
        -webkit-app-region: no-drag;
        box-sizing: border-box;
      }
      #nk-steam-modes-menu .nk-menu-item {
        padding: 8px 18px;
        font-size: 13px;
        color: #dcdedf;
        cursor: pointer;
        position: relative;
        min-width: fit-content;
        display: flex;
        align-items: center;
        flex-direction: row;
        border-top: none;
        border-bottom: none;
        white-space: nowrap;
        box-sizing: border-box;
      }
      #nk-steam-modes-menu .nk-menu-item:hover {
        background-color: #ffffff;
        color: #000000;
      }
    `
    document.head.appendChild(style)
  }

  // ── создание кнопки ────────────────────────────────────────────────────────
  function createButton() {
    const btn = document.createElement("div")
    btn.id = BUTTON_ID

    // иконка
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("viewBox", "0 0 20 20")
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", ICON_PATH)
    svg.appendChild(path)
    btn.appendChild(svg)

    // тултип
    const tip = document.createElement("span")
    tip.className = "nk-custom-btn-tip"
    tip.textContent = getTooltipText()
    btn.appendChild(tip)

    // позиционирование тултипа при наведении
    btn.addEventListener("mouseenter", () => {
      requestAnimationFrame(() => {
        const r = btn.getBoundingClientRect()
        const tw = tip.getBoundingClientRect().width || 80
        tip.style.left = Math.round(r.left + r.width / 2 - tw / 2) + "px"
        tip.style.top  = Math.round(r.bottom + 8) + "px"
      })
    })

    // меню
    const MENU_ID = "nk-steam-modes-menu"
    const MENU_ITEMS = [
      { label: "Big Picture", url: "steam://open/bigpicture" },
      { label: "SteamVR",     url: "steam://rungameid/250820" },
    ]

    function getOrCreateMenu() {
      let menu = document.getElementById(MENU_ID)
      if (menu) return menu
      menu = document.createElement("div")
      menu.id = MENU_ID
      const itemsWrap = document.createElement("div")
      itemsWrap.className = "nk-menu-items"
      MENU_ITEMS.forEach(({ label, url }) => {
        const item = document.createElement("div")
        item.className = "nk-menu-item"
        item.textContent = label
        item.addEventListener("click", (e) => {
          e.stopPropagation()
          window.location.href = url
          closeMenu()
        })
        itemsWrap.appendChild(item)
      })
      menu.appendChild(itemsWrap)
      document.body.appendChild(menu)
      return menu
    }

    function openMenu() {
      const menu = getOrCreateMenu()
      const r = btn.getBoundingClientRect()
      menu.style.top  = "-9999px"
      menu.style.left = "-9999px"
      menu.classList.add("visible")
      btn.classList.add("nk-menu-open")
      requestAnimationFrame(() => {
        const mw = menu.getBoundingClientRect().width || 160
        const left = Math.max(4, Math.min(r.left, window.innerWidth - mw - 4))
        menu.style.left = Math.round(left) + "px"
        menu.style.top  = Math.round(r.bottom + 6) + "px"
      })
    }

    function closeMenu() {
      const menu = document.getElementById(MENU_ID)
      if (menu) menu.classList.remove("visible")
      btn.classList.remove("nk-menu-open")
    }

    function isMenuOpen() {
      return !!document.getElementById(MENU_ID)?.classList.contains("visible")
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      isMenuOpen() ? closeMenu() : openMenu()
    })

    document.addEventListener("click", (e) => {
      if (!e.target.closest(`#${MENU_ID}`) && !e.target.closest(`#${BUTTON_ID}`)) {
        closeMenu()
      }
    })

    // закрываем при любом движении/потере фокуса окна
    window.addEventListener("blur",   closeMenu)
    window.addEventListener("resize", closeMenu)
    document.addEventListener("scroll", closeMenu, true)
    document.addEventListener("mousedown", (e) => {
      if (!e.target.closest(`#${MENU_ID}`) && !e.target.closest(`#${BUTTON_ID}`)) {
        closeMenu()
      }
    }, true)

    return btn
  }

  // ── вставка кнопки ─────────────────────────────────────────────────────────
  function inject() {
    if (document.getElementById(BUTTON_ID)) return

    const bar = document.querySelector(BAR_SEL)
    if (!bar) return

    bar.appendChild(createButton())
  }

  // ── наблюдатель на случай пересборки DOM ──────────────────────────────────
  function init() {
    injectStyle()
    inject()

    new MutationObserver(() => {
      if (!document.getElementById(BUTTON_ID)) inject()
    }).observe(document.body, { childList: true, subtree: true })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
