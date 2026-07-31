;(() => {
  "use strict"

  // Problem: .title-area has -webkit-app-region:drag — OS blocks clicks.
  // Solution: create <div no-drag> inside .title-area and move buttons there.
  // Preload: inject CSS immediately so buttons look right before DOM is moved.

  const ANCHOR_SEL     = ".AvatarAndUser"
  const USER_BTN_SEL   = ".nOdcT-MoOaXGePXLyPe0H"
  const STATUS_CLASSES = ["online", "awayOrSnooze", "ingame"]
  const TITLE_AREA_SEL = ".title-area"
  const FRIEND_REQ_SEL = ".friendRequestButton"
  const ADD_FRIEND_SEL = ".addFriendButton"
  const CTX_BTN_SEL    = ".titleBarContainer .currentUserContainer .ContextMenuButton"
  const HOLE_ID        = "nk-nodrag-hole"
  const STYLE_ID       = "nk-friends-btn-style"
  const TOOLTIP_ID     = "nk-anchor-tooltip"
  const OFFSET         = 8

  // переводы подписи тултипа (Steam lang -> label)
  const TRANSLATIONS = {
    english:    "Change Status",
    russian:    "Сменить статус",
    ukrainian:  "Змінити статус",
    bulgarian:  "Промяна на статуса",
    czech:      "Změnit stav",
    danish:     "Skift status",
    dutch:      "Status wijzigen",
    finnish:    "Vaihda tila",
    french:     "Changer le statut",
    german:     "Status ändern",
    greek:      "Αλλαγή κατάστασης",
    hungarian:  "Állapot módosítása",
    italian:    "Cambia stato",
    norwegian:  "Endre status",
    polish:     "Zmień status",
    portuguese: "Alterar estado",
    brazilian:  "Alterar status",
    romanian:   "Schimbă starea",
    spanish:    "Cambiar estado",
    latam:      "Cambiar estado",
    swedish:    "Ändra status",
    turkish:    "Durumu Değiştir",
    vietnamese: "Thay đổi trạng thái",
    indonesian: "Ubah Status",
    thai:       "เปลี่ยนสถานะ",
    japanese:   "ステータスを変更",
    koreana:    "상태 변경",
    schinese:   "更改状态",
    tchinese:   "變更狀態",
  }

  // BCP-47 navigator.language -> Steam lang key
  const LANG_MAP = {
    en: "english",   ru: "russian",   uk: "ukrainian", bg: "bulgarian",
    cs: "czech",     da: "danish",    nl: "dutch",      fi: "finnish",
    fr: "french",    de: "german",    el: "greek",      hu: "hungarian",
    it: "italian",   nb: "norwegian", no: "norwegian",  pl: "polish",
    pt: "portuguese",ro: "romanian",  es: "spanish",    sv: "swedish",
    tr: "turkish",   vi: "vietnamese",id: "indonesian", th: "thai",
    ja: "japanese",  ko: "koreana",   zh: "schinese",
    "pt-BR": "brazilian", "es-419": "latam",
    "zh-CN": "schinese",  "zh-SG": "schinese",
    "zh-TW": "tchinese",  "zh-HK": "tchinese",
  }

  function getStatusLabel() {
    // 1. Steam LocalizationManager
    const sl = window.LocalizationManager?.m_strLanguage
    if (sl && TRANSLATIONS[sl]) return TRANSLATIONS[sl]

    // 2. navigator.languages (BCP-47)
    for (const nl of (navigator.languages?.length ? navigator.languages : [navigator.language])) {
      const key = LANG_MAP[nl] || LANG_MAP[nl.slice(0, 2)]
      if (key && TRANSLATIONS[key]) return TRANSLATIONS[key]
    }

    // 3. html lang attribute
    const hl = document.documentElement.lang
    const key = LANG_MAP[hl] || LANG_MAP[hl.slice(0, 2)]
    if (key && TRANSLATIONS[key]) return TRANSLATIONS[key]

    return TRANSLATIONS.english
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return
    const s = document.createElement("style")
    s.id = STYLE_ID
    s.textContent = `
      /* -- hole container -- */
      #${HOLE_ID} {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 4px;
        z-index: 9999;
        pointer-events: auto;
        -webkit-app-region: no-drag;
        overflow: visible;
        margin-top: -1px;
      }
      /* -- buttons -- */
      #${HOLE_ID} .friendRequestButton,
      #${HOLE_ID} .addFriendButton {
        width: 32px !important;
        height: 32px !important;
        min-width: 32px !important;
        min-height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        position: relative !important;
        border-radius: var(--button-radius) !important;
        background: rgba(103,112,123,.2) !important;
        transition: .2s linear !important;
        cursor: pointer !important;
        overflow: visible !important;
        flex-shrink: 0 !important;
      }
      #${HOLE_ID} .friendRequestButton:hover,
      #${HOLE_ID} .addFriendButton:hover {
        background: #6363632e !important;
      }
      #${HOLE_ID} .friendRequestButton svg,
      #${HOLE_ID} .addFriendButton svg {
        width: 16px !important;
        height: 16px !important;
        flex-shrink: 0 !important;
        overflow: visible !important;
      }
      /* -- button tooltips -- */
      #${HOLE_ID} [data-nk-tooltip] {
        position: relative !important;
      }
      #${HOLE_ID} [data-nk-tooltip]::after {
        content: attr(data-nk-tooltip);
        box-shadow: 1px 1px 8px #0005, 2px 2px 16px 1px #0005 !important;
        transition: opacity .25s !important;
        text-overflow: ellipsis !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
        white-space: nowrap !important;
        border-radius: 2px !important;
        position: absolute !important;
        width: fit-content !important;
        user-select: none !important;
        padding: 6px 8px !important;
        overflow: hidden !important;
        max-width: 300px !important;
        font-size: 13px !important;
        background-color: #696773 !important;
        color: #E0E1E6 !important;
        z-index: 999999 !important;
        opacity: 0 !important;
        top: 40px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
      }
      #${HOLE_ID} [data-nk-tooltip]:hover::after {
        opacity: 1 !important;
      }
      /* -- requestsNumber badge -- */
      #${HOLE_ID} .requestsNumber {
        letter-spacing: -1px !important;
        color: #fff !important;
        position: absolute !important;
        font-size: 7px !important;
        top: 11px !important;
        inset-inline-end: -4px !important;
        left: auto !important;
        bottom: auto !important;
        width: fit-content !important;
        min-width: 6px !important;
        height: 9px !important;
        margin-right: 9px !important;
        margin-top: 4px !important;
        background-color: #e64a35 !important;
        border-radius: 16px !important;
        line-height: 10.5px !important;
        padding: 1px 2px 0 !important;
        text-align: center !important;
        transform: translateX(0px) !important;
        transition: all .21s ease-in-out !important;
      }
      /* -- AvatarAndUser click proxy -- */
      ${ANCHOR_SEL} {
        cursor: pointer !important;
        position: relative !important;
        -webkit-app-region: no-drag !important;
      }
      /* transparent overlay that catches clicks on the background */
      ${ANCHOR_SEL}::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        z-index: 0 !important;
        pointer-events: auto !important;
        -webkit-app-region: no-drag !important;
      }
      /* hole sits above the overlay */
      #${HOLE_ID} {
        z-index: 1 !important;
      }
      /* -- AvatarAndUser JS tooltip -- */
      #${TOOLTIP_ID} {
        box-shadow: 1px 1px 8px #0005, 2px 2px 16px 1px #0005;
        transition: opacity .25s;
        text-overflow: ellipsis;
        box-sizing: border-box;
        pointer-events: none;
        white-space: nowrap;
        border-radius: 2px;
        position: fixed;
        width: fit-content;
        user-select: none;
        padding: 6px 8px;
        overflow: hidden;
        max-width: 300px;
        font-size: 13px;
        background-color: #696773;
        color: #E0E1E6;
        z-index: 999999;
        opacity: 0;
        top: -9999px;
        left: -9999px;
      }
      #${TOOLTIP_ID}.visible {
        opacity: 1;
      }
    `
    ;(document.head || document.documentElement).appendChild(s)
  }

  // Sync status classes from .nOdcT-MoOaXGePXLyPe0H to <html>
  // so CSS like ".awayOrSnooze .nOdcT-MoOaXGePXLyPe0H:hover" works
  function syncStatusClasses() {
    const userBtn = document.querySelector(USER_BTN_SEL)
    if (!userBtn) return

    // only check userBtn itself and ancestors up to .AvatarAndUser — never <html>
    const anchor = document.querySelector(ANCHOR_SEL)
    const nodes  = [userBtn]
    let el = userBtn.parentElement
    while (el && el !== document.documentElement && el !== anchor?.parentElement) {
      nodes.push(el)
      el = el.parentElement
    }

    STATUS_CLASSES.forEach(cls => {
      const has = nodes.some(n => n.classList.contains(cls))
      document.documentElement.classList.toggle("nk-" + cls, has)
    })
  }

  // Watch for status class changes on .nOdcT-MoOaXGePXLyPe0H
  function setupStatusObserver() {
    const userBtn = document.querySelector(USER_BTN_SEL)
    if (!userBtn || userBtn.dataset.nkStatusObs) return
    userBtn.dataset.nkStatusObs = "1"

    syncStatusClasses()

    new MutationObserver(syncStatusClasses).observe(userBtn, {
      attributes:      true,
      attributeFilter: ["class"],
    })
  }

  let timer, initialized = false

  function run() {
    const anchor       = document.querySelector(ANCHOR_SEL)
    const titleArea    = document.querySelector(TITLE_AREA_SEL)
    const friendReqBtn = document.querySelector(FRIEND_REQ_SEL)
    const addFriendBtn = document.querySelector(ADD_FRIEND_SEL)

    if (!anchor || !titleArea || (!friendReqBtn && !addFriendBtn)) return
    initialized = true

    if (window.getComputedStyle(titleArea).position === "static")
      titleArea.style.position = "relative"

    let hole = document.getElementById(HOLE_ID)
    if (!hole) {
      hole = document.createElement("div")
      hole.id = HOLE_ID
      titleArea.appendChild(hole)
    }

    // Move friendRequestButton
    if (friendReqBtn && friendReqBtn.parentNode !== hole) {
      friendReqBtn.style.cssText = ""
      const badge = friendReqBtn.querySelector(".requestsNumber")
      if (badge) badge.style.cssText = ""
      const reqTitle = friendReqBtn.getAttribute("title") || friendReqBtn.querySelector("[title]")?.getAttribute("title")
      if (reqTitle) {
        friendReqBtn.setAttribute("data-nk-tooltip", reqTitle)
        friendReqBtn.removeAttribute("title")
        friendReqBtn.querySelectorAll("[title]").forEach(el => el.removeAttribute("title"))
      }
      hole.appendChild(friendReqBtn)
    }

    // Move addFriendButton
    if (addFriendBtn) {
      const wrap = addFriendBtn.closest("a") || addFriendBtn
      if (wrap.parentNode !== hole) {
        wrap.style.cssText = ""
        wrap.style.setProperty("display",    "block",   "important")
        wrap.style.setProperty("width",      "32px",    "important")
        wrap.style.setProperty("height",     "32px",    "important")
        wrap.style.setProperty("min-width",  "32px",    "important")
        wrap.style.setProperty("min-height", "32px",    "important")
        wrap.style.setProperty("overflow",   "visible", "important")
        wrap.style.setProperty("padding",    "0",       "important")
        addFriendBtn.style.cssText = ""
        const addTitle = addFriendBtn.getAttribute("title") || addFriendBtn.querySelector("[title]")?.getAttribute("title")
        if (addTitle) {
          addFriendBtn.setAttribute("data-nk-tooltip", addTitle)
          addFriendBtn.removeAttribute("title")
          addFriendBtn.querySelectorAll("[title]").forEach(el => el.removeAttribute("title"))
        }
        hole.appendChild(wrap)
      }
    }

    // Position hole next to AvatarAndUser
    const ar = anchor.getBoundingClientRect()
    const tr = titleArea.getBoundingClientRect()
    hole.style.left = (ar.right - tr.left + OFFSET) + "px"
    hole.style.top  = (ar.top - tr.top + ar.height / 2 - 16) + "px"
  }

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(run, initialized ? 50 : 0)
  }

  // JS tooltip for AvatarAndUser — appended to body to avoid overflow clipping
  function setupAnchorProxy() {
    const anchor = document.querySelector(ANCHOR_SEL)
    if (!anchor || anchor.dataset.nkProxy) return
    anchor.dataset.nkProxy = "1"

    // Create tooltip element
    let tip = document.getElementById(TOOLTIP_ID)
    if (!tip) {
      tip = document.createElement("div")
      tip.id = TOOLTIP_ID
      tip.textContent = getStatusLabel()
      document.body.appendChild(tip)
    }

    function positionTip() {
      const r = anchor.getBoundingClientRect()
      // Force a reflow so offsetWidth is correct before positioning
      const w = tip.getBoundingClientRect().width || 80
      tip.style.left = Math.round(r.left + r.width / 2 - w / 2) + "px"
      tip.style.top  = Math.round(r.bottom + 6) + "px"
    }

    const AVATAR_SEL = ".currentUserAvatar .avatarHolder"

    function showTip() {
      tip.style.transition = "none"
      tip.style.opacity    = "0"
      tip.classList.add("visible")
      requestAnimationFrame(() => {
        positionTip()
        tip.style.transition = ""
        tip.style.opacity    = ""
      })
    }

    function hideTip() {
      tip.classList.remove("visible")
    }

    anchor.addEventListener("mouseenter", showTip)
    anchor.addEventListener("mouseleave", hideTip)

    // hide when hovering the avatar — it has its own tooltip/menu
    anchor.addEventListener("mouseover", (e) => {
      if (e.target.closest(AVATAR_SEL)) hideTip()
    })
    anchor.addEventListener("mouseout", (e) => {
      // if we left the avatar but are still inside anchor — show again
      if (e.target.closest(AVATAR_SEL) && anchor.contains(e.relatedTarget) && !e.relatedTarget?.closest(AVATAR_SEL)) {
        showTip()
      }
    })

    // Click — click ctxBtn normally, then patch the menu position after Steam opens it
    anchor.addEventListener("click", (e) => {
      if (e.target.closest(`#${HOLE_ID}`)) return
      tip.classList.remove("visible")

      const ctxBtn = document.querySelector(CTX_BTN_SEL)
      if (!ctxBtn) return

      // click the button normally — Steam will open the menu at its own position
      ctxBtn.click()

      // after Steam renders the menu, patch its top/left to sit below AvatarAndUser
      const ar = anchor.getBoundingClientRect()

      let attempts = 0
      const patch = () => {
        const menu = document.querySelector(".contextMenu.visible")
        if (menu) {
          menu.style.setProperty("top",  ar.bottom + "px", "important")
          menu.style.setProperty("left", ar.left   + "px", "important")
          return
        }
        if (++attempts < 10) requestAnimationFrame(patch)
      }
      requestAnimationFrame(patch)
    })
  }

  function init() {
    injectStyle()
    run()
    setupAnchorProxy()
    setupStatusObserver()

    const target = document.querySelector(".friendsListHeaderContainer") || document.body
    const obs = new MutationObserver(schedule)
    obs.observe(target, { childList: true, subtree: false })
    if (target === document.body) {
      obs.observe(document.body, { childList: true, subtree: true })
    }

    const anchor = document.querySelector(ANCHOR_SEL)
    if (anchor && window.ResizeObserver) {
      new ResizeObserver(schedule).observe(anchor)
    }

    window.addEventListener("resize", schedule)
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()

})()
