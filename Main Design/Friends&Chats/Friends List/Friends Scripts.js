// Friends header: request / add friend buttons next to nickname, status menu on click, tooltips, status classes on <html>

;(() => {
  "use strict"

  const ANCHOR = ".AvatarAndUser"
  const USER_BUTTON = ".nOdcT-MoOaXGePXLyPe0H"
  const TITLE_AREA = ".title-area"
  const FRIEND_REQUESTS = ".friendRequestButton"
  const ADD_FRIEND = ".addFriendButton"
  const OFFLINE_MESSAGE = "._3t-tVOpu2n074cjZsygYfm.OfflineMessage"
  const RICH_PRESENCE = "._3sxE7F1LV2IcSX68YsH9dI.richPresenceContainer"
  const RICH_LINE = "._2Ri005Wg_uXDTa71kdRbcN"
  const RICH_GAME_LINE = "._1cB0qtF0paHWWyj1XNcnbG"

  const HOLE_ID = "nk-nodrag-hole"
  const TOOLTIP_ID = "nk-anchor-tooltip"
  const RICH_TOOLTIP_ID = "nk-rich-presence-tooltip"
  const BUTTON_TOOLTIP_ID = "nk-button-tooltip" // requests / add friend
  const STATUS_CLASSES = ["online", "awayOrSnooze", "ingame"]
  const GAP_AFTER_ANCHOR = 8  // px
  const GAP_BETWEEN_BUTTONS = 8 // px


  // Language

  const STEAM_LANGUAGES = {
    english: "en", russian: "ru", ukrainian: "uk", bulgarian: "bg", czech: "cs",
    danish: "da", dutch: "nl", finnish: "fi", french: "fr", german: "de",
    greek: "el", hungarian: "hu", italian: "it", norwegian: "no", polish: "pl",
    portuguese: "pt", brazilian: "pt-br", romanian: "ro", spanish: "es",
    latam: "es-419", swedish: "sv", turkish: "tr", vietnamese: "vi",
    indonesian: "id", thai: "th", japanese: "ja", koreana: "ko",
    schinese: "zh-cn", tchinese: "zh-tw", arabic: "ar",
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

  const CHANGE_STATUS = translate({
    en: "Change Status", ru: "Сменить статус", uk: "Змінити статус",
    bg: "Промяна на статуса", cs: "Změnit stav", da: "Skift status",
    nl: "Status wijzigen", fi: "Vaihda tila", fr: "Changer le statut",
    de: "Status ändern", el: "Αλλαγή κατάστασης", hu: "Állapot módosítása",
    it: "Cambia stato", no: "Endre status", pl: "Zmień status",
    pt: "Alterar estado", "pt-br": "Alterar status", ro: "Schimbă starea",
    es: "Cambiar estado", sv: "Ändra status", tr: "Durumu Değiştir",
    vi: "Thay đổi trạng thái", id: "Ubah Status", th: "เปลี่ยนสถานะ",
    ja: "ステータスを変更", ko: "상태 변경", "zh-cn": "更改状态", "zh-tw": "變更狀態",
  })

  // Plain statuses, no rich presence
  const PLAIN_STATUSES = new Set([
    "Online", "Away", "Offline", "Invisible", "Snooze",
    "В сети", "Нет на месте", "Не в сети", "Невидимка",
    "В мережі", "Немає на місці", "Не в мережі", "Невидимий",
    "Abwesend", "Unsichtbar", "En ligne", "Absent", "Hors ligne",
    "Zaraz wracam", "Niewidoczny", "En línea", "Ausente", "Sin conexión",
    "Invisível", "Çevrimiçi", "Uzakta", "Çevrimdışı", "Görünmez",
    "在线", "离开", "离线", "隐身", "線上", "離開", "離線", "隱身",
    "オンライン", "退席中", "オフライン", "非表示",
    "온라인", "자리 비움", "오프라인", "투명",
    "In linea", "Assente", "Non in linea", "Invisibile",
    "Afwezig", "Onzichtbaar", "Távol", "Láthatatlan", "Pryč", "Neviditelný",
    "Plecat", "Invizibil", "Σε σύνδεση", "Απών", "Εκτός σύνδεσης", "Αόρατος",
    "Poissa", "Näkymätön", "Borta", "Osynlig", "Tilkoblet", "Borte", "Frakoblet",
    "Usynlig", "Væk", "ออนไลน์", "อยู่ห่าง", "ออฟไลน์", "ล่องหน",
    "Trực tuyến", "Vắng mặt", "Ngoại tuyến", "Ẩn danh",
    "Daring", "Pergi", "Luring", "Tidak Terlihat",
    "متصل", "بعيد", "غير متصل", "مجهول", "מחובר", "נעדר", "לא מחובר", "בלתי נראה",
  ])


  // Status Classes

  // Copy status to <html>
  function syncStatusClasses() {
    const button = document.querySelector(USER_BUTTON)
    if (!button) return
    const stopAt = document.querySelector(ANCHOR)?.parentElement

    const chain = []
    for (let el = button; el && el !== document.documentElement && el !== stopAt; el = el.parentElement) {
      chain.push(el)
    }
    for (const status of STATUS_CLASSES) {
      const active = chain.some(el => el.classList.contains(status))
      document.documentElement.classList.toggle("nk-" + status, active)
    }
  }

  let watchedUserButton = null
  function watchStatus() {
    const button = document.querySelector(USER_BUTTON)
    if (!button || button === watchedUserButton) return
    watchedUserButton = button
    syncStatusClasses()
    new MutationObserver(syncStatusClasses).observe(button, { attributes: true, attributeFilter: ["class"] })
  }


  // Button Copies

  // Find originals outside our copies (same classes)
  const outsideHole = selector => `${selector}:not(#${HOLE_ID} *)`

  const BUTTONS = [
    { find: () => document.querySelector(outsideHole(FRIEND_REQUESTS)) },
    { find: () => {
      const button = document.querySelector(outsideHole(ADD_FRIEND))
      return button?.closest("a") || button
    } },
  ]

  // Copy is created once, only content updates
  function createMirror(button) {
    const mirror = { button, original: null, clone: null, observer: null, pairs: new Map(), frame: null }

    // Classes now, content once per frame
    mirror.observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "attributes") {
          mirror.pairs.get(record.target)?.setAttribute("class", record.target.getAttribute("class") || "")
        } else {
          mirror.frame ??= requestAnimationFrame(() => {
            mirror.frame = null
            copyContent(mirror)
          })
        }
      }
    })
    return mirror
  }

  // Same tag as original
  function createClone(mirror, tagName) {
    const clone = document.createElement(tagName)
    clone.addEventListener("click", event => {
      event.preventDefault()   // no own navigation
      event.stopPropagation()
      // Find original on click
      mirror.button.find()?.click()
    })
    clone.addEventListener("mouseenter", () => showButtonTooltip(clone))
    clone.addEventListener("mouseleave", hideButtonTooltip)
    if (hoveredClone === mirror.clone) hideButtonTooltip()
    mirror.clone?.replaceWith(clone)
    mirror.clone = clone
  }

  // Separate tooltip (inside button it shrank with Button Press)
  let hoveredClone = null

  function showButtonTooltip(clone) {
    hoveredClone = clone
    const text = clone.dataset.nkTooltip
    if (!text) return hideButtonTooltip()
    const tip = getTooltip(BUTTON_TOOLTIP_ID)
    tip.textContent = text
    prepareTooltip(tip)
    requestAnimationFrame(() => {
      if (hoveredClone !== clone) return
      const r = clone.getBoundingClientRect()
      const width = tip.offsetWidth || 80
      const left = r.left + r.width / 2 - width / 2
      tip.style.left = Math.round(Math.max(4, Math.min(left, innerWidth - width - 4))) + "px"
      tip.style.top = Math.round(r.top + 40) + "px" // 40px from top
      revealTooltip(tip)
    })
  }

  function hideButtonTooltip() {
    hoveredClone = null
    document.getElementById(BUTTON_TOOLTIP_ID)?.classList.remove("visible")
  }

  function attachMirror(mirror, original) {
    if (mirror.clone?.tagName !== original.tagName) createClone(mirror, original.tagName)
    mirror.original = original
    mirror.observer.disconnect()
    mirror.observer.observe(original, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class"],
    })
    copyContent(mirror)
  }

  // Mirror content
  function copyContent({ clone, original, pairs }) {
    const fresh = original.cloneNode(true)

    clone.className = fresh.className
    for (const { name, value } of fresh.attributes) {
      if (name !== "class" && name !== "title" && name !== "id") clone.setAttribute(name, value)
    }
    clone.replaceChildren(...fresh.childNodes)
    clone.dataset.nkClone = "1"

    // Own tooltip instead of title
    const title = original.getAttribute("title") || original.querySelector("[title]")?.getAttribute("title")
    clone.querySelectorAll("[title]").forEach(el => el.removeAttribute("title"))
    if (title) clone.dataset.nkTooltip = title
    else delete clone.dataset.nkTooltip
    if (hoveredClone === clone) showButtonTooltip(clone) // count changed under cursor

    // Same structure, match by order
    pairs.clear()
    pairs.set(original, clone)
    const cloneNodes = clone.querySelectorAll("*")
    original.querySelectorAll("*").forEach((node, i) => cloneNodes[i] && pairs.set(node, cloneNodes[i]))
  }

  const mirrors = new Map() // button -> copy
  let hole = null

  function getHole(titleArea) {
    if (hole?.isConnected) return hole
    if (getComputedStyle(titleArea).position === "static") titleArea.style.position = "relative"
    hole = document.createElement("div")
    hole.id = HOLE_ID
    titleArea.append(hole)
    return hole
  }

  // Measure without press scale (translateY(30%) moves it)
  function layoutRect(el) {
    if (getComputedStyle(el).scale === "none") return el.getBoundingClientRect()
    const value = el.style.getPropertyValue("scale")
    const priority = el.style.getPropertyPriority("scale")
    el.style.setProperty("scale", "none", "important")
    const rect = el.getBoundingClientRect()
    if (value) el.style.setProperty("scale", value, priority)
    else el.style.removeProperty("scale")
    return rect
  }

  // Write only on change
  function positionHole(anchor, titleArea) {
    const a = layoutRect(anchor)
    const t = titleArea.getBoundingClientRect()
    // Round to 0.01px
    const px = value => Math.round(value * 100) / 100 + "px"
    const left = px(a.right - t.left + GAP_AFTER_ANCHOR)
    const top = px(a.top - t.top + a.height / 2 - 16)
    if (hole.style.left !== left) hole.style.left = left
    if (hole.style.top !== top) hole.style.top = top
  }

  function buildButtons() {
    const anchor = document.querySelector(ANCHOR)
    // The title area of this header: the "Disconnected" bar above brings its own one, first in the page
    const titleArea = anchor?.closest(".titleBarContainer")?.querySelector(TITLE_AREA) || document.querySelector(TITLE_AREA)
    if (!anchor || !titleArea) return

    const clones = []
    for (const button of BUTTONS) {
      const original = button.find()
      let mirror = mirrors.get(button)

      // Never copy into itself
      if (!original || hole?.contains(original)) {
        mirror?.clone?.remove()
        continue
      }
      if (!mirror) mirrors.set(button, mirror = createMirror(button))
      if (mirror.original !== original) attachMirror(mirror, original)
      clones.push(mirror.clone)
    }
    if (!clones.length) return

    const holeEl = getHole(titleArea)
    holeEl.style.removeProperty("display")
    // Reorder on change only
    const current = [...holeEl.children]
    if (current.length !== clones.length || clones.some((clone, i) => current[i] !== clone)) {
      holeEl.replaceChildren(...clones)
    }

    positionHole(anchor, holeEl.parentElement) // measured from where the buttons really are
  }

  function hideButtons() {
    hideButtonTooltip()
    hole?.style.setProperty("display", "none", "important")
  }


  // Nickname: Click & Tooltips

  function getTooltip(id) {
    let tip = document.getElementById(id)
    if (!tip) {
      tip = document.createElement("div")
      tip.id = id
      document.body.append(tip)
    }
    return tip
  }

  // ingame class may be on plate, parent or inside header
  function isInGame(anchor) {
    const header = anchor.closest(".currentUserContainer") || anchor
    return !!(anchor.closest(".ingame") || header.querySelector(".ingame"))
  }

  // Own header only
  function readRichPresence(anchor) {
    const header = anchor.closest(".currentUserContainer") || anchor
    const container = header.querySelector(RICH_PRESENCE)
    if (!container) return null

    // Skip Last Seen lines
    const LAST_SEEN = "[data-nevko-ls], [data-nevko-ls-label]"
    const read = selector => {
      const el = container.querySelector(selector)
      if (!el || el.matches(LAST_SEEN) || el.querySelector(LAST_SEEN)) return ""
      return el.textContent.trim()
    }
    const game = read(`${RICH_LINE}${RICH_GAME_LINE}`)
    const details = read(`${RICH_LINE}:not(${RICH_GAME_LINE})`)

    if (!game && !details) return null
    if (PLAIN_STATUSES.has(game) && !details) return null
    if (PLAIN_STATUSES.has(details) && !game) return null
    return { game, details }
  }

  // Measure offscreen first
  function prepareTooltip(tip) {
    tip.style.setProperty("transition", "none", "important")
    tip.style.setProperty("opacity", "0", "important")
    tip.style.left = tip.style.top = "-9999px"
    tip.classList.add("visible")
  }

  function revealTooltip(tip) {
    tip.style.removeProperty("transition")
    tip.style.removeProperty("opacity")
  }

  function showTooltips(anchor) {
    if (openMenu()) return // the menu is open under the plate: no tooltip over it
    const tip = getTooltip(TOOLTIP_ID)
    const richTip = getTooltip(RICH_TOOLTIP_ID)

    tip.textContent = CHANGE_STATUS
    prepareTooltip(tip)

    // Second tooltip only in game
    const rich = isOffline() || !isInGame(anchor) ? null : readRichPresence(anchor)
    if (rich) {
      richTip.replaceChildren()
      if (rich.game) richTip.append(textSpan("nk-rich-game", rich.game))
      if (rich.details) richTip.append(textSpan("nk-rich-desc", rich.details))
      prepareTooltip(richTip)
    }

    requestAnimationFrame(() => {
      if (openMenu()) return hideTooltips() // opened meanwhile
      const a = layoutRect(anchor)
      const tipWidth = tip.offsetWidth || 80
      const tipTop = Math.round(a.bottom + 6)
      tip.style.left = Math.round(a.left + a.width / 2 - tipWidth / 2) + "px"
      tip.style.top = tipTop + "px"
      revealTooltip(tip)

      if (!rich) return
      // Below, or above if no room
      const width = richTip.offsetWidth || 100
      const height = richTip.offsetHeight || 20
      const left = a.left + a.width / 2 - width / 2
      const below = tipTop + (tip.offsetHeight || 28) + 4
      const above = tipTop - height - 4
      richTip.style.left = Math.round(Math.max(4, Math.min(left, innerWidth - width - 4))) + "px"
      richTip.style.top = Math.round(below + height + 4 <= innerHeight ? below : Math.max(4, above)) + "px"
      revealTooltip(richTip)
    })
  }

  function hideTooltips() {
    document.getElementById(TOOLTIP_ID)?.classList.remove("visible")
    document.getElementById(RICH_TOOLTIP_ID)?.classList.remove("visible")
  }

  function textSpan(className, text) {
    const span = document.createElement("span")
    span.className = className
    span.textContent = text
    return span
  }

  const isOverAvatar = el => el?.closest?.(".currentUserAvatar .avatarHolder")

  // Plate click = status arrow click, menu under plate
  // A menu of Steam drawn in this page (not the docked emoticon panel: it is a menu too, and it stays in the page)
  const openMenu = () => document.querySelector(".contextMenu.visible:not([data-nk-emoticons]):not([data-nk-ghost])")

  function closeMenu(menu) {
    const key = Object.keys(menu).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && menu[key], depth = 0; fiber && depth < 8; fiber = fiber.return, depth++) {
      const instance = fiber.memoizedProps?.instance
      if (typeof instance?.Hide !== "function") continue
      try { instance.Hide() } catch { /* Steam closes it itself on a click outside */ }
      return
    }
  }

  // While a menu is open Steam covers the whole window with an invisible layer that takes every click: the cursor
  // over the buttons of the title row was an arrow, not a hand. The layer is kept off that row (Friends Code.css)
  // while a menu is open - marked here
  const MENU_OPEN_ATTR = "data-nk-menu-open"
  function markMenuOpen() {
    const open = !!openMenu()
    const root = document.documentElement
    if (root.hasAttribute(MENU_OPEN_ATTR) !== open) root.toggleAttribute(MENU_OPEN_ATTR, open)
  }

  function openStatusMenu(anchor) {
    const arrow = anchor.querySelector(".ContextMenuButton")
    if (!arrow) return
    hideTooltips()
    arrow.click()

    const a = layoutRect(anchor)
    let attempts = 0
    const moveMenu = () => {
      const menu = openMenu()
      if (menu) {
        hideTooltips()
        menu.style.setProperty("top", a.bottom + "px", "important")
        menu.style.setProperty("left", a.left + "px", "important")
      } else if (++attempts < 10) {
        requestAnimationFrame(moveMenu)
      }
    }
    requestAnimationFrame(moveMenu)
  }

  let preparedAnchor = null
  function prepareAnchor() {
    const anchor = document.querySelector(ANCHOR)
    if (!anchor || anchor === preparedAnchor) return
    preparedAnchor = anchor

    // A press on the plate while its menu is open closes the menu (Steam does it itself on a click outside the
    // menu): the click of that same press must not open it again
    let closing = false
    addEventListener("mousedown", event => {
      closing = event.target instanceof Element && anchor.contains(event.target) && !!openMenu()
    }, true) // before Steam's own handlers: the menu is still there
    anchor.addEventListener("click", event => {
      if (event.target.closest(`#${HOLE_ID}`)) return
      if (closing) {
        closing = false
        const menu = openMenu()
        if (menu) closeMenu(menu) // Steam left it open
        event.stopPropagation()
        return
      }
      // Arrow click handled by Steam
      if (event.target.closest(".ContextMenuButton")) return
      openStatusMenu(anchor)
    })
    anchor.addEventListener("mouseenter", () => showTooltips(anchor))
    anchor.addEventListener("mouseleave", hideTooltips)

    // Hide over avatar
    anchor.addEventListener("mouseover", event => {
      if (isOverAvatar(event.target)) hideTooltips()
    })
    anchor.addEventListener("mouseout", event => {
      const leftAvatar = isOverAvatar(event.target) && !isOverAvatar(event.relatedTarget)
      if (leftAvatar && anchor.contains(event.relatedTarget)) showTooltips(anchor)
    })

    if (window.ResizeObserver) new ResizeObserver(() => schedule()).observe(anchor)
  }


  // Start

  // Update next frame
  let frame = null
  function schedule() {
    frame ??= requestAnimationFrame(() => {
      frame = null
      markMenuOpen()
      prepareAnchor()
      watchStatus()
      buildButtons()
    })
  }

  const isOffline = () => !!document.querySelector(OFFLINE_MESSAGE)

  function init() {
    let wasOffline = isOffline()
    if (!wasOffline) schedule()

    new MutationObserver(records => {
      // Ignore own changes
      if (records.every(r => hole?.contains(r.target))) return

      const offline = isOffline()
      if (offline !== wasOffline) {
        wasOffline = offline
        if (offline) {
          hideButtons()
        } else {
          schedule()
          setTimeout(schedule, 500) // Steam returns buttons late
        }
        return
      }
      if (!offline) schedule()
    }).observe(document.body, { childList: true, subtree: true })

    addEventListener("resize", () => schedule())
  }

  function injectStyles() {
    if (document.getElementById("nk-friends-btn-style")) return
    const style = document.createElement("style")
    style.id = "nk-friends-btn-style"
    style.textContent = `
      #${HOLE_ID} {
        position: absolute;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: ${GAP_BETWEEN_BUTTONS}px;
        overflow: visible;
        pointer-events: auto;
        -webkit-app-region: no-drag;
      }

      #${HOLE_ID} :is(.friendRequestButton, .addFriendButton) {
        position: relative !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
        width: 32px !important;
        height: 32px !important;
        min-width: 32px !important;
        min-height: 32px !important;
        overflow: visible !important;
        border-radius: var(--button-radius) !important;
        background: var(--button-background) !important;
        cursor: pointer !important;
        transition: .2s linear !important;
      }
      #${HOLE_ID} :is(.friendRequestButton, .addFriendButton):hover { background: var(--button-hover-background) !important; }
      #${HOLE_ID} :is(.friendRequestButton, .addFriendButton) svg {
        flex-shrink: 0 !important;
        width: 16px !important;
        height: 16px !important;
        overflow: visible !important;
      }
      /* Add Friend Link */
      #${HOLE_ID} > a {
        display: block !important;
        width: 32px !important;
        height: 32px !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      /* Gap only (reset Steam margins) */
      #${HOLE_ID} > *,
      #${HOLE_ID} :is(.friendRequestButton, .addFriendButton) { margin: 0 !important; }

      /* Empty Requests */
      #${HOLE_ID} > .friendRequestButton:not(:has(*)) { display: none !important; }

      /* Hide Originals */
      .friendRequestButton:not(#${HOLE_ID} *),
      .addFriendButton:not(#${HOLE_ID} *),
      a:has(.addFriendButton):not(#${HOLE_ID} *) { display: none !important; }

      /* Arrow */
      .titleBarContainer .currentUserContainer .ContextMenuButton { pointer-events: none !important; }

      ${ANCHOR} {
        position: relative !important;
        cursor: pointer !important;
        -webkit-app-region: no-drag !important;
      }
      ${ANCHOR}::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        z-index: 0 !important;
        pointer-events: auto !important;
        -webkit-app-region: no-drag !important;
      }

      /* Requests Count */
      #${HOLE_ID} .requestsNumber {
        position: absolute !important;
        top: 11px !important;
        inset-inline-end: -4px !important;
        left: auto !important;
        bottom: auto !important;
        width: fit-content !important;
        min-width: 6px !important;
        height: 9px !important;
        margin: 4px 9px 0 0 !important;
        padding: 1px 2px 0 !important;
        border-radius: 16px !important;
        background-color: var(--notification-color) !important;
        color: var(--text-bright-color) !important;
        font-size: 7px !important;
        line-height: 10.5px !important;
        letter-spacing: -1px !important;
        text-align: center !important;
        transform: none !important;
        transition: all .21s ease-in-out !important;
      }

      /* Tooltips */
      #${TOOLTIP_ID},
      #${RICH_TOOLTIP_ID},
      #${BUTTON_TOOLTIP_ID} {
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
      #${TOOLTIP_ID}.visible,
      #${RICH_TOOLTIP_ID}.visible,
      #${BUTTON_TOOLTIP_ID}.visible { opacity: 1; }

      #${RICH_TOOLTIP_ID} { display: flex; flex-direction: column; gap: 2px; }
      #${RICH_TOOLTIP_ID} .nk-rich-game { color: var(--tooltip-text); font-size: 13px; font-weight: 500; }
      #${RICH_TOOLTIP_ID} .nk-rich-desc { color: var(--rich-presence-details-color); font-size: 12px; white-space: normal; word-break: break-word; }
    `
    ;(document.head || document.documentElement).append(style)
  }

  // Styles before DOM
  injectStyles()

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
