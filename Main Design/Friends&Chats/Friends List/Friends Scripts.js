;(() => {
  "use strict"

  const ANCHOR_SEL     = ".AvatarAndUser"
  const USER_BTN_SEL   = ".nOdcT-MoOaXGePXLyPe0H"
  const STATUS_CLASSES = ["online", "awayOrSnooze", "ingame"]
  const TITLE_AREA_SEL = ".title-area"
  const FRIEND_REQ_SEL = ".friendRequestButton"
  const ADD_FRIEND_SEL = ".addFriendButton"
  const OFFLINE_SEL    = "._3t-tVOpu2n074cjZsygYfm.OfflineMessage"
  const HOLE_ID        = "nk-nodrag-hole"
  const STYLE_ID       = "nk-friends-btn-style"
  const TOOLTIP_ID     = "nk-anchor-tooltip"
  const RICH_TIP_ID    = "nk-rich-presence-tooltip"
  const RICH_SEL       = "._3sxE7F1LV2IcSX68YsH9dI.richPresenceContainer"
  const OFFSET         = 8

  const TRANSLATIONS = {
    english:    "Change Status",    russian:    "Сменить статус",
    ukrainian:  "Змінити статус",   bulgarian:  "Промяна на статуса",
    czech:      "Změnit stav",      danish:     "Skift status",
    dutch:      "Status wijzigen",  finnish:    "Vaihda tila",
    french:     "Changer le statut",german:     "Status ändern",
    greek:      "Αλλαγή κατάστασης",hungarian:  "Állapot módosítása",
    italian:    "Cambia stato",     norwegian:  "Endre status",
    polish:     "Zmień status",     portuguese: "Alterar estado",
    brazilian:  "Alterar status",   romanian:   "Schimbă starea",
    spanish:    "Cambiar estado",   latam:      "Cambiar estado",
    swedish:    "Ändra status",     turkish:    "Durumu Değiştir",
    vietnamese: "Thay đổi trạng thái", indonesian: "Ubah Status",
    thai:       "เปลี่ยนสถานะ",    japanese:   "ステータスを変更",
    koreana:    "상태 변경",        schinese:   "更改状态",
    tchinese:   "變更狀態",
  }

  const LANG_MAP = {
    en:"english", ru:"russian", uk:"ukrainian", bg:"bulgarian",
    cs:"czech",   da:"danish",  nl:"dutch",     fi:"finnish",
    fr:"french",  de:"german",  el:"greek",     hu:"hungarian",
    it:"italian", nb:"norwegian",no:"norwegian",pl:"polish",
    pt:"portuguese",ro:"romanian",es:"spanish", sv:"swedish",
    tr:"turkish", vi:"vietnamese",id:"indonesian",th:"thai",
    ja:"japanese",ko:"koreana", zh:"schinese",
    "pt-BR":"brazilian","es-419":"latam",
    "zh-CN":"schinese","zh-SG":"schinese",
    "zh-TW":"tchinese","zh-HK":"tchinese",
  }

  function getStatusLabel() {
    const sl = window.LocalizationManager?.m_strLanguage
    if (sl && TRANSLATIONS[sl]) return TRANSLATIONS[sl]
    for (const nl of (navigator.languages?.length ? navigator.languages : [navigator.language])) {
      const key = LANG_MAP[nl] || LANG_MAP[nl.slice(0,2)]
      if (key && TRANSLATIONS[key]) return TRANSLATIONS[key]
    }
    const hl = document.documentElement.lang
    const key = LANG_MAP[hl] || LANG_MAP[hl.slice(0,2)]
    if (key && TRANSLATIONS[key]) return TRANSLATIONS[key]
    return TRANSLATIONS.english
  }

  // ─── CSS ───────────────────────────────────────────────────────────────────

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return
    const s = document.createElement("style")
    s.id = STYLE_ID
    s.textContent = `
      #${HOLE_ID} {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 4px;
        z-index: 1;
        pointer-events: auto;
        -webkit-app-region: no-drag;
        overflow: visible;
        margin-top: -1px;
      }

      #${HOLE_ID} .friendRequestButton,
      #${HOLE_ID} .addFriendButton {
        width: 32px !important; height: 32px !important;
        min-width: 32px !important; min-height: 32px !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        position: relative !important;
        border-radius: var(--button-radius) !important;
        background: rgba(103,112,123,.2) !important;
        transition: .2s linear !important;
        cursor: pointer !important;
        overflow: visible !important;
        flex-shrink: 0 !important;
      }
      #${HOLE_ID} .friendRequestButton:hover,
      #${HOLE_ID} .addFriendButton:hover { background: #6363632e !important; }
      #${HOLE_ID} .friendRequestButton svg,
      #${HOLE_ID} .addFriendButton svg {
        width: 16px !important; height: 16px !important;
        flex-shrink: 0 !important; overflow: visible !important;
      }

      /* скрываем оригинальные кнопки везде кроме нашего hole */
      .friendRequestButton:not(#${HOLE_ID} .friendRequestButton),
      .addFriendButton:not(#${HOLE_ID} .addFriendButton),
      a:has(.addFriendButton):not(#${HOLE_ID} a) {
        display: none !important;
      }

      /* отключаем клики на оригинальную ContextMenuButton, иконку оставляем */
      .titleBarContainer .currentUserContainer .ContextMenuButton {
        pointer-events: none !important;
      }

      #${HOLE_ID} [data-nk-tooltip] { position: relative !important; }
      #${HOLE_ID} [data-nk-tooltip]::after {
        content: attr(data-nk-tooltip);
        box-shadow: 1px 1px 8px #0005, 2px 2px 16px 1px #0005 !important;
        transition: opacity .25s !important;
        pointer-events: none !important;
        white-space: nowrap !important;
        border-radius: 2px !important;
        position: absolute !important;
        width: fit-content !important;
        user-select: none !important;
        padding: 6px 8px !important;
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
      #${HOLE_ID} [data-nk-tooltip]:hover::after { opacity: 1 !important; }

      #${HOLE_ID} .requestsNumber {
        letter-spacing: -1px !important; color: #fff !important;
        position: absolute !important; font-size: 7px !important;
        top: 11px !important; inset-inline-end: -4px !important;
        left: auto !important; bottom: auto !important;
        width: fit-content !important; min-width: 6px !important;
        height: 9px !important; margin-right: 9px !important;
        margin-top: 4px !important; background-color: #e64a35 !important;
        border-radius: 16px !important; line-height: 10.5px !important;
        padding: 1px 2px 0 !important; text-align: center !important;
        transform: translateX(0px) !important; transition: all .21s ease-in-out !important;
      }

      ${ANCHOR_SEL} {
        cursor: pointer !important;
        position: relative !important;
        -webkit-app-region: no-drag !important;
      }
      ${ANCHOR_SEL}::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        z-index: 0 !important;
        pointer-events: auto !important;
        -webkit-app-region: no-drag !important;
      }

      #${TOOLTIP_ID},
      #${RICH_TIP_ID} {
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
      #${TOOLTIP_ID}.visible,
      #${RICH_TIP_ID}.visible { opacity: 1; }

      #${RICH_TIP_ID} {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      #${RICH_TIP_ID} .nk-rich-game {
        font-size: 13px;
        color: #E0E1E6;
        font-weight: 500;
      }
      #${RICH_TIP_ID} .nk-rich-desc {
        font-size: 12px;
        color: #ffffffaa;
        white-space: normal;
        word-break: break-word;
      }
    `
    ;(document.head || document.documentElement).appendChild(s)
  }

  // ─── Status classes sync ──────────────────────────────���─������─────────────────

  function syncStatusClasses() {
    const userBtn = document.querySelector(USER_BTN_SEL)
    if (!userBtn) return
    const anchor = document.querySelector(ANCHOR_SEL)
    const nodes  = [userBtn]
    let el = userBtn.parentElement
    while (el && el !== document.documentElement && el !== anchor?.parentElement) {
      nodes.push(el); el = el.parentElement
    }
    STATUS_CLASSES.forEach(cls =>
      document.documentElement.classList.toggle("nk-" + cls, nodes.some(n => n.classList.contains(cls)))
    )
  }

  function setupStatusObserver() {
    const userBtn = document.querySelector(USER_BTN_SEL)
    if (!userBtn || userBtn.dataset.nkStatusObs) return
    userBtn.dataset.nkStatusObs = "1"
    syncStatusClasses()
    new MutationObserver(syncStatusClasses).observe(userBtn, { attributes: true, attributeFilter: ["class"] })
  }

  // ─── Hole ──────────────────────────────────────────────────────────────────

  function getOrCreateHole(titleArea) {
    let hole = document.getElementById(HOLE_ID)
    if (!hole) {
      if (window.getComputedStyle(titleArea).position === "static")
        titleArea.style.position = "relative"
      hole = document.createElement("div")
      hole.id = HOLE_ID
      titleArea.appendChild(hole)
    }
    return hole
  }

  function positionHole(anchor, titleArea, hole) {
    const ar = anchor.getBoundingClientRect()
    const tr = titleArea.getBoundingClientRect()
    hole.style.left = (ar.right - tr.left + OFFSET) + "px"
    hole.style.top  = (ar.top - tr.top + ar.height / 2 - 16) + "px"
  }

  // ─── Clone helpers ─────────────────────────────────────────────────────────

  // скрыть оригинал inline-стилем (не через CSS — чтобы можно было легко снять)
  function hideOriginal(el) {
    el.style.setProperty("display", "none", "important")
    el.dataset.nkHidden = "1"
  }

  function showOriginal(el) {
    el.style.removeProperty("display")
    delete el.dataset.nkHidden
  }

  function makeClone(original, clickTarget) {
    const clone = original.cloneNode(true)
    // убираем служебные атрибуты которые могут помешать
    delete clone.dataset.nkHidden
    clone.dataset.nkClone = "1"
    clone.removeAttribute("title")
    clone.querySelectorAll("[title]").forEach(e => e.removeAttribute("title"))
    // tooltip
    const title = original.getAttribute("title")
      || original.querySelector("[title]")?.getAttribute("title")
    if (title) clone.setAttribute("data-nk-tooltip", title)
    // делегируем клик на оригинал
    clone.addEventListener("click", (e) => { e.stopPropagation(); clickTarget.click() })
    // зеркалим изменения классов оригинала на клон (активное состояние при открытом меню)
    function setClass(el, val) {
      if (typeof val === "string") {
        el.setAttribute("class", val)
      } else if (val && typeof val.baseVal === "string") {
        // SVGAnimatedString
        el.setAttribute("class", val.baseVal)
      }
    }
    new MutationObserver(() => {
      setClass(clone, original.getAttribute("class") || "")
      // синхронизируем классы дочерних элементов (SVG и др.)
      const origChildren  = original.querySelectorAll("[class]")
      const cloneChildren = clone.querySelectorAll("[class]")
      origChildren.forEach((origChild, i) => {
        const cloneChild = cloneChildren[i]
        if (cloneChild) setClass(cloneChild, origChild.getAttribute("class") || "")
      })
    }).observe(original, { attributes: true, attributeFilter: ["class"], subtree: true })
    return clone
  }

  // ─── Main sync ─────────────────────────────────────────────────────────────

  // флаг чтобы Observer не реагировал на наши изменения
  let _busy = false
  // сигнатура последних клонов — не пересоздаём если оригиналы не изменились
  let _lastSig = ""

  function buildHole() {
    const anchor       = document.querySelector(ANCHOR_SEL)
    const titleArea    = document.querySelector(TITLE_AREA_SEL)
    const friendReqBtn = document.querySelector(FRIEND_REQ_SEL)
    const addFriendBtn = document.querySelector(ADD_FRIEND_SEL)

    if (!anchor || !titleArea) return
    if (!friendReqBtn && !addFriendBtn) return

    const hole = getOrCreateHole(titleArea)
    hole.style.removeProperty("display")

    // если оригиналы не изменились — только перепозиционируем, не трогаем DOM
    const sig = (friendReqBtn?.outerHTML || "") + (addFriendBtn?.outerHTML || "")
    if (sig === _lastSig && hole.querySelector("[data-nk-clone]")) {
      _busy = true
      positionHole(anchor, titleArea, hole)
      _busy = false
      return
    }
    _lastSig = sig

    _busy = true

    // очищаем старые клоны (оригиналы не трогаем — CSS их уже скрывает)
    hole.innerHTML = ""

    if (friendReqBtn) {
      const clone = makeClone(friendReqBtn, friendReqBtn)
      hole.appendChild(clone)
    }

    if (addFriendBtn) {
      const wrap = addFriendBtn.closest("a") || addFriendBtn
      const clone = makeClone(wrap, wrap)
      clone.style.setProperty("display",  "block",   "important")
      clone.style.setProperty("width",    "32px",    "important")
      clone.style.setProperty("height",   "32px",    "important")
      clone.style.setProperty("overflow", "visible", "important")
      clone.style.setProperty("padding",  "0",       "important")
      hole.appendChild(clone)
    }

    positionHole(anchor, titleArea, hole)

    _busy = false
  }

  function destroyHole() {
    _busy = true
    _lastSig = ""

    const hole = document.getElementById(HOLE_ID)
    if (hole) {
      hole.innerHTML = ""
      hole.style.setProperty("display", "none", "important")
    }

    // оригиналы НЕ показываем — они остаются скрытыми пока buildHole не пересоздаст клоны
    // (если оффлайн и кнопок нет в DOM — data-nk-hidden просто ни на что не навешен)

    _busy = false
  }

  // ─── AvatarAndUser proxy ───────────────────────────────────────────────────

  let _proxyAnchor = null

  function setupAnchorProxy() {
    const anchor = document.querySelector(ANCHOR_SEL)
    if (!anchor || anchor === _proxyAnchor) return
    _proxyAnchor = anchor

    let tip = document.getElementById(TOOLTIP_ID)
    if (!tip) {
      tip = document.createElement("div")
      tip.id = TOOLTIP_ID
      document.body.appendChild(tip)
    }

    let richTip = document.getElementById(RICH_TIP_ID)
    if (!richTip) {
      richTip = document.createElement("div")
      richTip.id = RICH_TIP_ID
      document.body.appendChild(richTip)
    }

    // стандартные статусы которые не являются rich presence
    const PLAIN_STATUSES = new Set([
      // русский
      "В сети", "Нет на месте", "Не в сети", "Невидимка",
      // английский
      "Online", "Away", "Offline", "Invisible", "Snooze",
      // украинский
      "В мережі", "Немає на місці", "Не в мережі", "Невидимий",
      // немецкий
      "Online", "Abwesend", "Offline", "Unsichtbar",
      // французский
      "En ligne", "Absent", "Hors ligne", "Invisible",
      // польский
      "Online", "Zaraz wracam", "Offline", "Niewidoczny",
      // испанский
      "En línea", "Ausente", "Sin conexión", "Invisible",
      // португальский
      "Online", "Ausente", "Offline", "Invisível",
      // турецкий
      "Çevrimiçi", "Uzakta", "Çevrimdışı", "Görünmez",
      // китайский
      "在线", "离开", "离线", "隐身",
      // японский
      "オンライン", "退席中", "オフライン", "非表示",
      // корейский
      "온라인", "자리 비움", "오프라인", "투명",
      // итальянский
      "In linea", "Assente", "Non in linea", "Invisibile",
      // нидерландский
      "Online", "Afwezig", "Offline", "Onzichtbaar",
      // венгерский
      "Online", "Távol", "Offline", "Láthatatlan",
      // чешский
      "Online", "Pryč", "Offline", "Neviditelný",
      // румынский
      "Online", "Plecat", "Offline", "Invizibil",
      // греческий
      "Σε σύνδεση", "Απών", "Εκτός σύνδεσης", "Αόρατος",
      // финский
      "Online", "Poissa", "Offline", "Näkymätön",
      // шведский
      "Online", "Borta", "Offline", "Osynlig",
      // норвежский
      "Tilkoblet", "Borte", "Frakoblet", "Usynlig",
      // датский
      "Online", "Væk", "Offline", "Usynlig",
      // тайский
      "ออนไลน์", "อยู่ห่าง", "ออฟไลน์", "ล่องหน",
      // вьетнамский
      "Trực tuyến", "Vắng mặt", "Ngoại tuyến", "Ẩn danh",
      // индонезийский
      "Daring", "Pergi", "Luring", "Tidak Terlihat",
      // арабский
      "متصل", "بعيد", "غير متصل", "مجهول",
      // иврит
      "מחובר", "נעדר", "לא מחובר", "בלתי נראה",
      // традиционный китайский
      "線上", "離開", "離線", "隱身",
    ])

    function getRichPresence() {
      const container = document.querySelector(RICH_SEL)
      if (!container) return null
      const allEls = container.querySelectorAll("._2Ri005Wg_uXDTa71kdRbcN")
      if (!allEls.length) return null
      const descEl = container.querySelector("._2Ri005Wg_uXDTa71kdRbcN:not(._1cB0qtF0paHWWyj1XNcnbG)")
      const nameEl = container.querySelector("._2Ri005Wg_uXDTa71kdRbcN._1cB0qtF0paHWWyj1XNcnbG")
      const name = nameEl?.textContent?.trim() || ""
      const desc = descEl?.textContent?.trim() || ""
      // если оба поля — просто статус (не игра) — не показываем тултип
      if (PLAIN_STATUSES.has(name) && !desc) return null
      if (PLAIN_STATUSES.has(desc) && !name) return null
      if (!name && !desc) return null
      return { name, desc }
    }

    function positionTip() {
      const r = anchor.getBoundingClientRect()
      const w = tip.getBoundingClientRect().width || 80
      tip.style.left = Math.round(r.left + r.width / 2 - w / 2) + "px"
      tip.style.top  = Math.round(r.bottom + 6) + "px"
    }

    function positionRichTip() {
      const r    = anchor.getBoundingClientRect()
      const rw   = richTip.getBoundingClientRect().width  || 100
      const rh   = richTip.getBoundingClientRect().height || 20
      const tipR = tip.getBoundingClientRect()
      const tipH = tipR.height || 28

      // по горизонтали — центрируем, clamp в рамки экрана
      const rawLeft = r.left + r.width / 2 - rw / 2
      const clampedLeft = Math.max(4, Math.min(rawLeft, window.innerWidth - rw - 4))
      richTip.style.left = Math.round(clampedLeft) + "px"

      // по вертикали: пробуем снизу под первым тултипом
      const belowTop = Math.round(parseFloat(tip.style.top || r.bottom + 6) + tipH + 4)
      if (belowTop + rh + 4 <= window.innerHeight) {
        richTip.style.top = belowTop + "px"
      } else {
        // не влезает снизу — показываем над первым тултипом
        const aboveTop = Math.round(parseFloat(tip.style.top || r.top) - rh - 4)
        richTip.style.top = Math.max(4, aboveTop) + "px"
      }
    }

    function showTip() {
      tip.textContent = getStatusLabel()
      tip.style.setProperty("opacity",    "0",       "important")
      tip.style.setProperty("transition", "none",    "important")
      tip.style.setProperty("top",        "-9999px", "important")
      tip.style.setProperty("left",       "-9999px", "important")
      tip.classList.add("visible")

      const rich = getRichPresence()
      if (rich) {
        richTip.innerHTML = ""
        if (rich.name) {
          const nameEl = document.createElement("span")
          nameEl.className = "nk-rich-game"
          nameEl.textContent = rich.name
          richTip.appendChild(nameEl)
        }
        if (rich.desc) {
          const descEl = document.createElement("span")
          descEl.className = "nk-rich-desc"
          descEl.textContent = rich.desc
          richTip.appendChild(descEl)
        }
        richTip.style.setProperty("opacity",    "0",       "important")
        richTip.style.setProperty("transition", "none",    "important")
        richTip.style.setProperty("top",        "-9999px", "important")
        richTip.style.setProperty("left",       "-9999px", "important")
        richTip.classList.add("visible")
      }

      requestAnimationFrame(() => {
        positionTip()
        tip.style.removeProperty("opacity")
        tip.style.removeProperty("transition")
        if (rich) {
          positionRichTip()
          richTip.style.removeProperty("opacity")
          richTip.style.removeProperty("transition")
        }
      })
    }

    function hideTip() {
      tip.classList.remove("visible")
      richTip.classList.remove("visible")
    }

    let proxyBusy = false
    anchor.addEventListener("click", (e) => {
      if (e.target.closest(`#${HOLE_ID}`)) return
      if (proxyBusy) return
      hideTip()
      const btn = anchor.querySelector(".ContextMenuButton")
      if (!btn) return
      proxyBusy = true
      btn.click()
      proxyBusy = false
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

    anchor.addEventListener("mouseenter", showTip)
    anchor.addEventListener("mouseleave", hideTip)
    anchor.addEventListener("mouseover",  (e) => {
      if (e.target.closest(".currentUserAvatar .avatarHolder")) hideTip()
    })
    anchor.addEventListener("mouseout", (e) => {
      if (
        e.target.closest(".currentUserAvatar .avatarHolder") &&
        anchor.contains(e.relatedTarget) &&
        !e.relatedTarget?.closest(".currentUserAvatar .avatarHolder")
      ) showTip()
    })


  }

  // ─── Init ──────���───────────────────────────────────────────────────────────

  let scheduleTimer = null
  function schedule(delay = 50) {
    clearTimeout(scheduleTimer)
    scheduleTimer = setTimeout(() => {
      setupAnchorProxy()
      setupStatusObserver()
      buildHole()
    }, delay)
  }

  function isOffline() {
    return !!document.querySelector(OFFLINE_SEL)
  }

  function init() {
    injectStyle()

    let wasOffline = isOffline()
    if (!wasOffline) schedule(0)

    let debounceTimer = null

    new MutationObserver(() => {
      if (_busy) return

      const nowOffline = isOffline()

      if (nowOffline !== wasOffline) {
        wasOffline = nowOffline
        clearTimeout(debounceTimer)
        if (nowOffline) {
          // ушли оффлайн — убираем клоны, показываем оригиналы
          destroyHole()
        } else {
          // вернулись онлайн — ждём пока Steam восстановит кнопки, затем клонируем
          _proxyAnchor = null
          schedule(500)
        }
        return
      }

      if (!nowOffline) {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => schedule(0), 150)
      }
    }).observe(document.body, { childList: true, subtree: true })

    const anchor = document.querySelector(ANCHOR_SEL)
    if (anchor && window.ResizeObserver) new ResizeObserver(() => schedule()).observe(anchor)
    window.addEventListener("resize", () => schedule())
  }

  // инжектируем стиль сразу — до DOMContentLoaded — чтобы оригинальные кнопки не мелькали
  injectStyle()

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()

})()
