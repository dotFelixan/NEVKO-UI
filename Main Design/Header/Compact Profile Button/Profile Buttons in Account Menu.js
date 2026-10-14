// Profile items in account menu + "Change Status" submenu | Pair with Hide Profile Button.css

;(() => {
  "use strict"

  const LINKS = {
    profile:    "steam://url/SteamIDMyProfile",
    friends:    "steam://openurl/https://steamcommunity.com/friends",
    activities: "steam://url/SteamIDFriendsPage",
    inventory:  "steam://url/CommunityInventory",
  }

  // url + Steam persona state (EPersonaState)
  const STATUSES = {
    online:    { url: "steam://friends/status/online",    state: 1 },
    away:      { url: "steam://friends/status/away",      state: 3 },
    invisible: { url: "steam://friends/status/invisible", state: 7 },
    offline:   { url: "steam://friends/status/offline",   state: 0 },
  }

  const CHECK = "M 3 8.5 L 6.5 12 L 13 4.5"

  const MENU = ".HoGkIKTQnkTEFGjqO-GMl"
  const MENU_ITEM = "._2jXHP0742MyApMUVUM8IFn"
  const SEPARATOR = "._21GPYlKBCLsHQpTsHw_RL_"
  const DRIVER = "#driver"


  // Texts

  const TEXTS = {
    ru: { profile: "Мой профиль", activities: "Активности", inventory: "Инвентарь", friends: "Друзья", changeStatus: "Сменить статус", back: "Назад", online: "В сети", away: "Нет на месте", invisible: "Невидимка", offline: "Не в сети" },
    en: { profile: "View my profile", activities: "Activities", inventory: "Inventory", friends: "Friends", changeStatus: "Change Status", back: "Back", online: "Online", away: "Away", invisible: "Invisible", offline: "Offline" },
    uk: { profile: "Переглянути мій профіль", activities: "Активності", inventory: "Інвентар", friends: "Друзі", changeStatus: "Змінити статус", back: "Назад", online: "В мережі", away: "Відійшов", invisible: "Невидимий", offline: "Не в мережі" },
    es: { profile: "Ver mi perfil", activities: "Actividades", inventory: "Inventario", friends: "Amigos", changeStatus: "Cambiar Estado", back: "Volver", online: "Conectado", away: "Ausente", invisible: "Invisible", offline: "Desconectado" },
    de: { profile: "Mein Profil", activities: "Aktivitäten", inventory: "Inventar", friends: "Freunde", changeStatus: "Status ändern", back: "Zurück", online: "Online", away: "Abwesend", invisible: "Unsichtbar", offline: "Offline" },
    fr: { profile: "Afficher mon profil", activities: "Activités", inventory: "Inventaire", friends: "Amis", changeStatus: "Changer le statut", back: "Retour", online: "En ligne", away: "Absent", invisible: "Invisible", offline: "Hors ligne" },
    it: { profile: "Visualizza il mio profilo", activities: "Attività", inventory: "Inventario", friends: "Amici", changeStatus: "Cambia stato", back: "Indietro", online: "Online", away: "Assente", invisible: "Invisibile", offline: "Offline" },
    pt: { profile: "Ver meu perfil", activities: "Atividades", inventory: "Inventário", friends: "Amigos", changeStatus: "Mudar Status", back: "Voltar", online: "Online", away: "Ausente", invisible: "Invisível", offline: "Offline" },
    pl: { profile: "Zobacz mój profil", activities: "Aktywności", inventory: "Ekwipunek", friends: "Znajomi", changeStatus: "Zmień status", back: "Wstecz", online: "Online", away: "Zaraz wracam", invisible: "Niewidoczny", offline: "Offline" },
    tr: { profile: "Profilimi görüntüle", activities: "Etkinlikler", inventory: "Envanter", friends: "Arkadaşlar", changeStatus: "Durumu Değiştir", back: "Geri", online: "Çevrimiçi", away: "Uzakta", invisible: "Görünmez", offline: "Çevrimdışı" },
    ja: { profile: "プロフィールを表示", activities: "アクティビティ", inventory: "インベントリ", friends: "フレンド", changeStatus: "ステータスを変更", back: "戻る", online: "オンライン", away: "退席中", invisible: "非表示", offline: "オフライン" },
    ko: { profile: "내 프로필 보기", activities: "활동", inventory: "인벤토리", friends: "친구", changeStatus: "상태 변경", back: "뒤로", online: "온라인", away: "자리 비움", invisible: "오프라인 표시", offline: "오프라인" },
    "zh-cn": { profile: "查看我的个人资料", activities: "动态", inventory: "库存", friends: "好友", changeStatus: "更改状态", back: "返回", online: "在线", away: "离开", invisible: "隐身", offline: "离线" },
    "zh-tw": { profile: "查看我的個人資料", activities: "動態", inventory: "庫存", friends: "好友", changeStatus: "更改狀態", back: "返回", online: "線上", away: "離開", invisible: "隱身", offline: "離線" },
    th: { profile: "ดูโปรไฟล์ของฉัน", activities: "กิจกรรม", inventory: "คลังสิ่งของ", friends: "เพื่อน", changeStatus: "เปลี่ยนสถานะ", back: "กลับ", online: "ออนไลน์", away: "ไม่อยู่", invisible: "ซ่อนตัว", offline: "ออฟไลน์" },
    cs: { profile: "Zobrazit můj profil", activities: "Aktivity", inventory: "Inventář", friends: "Přátelé", changeStatus: "Změnit stav", back: "Zpět", online: "Online", away: "Pryč", invisible: "Neviditelný", offline: "Offline" },
    da: { profile: "Se min profil", activities: "Aktiviteter", inventory: "Inventar", friends: "Venner", changeStatus: "Skift status", back: "Tilbage", online: "Online", away: "Væk", invisible: "Usynlig", offline: "Offline" },
    nl: { profile: "Bekijk mijn profiel", activities: "Activiteiten", inventory: "Inventaris", friends: "Vrienden", changeStatus: "Status wijzigen", back: "Terug", online: "Online", away: "Afwezig", invisible: "Onzichtbaar", offline: "Offline" },
    fi: { profile: "Näytä profiilini", activities: "Aktiviteetit", inventory: "Inventaario", friends: "Ystävät", changeStatus: "Vaihda tila", back: "Takaisin", online: "Paikalla", away: "Poissa", invisible: "Näkymätön", offline: "Offline" },
    no: { profile: "Se profilen min", activities: "Aktiviteter", inventory: "Inventar", friends: "Venner", changeStatus: "Endre status", back: "Tilbake", online: "Pålogget", away: "Borte", invisible: "Usynlig", offline: "Frakoblet" },
    sv: { profile: "Visa min profil", activities: "Aktiviteter", inventory: "Inventarie", friends: "Vänner", changeStatus: "Ändra status", back: "Tillbaka", online: "Online", away: "Borta", invisible: "Osynlig", offline: "Offline" },
    hu: { profile: "Profilom megtekintése", activities: "Tevékenységek", inventory: "Felszerelés", friends: "Barátok", changeStatus: "Állapot módosítása", back: "Vissza", online: "Elérhető", away: "Nincs a gépnél", invisible: "Láthatatlan", offline: "Nem elérhető" },
    ro: { profile: "Vezi profilul meu", activities: "Activități", inventory: "Inventar", friends: "Prieteni", changeStatus: "Schimbă starea", back: "Înapoi", online: "Online", away: "Plecat", invisible: "Invizibil", offline: "Offline" },
    bg: { profile: "Виж профила ми", activities: "Дейности", inventory: "Инвентар", friends: "Приятели", changeStatus: "Промяна на статус", back: "Назад", online: "На линия", away: "Отсъстващ", invisible: "Невидим", offline: "Извън линия" },
    el: { profile: "Προβολή προφίλ", activities: "Δραστηριότητες", inventory: "Αποθήκη", friends: "Φίλοι", changeStatus: "Αλλαγή κατάστασης", back: "Πίσω", online: "Σε σύνδεση", away: "Λείπω", invisible: "Αόρατος", offline: "Εκτός σύνδεσης" },
  }

  // Native "Open Profile" (beta), lowercase
  const NATIVE_PROFILE_ITEMS = new Set([
    "открыть мой профиль", "view my profile", "ver mi perfil", "mein profil anzeigen",
    "afficher mon profil", "visualizza profilo", "ver meu perfil", "wyświetl mój profil",
    "profilimi görüntüle", "переглянути мій профіль", "プロフィールを表示する", "내 프로필 보기",
    "查看我的个人资料", "查看我的個人資料", "ดูโปรไฟล์ของฉัน", "zobrazit můj profil",
    "se min profil", "bekijk mijn profiel", "näytä profiilini", "visa min profil",
    "profilom megtekintése", "vezi profilul meu", "виж профила ми", "προβολή προφίλ",
    ...Object.values(TEXTS).map(t => t.profile.toLowerCase()),
  ])

  // Hide "Store Preferences"
  const STORE_SETTINGS_ITEMS = new Set([
    "store preferences", "preferencias de la tienda", "paramètres du magasin",
    "store-einstellungen", "preferenze dello store", "preferências da loja",
    "ustawienia sklepu", "mağaza tercihleri", "налаштування магазину",
    "настройки магазина", "ストア設定", "스토어 환경설정", "商店偏好设置", "商店偏好設定",
    "การตั้งค่าร้านค้า", "nastavení obchodu", "butiksindstillinger", "winkelvoorkeuren",
    "kaupan asetukset", "butikkinnstillinger", "butiksinställningar",
    "áruházi beállítások", "preferințe magazin", "ρυθμίσεις καταστήματος",
  ])

  function getTexts() {
    const lang = (document.documentElement.lang || navigator.language || "en").toLowerCase()
    return TEXTS[lang] || TEXTS[lang.split("-")[0]] || TEXTS.en
  }


  // Items

  // Copies of native Steam item
  function menuItem(template, text, onClick) {
    const item = template.cloneNode(true)
    item.removeAttribute("id")
    item.textContent = text
    item.classList.add("nk-menu-item")
    item.addEventListener("click", event => {
      event.preventDefault()
      event.stopPropagation()
      onClick()
    })
    return item
  }

  const linkItem = (template, text, url) => menuItem(template, text, () => { location.href = url })

  // Text + icon (reversed for "Back")
  function arrowItem(template, text, arrow, arrowFirst, onClick) {
    const item = menuItem(template, "", onClick)
    const label = document.createElement("span")
    const icon = document.createElement("span")
    label.textContent = text
    icon.textContent = arrow
    icon.className = arrowFirst ? "nk-arrow-left" : "nk-arrow-right"
    item.classList.add("nk-arrow-item")
    item.append(...(arrowFirst ? [icon, label] : [label, icon]))
    return item
  }

  // Check + text, check shown on the current status
  function statusItem(template, text, status) {
    // Check moves at once (Steam applies the status a moment later), then synced with Steam
    const item = menuItem(template, "", () => {
      const menu = item.parentElement
      pendingStatus = { state: status.state, until: Date.now() + PENDING_TIME }
      if (menu) markCurrentStatus(menu)
      location.href = status.url
      if (menu) setTimeout(() => markCurrentStatus(menu), PENDING_TIME + 100) // Steam didn't apply it -> real one
    })
    const check = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    check.setAttribute("viewBox", "0 0 16 16")
    check.setAttribute("class", "nk-status-check")
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", CHECK)
    check.append(path)
    const label = document.createElement("span")
    label.textContent = text
    item.classList.add("nk-status-option")
    item.dataset.nkPersona = status.state
    item.append(check, label)
    return item
  }

  // Status the user picked (not auto-away), from the friends store of SharedJSContext
  // Just clicked, Steam not updated yet -> the clicked one
  const PENDING_TIME = 3000
  let pendingStatus = null

  function steamStatus() {
    for (const win of [window, window.opener, window.opener?.opener]) {
      try {
        const state = win?.g_FriendsUIApp?.FriendStore?.m_eUserPersonaState
        if (typeof state === "number") return state
      } catch {}
    }
    return null
  }

  function currentStatus() {
    const state = steamStatus()
    if (pendingStatus && Date.now() < pendingStatus.until && state !== pendingStatus.state) return pendingStatus.state
    pendingStatus = null
    return state
  }

  function markCurrentStatus(menu) {
    const state = currentStatus()
    for (const item of menu.querySelectorAll(":scope > .nk-status-option")) {
      item.classList.toggle("nk-current", state !== null && Number(item.dataset.nkPersona) === state)
    }
  }

  function separatorFrom(separator) {
    const copy = separator.cloneNode(true)
    copy.removeAttribute("id")
    copy.classList.add("nk-menu-item")
    return copy
  }


  // Build

  // Status Submenu | Menu is a separate window, Steam resizes it a frame late
  // Steam items are moved out (same nodes), spacer keeps height
  const statusViews = new WeakMap() // menu -> { parked, main, status, spacer }

  // First visible Steam item
  const firstSteamItem = menu => [...menu.children].find(el => !isOurs(el) && getComputedStyle(el).display !== "none")

  const isOurs = node => node.nodeType === Node.ELEMENT_NODE && node.classList.contains("nk-menu-item")

  // Wait for window resize (or a couple of frames)
  function afterWindowResize(callback) {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      removeEventListener("resize", onResize)
      callback()
    }
    // One more frame after resize
    const onResize = () => requestAnimationFrame(finish)
    addEventListener("resize", onResize)
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(finish)))
  }

  // Group corners: first / last visible item between separators (hidden items in between break CSS + selectors)
  function markGroups(menu) {
    const first = new Set()
    const lastOnes = new Set()
    let last = null
    for (const el of menu.children) {
      if (!el.matches(MENU_ITEM) || getComputedStyle(el).display === "none") continue
      if (el.matches(SEPARATOR)) {
        if (last) lastOnes.add(last)
        last = null
        continue
      }
      if (!last) first.add(el)
      last = el
    }
    if (last) lastOnes.add(last)
    // toggle with force: no change -> no mutation (the observer watches class)
    for (const el of menu.children) {
      el.classList.toggle("nk-group-first", first.has(el))
      el.classList.toggle("nk-group-last", lastOnes.has(el))
    }
  }

  // Window background = menu color until resized (popup menu window only)
  function paintWindowLikeMenu(menu, on) {
    if (!document.documentElement.classList.contains("ContextMenuPopup")) return
    const color = on ? getComputedStyle(menu).backgroundColor : ""
    document.documentElement.style.backgroundColor = color
    document.body.style.backgroundColor = color
  }

  function showStatusView(menu) {
    const view = statusViews.get(menu)
    if (!view || view.parked) return

    paintWindowLikeMenu(menu, true)
    markCurrentStatus(menu)

    // Align Steam items with main menu, second pass for margin collapse
    const steamItem = firstSteamItem(menu)
    const targetTop = steamItem?.getBoundingClientRect().top
    view.spacer.style.height = "0px"
    menu.classList.add("nk-status-view")
    if (steamItem) {
      let height = 0
      for (let pass = 0; pass < 2; pass++) {
        height = Math.max(0, height + targetTop - steamItem.getBoundingClientRect().top)
        view.spacer.style.height = `${height}px`
      }
    }

    view.parked = document.createDocumentFragment()
    view.parked.append(...[...menu.childNodes].filter(node => !isOurs(node)))
    markGroups(menu)

    afterWindowResize(() => paintWindowLikeMenu(menu, false))
  }

  function showMainView(menu, { instant = false } = {}) {
    const view = statusViews.get(menu)
    if (!view?.parked) return

    const switchToMain = () => {
      menu.classList.remove("nk-status-view", "nk-revealing")
      markGroups(menu)
      paintWindowLikeMenu(menu, false)
    }

    menu.classList.add("nk-revealing") // Steam items hidden for now
    menu.append(view.parked)           // same order
    view.parked = null

    if (instant) switchToMain()
    else {
      paintWindowLikeMenu(menu, true)
      afterWindowResize(switchToMain)
    }
  }

  function buildMenu(menu) {
    const items = menu.querySelectorAll(MENU_ITEM)
    if (!items.length) return false

    const t = getTexts()
    const template = items[0]
    const separator = items[4] ?? items[0]

    for (const item of items) {
      const text = item.textContent.trim().toLowerCase()
      if (NATIVE_PROFILE_ITEMS.has(text)) item.remove()
      else if (STORE_SETTINGS_ITEMS.has(text)) item.style.setProperty("display", "none", "important")
    }

    const main = [
      linkItem(template, t.profile, LINKS.profile),
      linkItem(template, t.friends, LINKS.friends),
      linkItem(template, t.activities, LINKS.activities),
      linkItem(template, t.inventory, LINKS.inventory),
      separatorFrom(separator),
      arrowItem(template, t.changeStatus, ">", false, () => showStatusView(menu)),
      separatorFrom(separator),
    ]
    const status = [
      arrowItem(template, t.back, "<", true, () => showMainView(menu)),
      separatorFrom(separator),
      ...Object.entries(STATUSES).map(([key, status]) => statusItem(template, t[key], status)),
    ]
    // Spacer
    const spacer = document.createElement("div")
    spacer.className = "nk-menu-item nk-status-spacer"
    main.forEach(item => item.classList.add("nk-main-item"))
    status.forEach(item => item.classList.add("nk-status-item"))
    spacer.classList.add("nk-status-item")

    menu.prepend(...main, ...status, spacer)
    statusViews.set(menu, { parked: null, main, status, spacer })

    // Steam #driver stays last
    const driver = menu.parentElement?.querySelector(DRIVER)
    driver?.parentNode?.append(driver)

    menu.dataset.nkProfileItems = t.profile
    return true
  }

  function removeOurItems(menu) {
    showMainView(menu, { instant: true })
    menu.querySelectorAll(":scope > .nk-menu-item").forEach(item => item.remove())
    delete menu.dataset.nkProfileItems
  }

  // Rebuild on redraw / language change
  function update() {
    const menu = document.querySelector(MENU)
    if (!menu) return
    // In-page menu closed -> reopen on main view
    if (statusViews.get(menu)?.parked && !menu.closest(".visible")) showMainView(menu, { instant: true })
    const built = menu.dataset.nkProfileItems
    if (built && built === getTexts().profile && menu.querySelector(":scope > .nk-menu-item")) {
      if (menu.closest(".visible")) { // open menu only: getComputedStyle per item
        markGroups(menu)
        markCurrentStatus(menu)
      }
      return
    }
    if (built) removeOurItems(menu)
    if (buildMenu(menu)) markGroups(menu)
  }


  // Start

  function injectStyles() {
    const style = document.createElement("style")
    style.id = "nk-profile-menu-style"
    style.textContent = `
      /* Visible Block */
      ${MENU}:not(.nk-status-view) > .nk-status-item,
      ${MENU}.nk-status-view > .nk-main-item { display: none !important; }
      ${MENU}.nk-revealing > :not(.nk-menu-item) { visibility: hidden !important; }

      ${MENU} > .nk-arrow-item { display: flex; align-items: center; }
      ${MENU} > .nk-arrow-item > :not([class^="nk-arrow"]) { flex: 1; }
      ${MENU} .nk-arrow-right { padding-left: 8px; }
      ${MENU} .nk-arrow-left { margin-right: 8px; }

      /* Status Check */
      ${MENU} > .nk-status-option { display: flex; align-items: center; }
      ${MENU} .nk-status-check {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
        margin-right: 8px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0;
      }
      ${MENU} > .nk-current .nk-status-check { opacity: 1; }
    `
    document.head.append(style)
  }

  function init() {
    injectStyles()
    update()

    // Build in the same frame Steam drew the menu
    new MutationObserver(update).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["lang", "class"],
    })

    // Closed, reopen on main view
    addEventListener("blur", () => {
      const menu = document.querySelector(MENU)
      if (menu) showMainView(menu, { instant: true })
    })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
