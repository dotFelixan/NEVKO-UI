;(function forceDisableSettings() {
  "use strict"

  // ── что отключать и скрывать ───────────────────────────────────────────────
  // page:    ключ страницы (см. PAGE_KEYS)
  // index:   индекс строки в document.querySelectorAll(ROW_SEL)
  // disable: кликнуть тоггл если он включён
  // hide:    скрыть строку
  const FORCED = [
    // Друзья и чат
    { page: "friends",     index: 7, disable: true, hide: true },
    { page: "friends",     index: 8, disable: true, hide: true },
    // Библиотека — index 3 включено (ensure on), index 4 выключено (disable)
    { page: "library",     index: 3, disable: false, ensure: true,  hide: true },
    { page: "library",     index: 4, disable: true,  ensure: false, hide: true },
    // Доступность
    { page: "accessibility", index: 1, disable: true, hide: true },
    { page: "accessibility", index: 2, disable: true, hide: true },
  ]

  // ── классы Steam UI ────────────────────────────────────────────────────────
  const ROW_SEL    = ".eKmEXJCm_lgme24Fp_HWt"
  const TOGGLE_SEL = "[role='checkbox']"
  const ON_CLASS   = "On"
  const NAV_BTN    = "._1-vlriAtKYDViAEunue4VO"

  // ── навигация: ключ страницы → индекс кнопки в меню (0-based) ────────────
  const PAGE_NAV_INDEX = { "friends": 1, "library": 7, "accessibility": 12 }

  // ── переводы названий страниц ─────────────────────────────────────────────
  const PAGE_KEYS = {
    "friends": [
      "друзья", "friends", "amis", "freunde", "amigos", "znajomi",
      "arkadaşlar", "друзі", "友達", "친구", "好友", "เพื่อน",
      "vrienden", "přátelé", "barátok", "prieteni", "φίλοι",
      "ystävät", "vänner", "venner",
    ],
    "library": [
      "библиотека", "library", "bibliothèque", "bibliothek", "biblioteca",
      "biblioteka", "kütüphane", "бібліотека", "ライブラリ", "라이브러리",
      "库", "ห้องสมุด", "bibliotheek", "knihovna", "könyvtár",
    ],
    "accessibility": [
      "доступность", "accessibility", "accessibilité", "barrierefreiheit",
      "accesibilidad", "dostępność", "erişilebilirlik", "доступність",
      "アクセシビリティ", "접근성", "辅助功能", "การเข้าถึง",
      "toegankelijkheid", "přístupnost", "akadálymentesség",
    ],
  }

  function getCurrentPage() {
    const el = document.querySelector(".PagedSettingsDialog_PageListItem.Active")
    const text = el?.textContent?.trim().toLowerCase() || ""
    for (const [key, kws] of Object.entries(PAGE_KEYS)) {
      if (kws.some(kw => text.includes(kw))) return key
    }
    return "unknown"
  }

  // ── клик понятный React ───────────────────────────────────────────────────
  function reactClick(el) {
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }))
    el.dispatchEvent(new MouseEvent("mouseup",   { bubbles: true, cancelable: true }))
    el.dispatchEvent(new MouseEvent("click",     { bubbles: true, cancelable: true }))
  }



  // ── инъекция CSS для мгновенного скрытия строк ────────────────────────────
  function injectHideCSS() {
    if (document.getElementById("nk-drs-style")) return
    const style = document.createElement("style")
    style.id = "nk-drs-style"
    style.textContent = `[data-nk-hidden="1"] { display: none !important; }`
    document.head?.appendChild(style)
  }

  // ── пометить строку атрибутом — мгновенно, без setTimeout ────────────────
  const markedRows = new WeakSet()

  function hideRow(row) {
    row.setAttribute("data-nk-hidden", "1")
    if (markedRows.has(row)) return
    markedRows.add(row)
    new MutationObserver(() => {
      row.setAttribute("data-nk-hidden", "1")
    }).observe(row, { attributes: true, attributeFilter: ["data-nk-hidden", "style"] })
  }

  // ── закрыть окно настроек ─────────────────────────────────────────────────
  let closeCalled = false
  function scheduleClose() {
    if (closeCalled) return
    closeCalled = true
    setTimeout(() => {
      try { SteamClient.Window.Close() } catch (_) {}
    }, 1500)
  }

  // ── флаг: открыто preloader'ом (читаем позже внутри initInterval) ─────────
  let IS_FIRST      = false
  let wasNavigated  = false
  const neededPages   = [...new Set(FORCED.map(c => c.page))]
  const processedPages = new Set()

  // ── применить ко всем строкам текущей страницы ────────────────────────────
  function applyForced() {
    const page = getCurrentPage()
    if (page === "unknown") return false

    const rows = document.querySelectorAll(ROW_SEL)
    if (!rows.length) return false

    for (const cfg of FORCED) {
      if (cfg.page !== page) continue
      const row = rows[cfg.index]
      if (!row) continue

      // скрываем СРАЗУ — до клика по тогглу, чтобы не было мелькания
      if (cfg.hide) hideRow(row)

      if (cfg.disable) {
        const toggle = row.querySelector(TOGGLE_SEL)
        const isOn   = toggle?.classList.contains(ON_CLASS)
                    || toggle?.getAttribute("aria-checked") === "true"
        if (toggle && isOn) reactClick(toggle)
      }

      if (cfg.ensure) {
        const toggle = row.querySelector(TOGGLE_SEL)
        const isOn   = toggle?.classList.contains(ON_CLASS)
                    || toggle?.getAttribute("aria-checked") === "true"
        if (toggle && !isOn) reactClick(toggle)
      }
    }

    // помечаем страницу как обработанную
    processedPages.add(page)

    // закрываем когда все страницы обработаны
    if (wasNavigated && neededPages.every(p => processedPages.has(p))) scheduleClose()

    return true
  }

  // ── наблюдатель за DOM ────────────────────────────────────────────────────
  let lastPage   = ""
  let processing = false

  const observer = new MutationObserver(() => {
    if (processing) return
    const page = getCurrentPage()
    if (page === "unknown") return

    if (page !== lastPage) {
      lastPage   = page
      processing = true
      applyForced()
      setTimeout(() => {
        processing = false
        // если ещё есть необработанные страницы — переходим на следующую
        if (wasNavigated) {
          const btns = document.querySelectorAll(NAV_BTN)
          const next = neededPages.find(p => !processedPages.has(p))
          if (next !== undefined) {
            const idx = PAGE_NAV_INDEX[next]
            if (idx !== undefined && btns[idx]) reactClick(btns[idx])
          }
        }
      }, 300)
      return
    }

    // та же страница — удерживаем скрытие на случай перерисовки
    const rows = document.querySelectorAll(ROW_SEL)
    for (const cfg of FORCED) {
      if (cfg.page !== page || !cfg.hide) continue
      const row = rows[cfg.index]
      if (row && !row.hasAttribute("data-nk-hidden")) hideRow(row)
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })

  // ── сигнализируем preloader что DRS Script загружен и готов ──────────────
  try { window.__nk_drs_ready = true } catch (_) {}

  // ── инициализация ──────────────────────────────────────────────────────────
  injectHideCSS()

  let initDone = false

  const initInterval = setInterval(() => {
    const btns = document.querySelectorAll(NAV_BTN)
    if (!btns.length) return
    clearInterval(initInterval)
    if (initDone) return
    initDone = true

    // читаем токен здесь — кнопки уже появились, preloader точно записал токен
    try {
      if (localStorage.getItem("nk_drs_token") === "1") {
        localStorage.removeItem("nk_drs_token")
        IS_FIRST = true
        // скрываем окно сразу — пользователь не видит процесс
        try { SteamClient.Window.HideWindow() } catch (_) {}
      }
    } catch (_) {}

    const page = getCurrentPage()
    if (IS_FIRST) {
      // открыто preloader'ом — всегда переходим на первую нужную страницу
      wasNavigated = true
      const firstPage = neededPages[0]
      const idx = PAGE_NAV_INDEX[firstPage]
      if (page === firstPage) {
        // уже на нужной вкладке — применяем и переходим дальше через observer
        applyForced()
      } else if (idx !== undefined && btns[idx]) {
        reactClick(btns[idx])
      }
    } else if (page !== "unknown") {
      // открыто вручную — просто применяем к текущей странице без навигации
      applyForced()
    }
  }, 100)

})()
