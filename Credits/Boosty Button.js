;(() => {
  "use strict"

  // ─── CONFIG ──────────────────────────────────────────────────────────────────
  const CONFIG = {
    themeKeyword: "NEVKO-UI",
    boostyUrl:    "https://boosty.to/dotfelixan",
    iconColor:    "#dfe3e6",
    boostySvg: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
      <path d="M2.661 14.337 6.801 0h6.362L11.88 4.444l-0.038 0.077 -3.378 11.733h3.15c-1.321 3.289 -2.35 5.867 -3.086 7.733 -5.816 -0.063 -7.442 -4.228 -6.02 -9.155M8.554 24l7.67 -11.035h-3.25l2.83 -7.073c4.852 0.508 7.137 4.33 5.791 8.952C20.16 19.81 14.344 24 8.68 24h-0.127z" fill="currentColor"/>
    </svg>`,
  }

  // ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
  const TOOLTIP = {
    "en":    "Support on Boosty",
    "ru":    "Поддержать на Boosty",
    "uk":    "Підтримати на Boosty",
    "be":    "Падтрымаць на Boosty",
    "de":    "Auf Boosty unterstützen",
    "fr":    "Soutenir sur Boosty",
    "es":    "Apoyar en Boosty",
    "pt":    "Apoiar no Boosty",
    "it":    "Sostieni su Boosty",
    "nl":    "Steun op Boosty",
    "pl":    "Wspieraj na Boosty",
    "cs":    "Podpořit na Boosty",
    "sk":    "Podporiť na Boosty",
    "ro":    "Susține pe Boosty",
    "hu":    "Támogatás a Boostyn",
    "bg":    "Подкрепи в Boosty",
    "hr":    "Podrži na Boosty",
    "sr":    "Подржи на Boosty",
    "sl":    "Podpri na Boosty",
    "lt":    "Remti Boosty",
    "lv":    "Atbalstīt Boosty",
    "et":    "Toeta Boostys",
    "fi":    "Tue Boostyssä",
    "sv":    "Stöd på Boosty",
    "no":    "Støtt på Boosty",
    "da":    "Støt på Boosty",
    "el":    "Υποστήριξη στο Boosty",
    "tr":    "Boosty'de Destekle",
    "ar":    "ادعم على Boosty",
    "ja":    "Boostyで支援する",
    "ko":    "Boosty에서 후원하기",
    "zh-cn": "在 Boosty 上支持",
    "zh-tw": "在 Boosty 上支持",
    "zh":    "在 Boosty 上支持",
    "th":    "สนับสนุนบน Boosty",
    "id":    "Dukung di Boosty",
    "vi":    "Ủng hộ trên Boosty",
    "kk":    "Boosty-де қолдау",
  }

  function getTooltip() {
    const lang = (document.documentElement.lang || "en").toLowerCase()
    return TOOLTIP[lang] || TOOLTIP[lang.slice(0, 2)] || TOOLTIP["en"]
  }

  // ─── STYLE ───────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById("nevko-boosty-style")) return
    const style = document.createElement("style")
    style.id = "nevko-boosty-style"
    style.textContent = `
      .nevko-boosty-wrap {
        position:    relative;
        display:     inline-flex;
        align-items: center;
        flex-shrink: 0;
        width:       32px;
        height:      32px;
        /* overflow visible чтобы тултип не обрезался */
        overflow:    visible !important;
      }
      .nevko-boosty-btn {
        display:         block !important;
        width:           32px !important;
        height:          32px !important;
        line-height:     32px !important;
        padding:         0 !important;
        margin:          2px 0 !important;
        background:      #2f333b !important;
        border:          0 !important;
        border-radius:   2px !important;
        cursor:          pointer !important;
        color:           ${CONFIG.iconColor} !important;
        text-align:      center !important;
        font-size:       14px !important;
        transition:      background .2s ease !important;
        flex-shrink:     0 !important;
        position:        relative !important;
      }
      .nevko-boosty-btn:hover {
        background: #464d58 !important;
        color:      white !important;
      }
      .nevko-boosty-btn::before {
        pointer-events: none;
        user-select:    none;
        content:        " ";
        position:       absolute;
        top:            0;
        right:          0;
        bottom:         0;
        left:           0;
        box-shadow:     0 8px 16px 0 rgba(0, 0, 0, 0.3);
        opacity:        0;
        transition:     opacity 200ms ease-in-out;
      }
      .nevko-boosty-btn:hover::before {
        opacity: 1;
      }
      .nevko-boosty-btn svg {
        width:          14px !important;
        height:         14px !important;
        display:        inline-block !important;
        vertical-align: middle !important;
        fill:           ${CONFIG.iconColor} !important;
        pointer-events: none !important;
      }
      .nevko-boosty-tip {
        position:         absolute;
        /* слева от кнопки, вертикально по центру */
        top:              50%;
        right:            calc(100% + 8px);
        left:             auto;
        transform:        translateY(-50%);
        background-color: #696773 !important;
        color:            #E0E1E6 !important;
        font-size:        13px !important;
        font-family:      "Motiva Sans", Arial, Helvetica, sans-serif !important;
        white-space:      nowrap !important;
        padding:          5px 8px !important;
        border-radius:    2px !important;
        pointer-events:   none !important;
        opacity:          0;
        transition:       opacity .25s !important;
        z-index:          9999;
        box-sizing:       border-box !important;
        box-shadow:
          1px 1px 8px rgba(0, 0, 0, .3333333),
          2px 2px 16px 1px rgba(0, 0, 0, .3333333) !important;
        max-width:        300px !important;
        overflow:         hidden !important;
        text-overflow:    ellipsis !important;
        user-select:      none !important;
        text-shadow:      unset !important;
      }
      .nevko-boosty-wrap:hover .nevko-boosty-tip {
        opacity: 1;
      }
    `
    document.head.appendChild(style)
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  // Ищем строки тем только среди элементов списка тем (MillenniumThemes_ThemeItem).
  // Это исключает страницу настроек конкретной темы, где тоже есть data-theme-name.
  function findThemeRows(keyword) {
    const kw = keyword.toLowerCase()
    const results = []
    for (const el of document.querySelectorAll("[class*='MillenniumThemes_ThemeItem']")) {
      const name = (
        el.getAttribute("data-theme-name") ||
        el.getAttribute("data-theme-folder-name") || ""
      ).toLowerCase()
      if (name.includes(kw)) results.push(el)
    }
    return results
  }

  function createBoostyWrap() {
    const label = getTooltip()

    const wrap = document.createElement("div")
    wrap.className = "nevko-boosty-wrap"

    const btn = document.createElement("button")
    btn.className = "MillenniumButton nevko-boosty-btn"
    btn.setAttribute("type", "button")
    btn.setAttribute("aria-label", label)
    btn.innerHTML = CONFIG.boostySvg
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      if (typeof SteamClient !== "undefined" && SteamClient?.System?.OpenInSystemBrowser) {
        SteamClient.System.OpenInSystemBrowser(CONFIG.boostyUrl)
      } else {
        window.open(CONFIG.boostyUrl, "_blank")
      }
    })

    const tip = document.createElement("div")
    tip.className = "nevko-boosty-tip"
    tip.textContent = label

    wrap.appendChild(btn)
    wrap.appendChild(tip)

    return wrap
  }

  // ─── INJECT ──────────────────────────────────────────────────────────────────
  function injectIntoRow(row) {
    if (row.querySelector(".nevko-boosty-btn")) return

    // Приоритет 1: Ko-fi или другая иконка-кнопка в .tool-tip-source — вставить перед ней
    const tipSource = row.querySelector(".tool-tip-source")
    if (tipSource && tipSource.parentNode) {
      const wrap = createBoostyWrap()
      tipSource.parentNode.insertBefore(wrap, tipSource)
      return
    }

    // Приоритет 2: кнопка "Использовать"/"Отключить" — взять её контейнер и добавить перед ней
    const useBtn = row.querySelector("button[class*='MillenniumButton']:not(.nevko-boosty-btn)")
    if (useBtn && useBtn.parentNode) {
      const wrap = createBoostyWrap()
      useBtn.parentNode.insertBefore(wrap, useBtn)
      return
    }

    // Fallback: FieldRightColumn
    const rightCol = row.querySelector("[class*='FieldRightColumn']")
    if (rightCol) {
      rightCol.appendChild(createBoostyWrap())
    }
  }

  function tryInject() {
    const rows = findThemeRows(CONFIG.themeKeyword)
    if (!rows.length) return false
    rows.forEach(injectIntoRow)
    return true
  }

  // ─── INIT ────────────────────────────────────────────────────────────────────
  function init() {
    injectCSS()
    tryInject()

    // Observer никогда не отключается — React может перерендерить список тем
    // в любой момент (навигация, смена темы). injectIntoRow сам проверяет
    // наличие кнопки перед вставкой, так что дублей не будет.
    const observer = new MutationObserver(() => {
      tryInject()
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }

  if (document.body) {
    init()
  } else {
    document.addEventListener("DOMContentLoaded", init, { once: true })
  }
})()
