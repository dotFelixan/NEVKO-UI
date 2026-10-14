// Boosty button in NEVKO-UI row (Millennium themes list)

;(() => {
  "use strict"

  const THEME_NAME = "nevko-ui"
  const BOOSTY_URL = "https://boosty.to/dotfelixan"
  const THEME_ROW = "[class*='MillenniumThemes_ThemeItem']"

  const ICON = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
    <path fill="currentColor" d="M2.661 14.337 6.801 0h6.362L11.88 4.444l-0.038 0.077 -3.378 11.733h3.15c-1.321 3.289 -2.35 5.867 -3.086 7.733 -5.816 -0.063 -7.442 -4.228 -6.02 -9.155M8.554 24l7.67 -11.035h-3.25l2.83 -7.073c4.852 0.508 7.137 4.33 5.791 8.952C20.16 19.81 14.344 24 8.68 24h-0.127z"/>
  </svg>`

  const TOOLTIPS = {
    en: "Support on Boosty", ru: "Поддержать на Boosty", uk: "Підтримати на Boosty",
    be: "Падтрымаць на Boosty", de: "Auf Boosty unterstützen", fr: "Soutenir sur Boosty",
    es: "Apoyar en Boosty", pt: "Apoiar no Boosty", it: "Sostieni su Boosty",
    nl: "Steun op Boosty", pl: "Wspieraj na Boosty", cs: "Podpořit na Boosty",
    sk: "Podporiť na Boosty", ro: "Susține pe Boosty", hu: "Támogatás a Boostyn",
    bg: "Подкрепи в Boosty", hr: "Podrži na Boosty", sr: "Подржи на Boosty",
    sl: "Podpri na Boosty", lt: "Remti Boosty", lv: "Atbalstīt Boosty",
    et: "Toeta Boostys", fi: "Tue Boostyssä", sv: "Stöd på Boosty",
    no: "Støtt på Boosty", da: "Støt på Boosty", el: "Υποστήριξη στο Boosty",
    tr: "Boosty'de Destekle", ar: "ادعم على Boosty", ja: "Boostyで支援する",
    ko: "Boosty에서 후원하기", zh: "在 Boosty 上支持", th: "สนับสนุนบน Boosty",
    id: "Dukung di Boosty", vi: "Ủng hộ trên Boosty", kk: "Boosty-де қолдау",
  }

  function getTooltip() {
    const lang = (document.documentElement.lang || "en").toLowerCase()
    return TOOLTIPS[lang] || TOOLTIPS[lang.split("-")[0]] || TOOLTIPS.en
  }

  function openBoosty(event) {
    event.stopPropagation()
    if (window.SteamClient?.System?.OpenInSystemBrowser) SteamClient.System.OpenInSystemBrowser(BOOSTY_URL)
    else window.open(BOOSTY_URL, "_blank")
  }

  function createButton() {
    const text = getTooltip()

    const wrap = document.createElement("div")
    wrap.className = "nevko-boosty-wrap"

    const button = document.createElement("button")
    button.type = "button"
    button.className = "MillenniumButton nevko-boosty-btn"
    button.setAttribute("aria-label", text)
    button.innerHTML = ICON
    button.addEventListener("click", openBoosty)

    const tip = document.createElement("div")
    tip.className = "nevko-boosty-tip"
    tip.textContent = text

    wrap.append(button, tip)
    return wrap
  }

  // Before icons / "Use" button, else right column
  function addButton(row) {
    if (row.querySelector(".nevko-boosty-btn")) return

    const before = row.querySelector(".tool-tip-source")
      || row.querySelector("button[class*='MillenniumButton']")
    if (before) before.before(createButton())
    else row.querySelector("[class*='FieldRightColumn']")?.append(createButton())
  }

  // Theme list rows only
  function update() {
    for (const row of document.querySelectorAll(THEME_ROW)) {
      const name = (row.dataset.themeName || row.dataset.themeFolderName || "").toLowerCase()
      if (name.includes(THEME_NAME)) addButton(row)
    }
  }

  function injectStyles() {
    const style = document.createElement("style")
    style.id = "nevko-boosty-style"
    style.textContent = `
      .nevko-boosty-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        overflow: visible !important;
      }
      .nevko-boosty-btn {
        position: relative !important;
        display: block !important;
        flex-shrink: 0 !important;
        width: 32px !important;
        height: 32px !important;
        margin: 2px 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 2px !important;
        background: var(--boosty-button-background) !important;
        color: var(--text-light-color) !important;
        font-size: 14px !important;
        line-height: 32px !important;
        text-align: center !important;
        cursor: pointer !important;
        transition: background .2s ease !important;
      }
      .nevko-boosty-btn:hover { background: var(--settings-button-hover-background) !important; color: var(--text-bright-color) !important; }
      .nevko-boosty-btn::before {
        content: " ";
        position: absolute;
        inset: 0;
        box-shadow: 0 8px 16px 0 var(--shadow-soft);
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s ease-in-out;
      }
      .nevko-boosty-btn:hover::before { opacity: 1; }
      .nevko-boosty-btn svg {
        display: inline-block !important;
        width: 14px !important;
        height: 14px !important;
        vertical-align: middle !important;
        pointer-events: none !important;
      }

      /* Tooltip Left */
      .nevko-boosty-tip {
        position: absolute;
        top: 50%;
        right: calc(100% + 8px);
        z-index: 9999;
        transform: translateY(-50%);
        box-sizing: border-box !important;
        max-width: 300px !important;
        padding: 5px 8px !important;
        overflow: hidden !important;
        border-radius: 2px !important;
        background-color: var(--tooltip-background) !important;
        color: var(--tooltip-text) !important;
        font-family: "Motiva Sans", Arial, Helvetica, sans-serif !important;
        font-size: 13px !important;
        white-space: nowrap !important;
        text-overflow: ellipsis !important;
        text-shadow: none !important;
        box-shadow: 1px 1px 8px var(--tooltip-shadow), 2px 2px 16px 1px var(--tooltip-shadow) !important;
        pointer-events: none !important;
        user-select: none !important;
        opacity: 0;
        transition: opacity .25s !important;
      }
      .nevko-boosty-wrap:hover .nevko-boosty-tip { opacity: 1; }
    `
    document.head.append(style)
  }

  function init() {
    injectStyles()
    update()

    // Once per frame
    let frame = null
    new MutationObserver(() => {
      frame ??= requestAnimationFrame(() => {
        frame = null
        update()
      })
    }).observe(document.body, { childList: true, subtree: true })
  }

  document.body ? init() : document.addEventListener("DOMContentLoaded", init, { once: true })
})()
