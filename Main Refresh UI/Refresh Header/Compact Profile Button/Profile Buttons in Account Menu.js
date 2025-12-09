// ==============================================================================
// Steam Profile Menu Enhancement Script
// ==============================================================================
// НАСТРОЙКИ ДЛЯ ПОЛЬЗОВАТЕЛЯ / USER SETTINGS
// ==============================================================================

const CONFIG = {
  // ==================== ССЫЛКИ / URLS ====================
  // Измените ссылки если нужно / Change URLs if needed
  urls: {
    profile: "steam://url/SteamIDMyProfile",
    activities: "steam://url/SteamIDFriendsPage",
    inventory: "steam://url/CommunityInventory",
    friends: "steam://openurl/https://steamcommunity.com/friends",
    online: "steam://friends/status/online",
    away: "steam://friends/status/away",
    invisible: "steam://friends/status/invisible",
    offline: "steam://friends/status/offline",
  },

  // ==================== СЕЛЕКТОРЫ / SELECTORS ====================
  // Не изменяйте если не знаете что делаете / Don't change if you don't know what you're doing
  selectors: {
    mainContainer: ".HoGkIKTQnkTEFGjqO-GMl",
    buttonClass: "._2jXHP0742MyApMUVUM8IFn",
    driver: "#driver",
  },
}

// ==============================================================================
// ПЕРЕВОДЫ / TRANSLATIONS
// ==============================================================================
// Добавьте или измените переводы здесь / Add or modify translations here

const TRANSLATIONS = {
  // Русский
  ru: {
    myProfile: "Мой профиль",
    activities: "Активности",
    inventory: "Инвентарь",
    friends: "Друзья",
    changeStatus: "Сменить статус",
    back: "Назад",
    online: "В сети",
    away: "Нет на месте",
    invisible: "Невидимка",
    offline: "Не в сети",
  },

  // English
  en: {
    myProfile: "View my profile",
    activities: "Activities",
    inventory: "Inventory",
    friends: "Friends",
    changeStatus: "Change Status",
    back: "Back",
    online: "Online",
    away: "Away",
    invisible: "Invisible",
    offline: "Offline",
  },

  // Español
  es: {
    myProfile: "Ver mi perfil",
    activities: "Actividades",
    inventory: "Inventario",
    friends: "Amigos",
    changeStatus: "Cambiar Estado",
    back: "Volver",
    online: "Conectado",
    away: "Ausente",
    invisible: "Invisible",
    offline: "Desconectado",
  },

  // Deutsch
  de: {
    myProfile: "Mein Profil",
    activities: "Aktivitäten",
    inventory: "Inventar",
    friends: "Freunde",
    changeStatus: "Status ändern",
    back: "Zurück",
    online: "Online",
    away: "Abwesend",
    invisible: "Unsichtbar",
    offline: "Offline",
  },

  // Français
  fr: {
    myProfile: "Afficher mon profil",
    activities: "Activités",
    inventory: "Inventaire",
    friends: "Amis",
    changeStatus: "Changer le statut",
    back: "Retour",
    online: "En ligne",
    away: "Absent",
    invisible: "Invisible",
    offline: "Hors ligne",
  },

  // Italiano
  it: {
    myProfile: "Visualizza il mio profilo",
    activities: "Attività",
    inventory: "Inventario",
    friends: "Amici",
    changeStatus: "Cambia stato",
    back: "Indietro",
    online: "Online",
    away: "Assente",
    invisible: "Invisibile",
    offline: "Offline",
  },

  // Português
  pt: {
    myProfile: "Ver meu perfil",
    activities: "Atividades",
    inventory: "Inventário",
    friends: "Amigos",
    changeStatus: "Mudar Status",
    back: "Voltar",
    online: "Online",
    away: "Ausente",
    invisible: "Invisível",
    offline: "Offline",
  },

  // Polski
  pl: {
    myProfile: "Zobacz mój profil",
    activities: "Aktywności",
    inventory: "Ekwipunek",
    friends: "Znajomi",
    changeStatus: "Zmień status",
    back: "Wstecz",
    online: "Online",
    away: "Zaraz wracam",
    invisible: "Niewidoczny",
    offline: "Offline",
  },

  // Türkçe
  tr: {
    myProfile: "Profilimi görüntüle",
    activities: "Etkinlikler",
    inventory: "Envanter",
    friends: "Arkadaşlar",
    changeStatus: "Durumu Değiştir",
    back: "Geri",
    online: "Çevrimiçi",
    away: "Uzakta",
    invisible: "Görünmez",
    offline: "Çevrimdışı",
  },

  // Українська
  uk: {
    myProfile: "Переглянути мій профіль",
    activities: "Активності",
    inventory: "Інвентар",
    friends: "Друзі",
    changeStatus: "Змінити статус",
    back: "Назад",
    online: "В мережі",
    away: "Відійшов",
    invisible: "Невидимий",
    offline: "Не в мережі",
  },

  // 日本語
  ja: {
    myProfile: "プロフィールを表示",
    activities: "アクティビティ",
    inventory: "インベントリ",
    friends: "フレンド",
    changeStatus: "ステータスを変更",
    back: "戻る",
    online: "オンライン",
    away: "退席中",
    invisible: "非表示",
    offline: "オフライン",
  },

  // 한국어
  ko: {
    myProfile: "내 프로필 보기",
    activities: "활동",
    inventory: "인벤토리",
    friends: "친구",
    changeStatus: "상태 변경",
    back: "뒤로",
    online: "온라인",
    away: "자리 비움",
    invisible: "오프라인 표시",
    offline: "오프라인",
  },

  // 简体中文
  "zh-CN": {
    myProfile: "查看我的个人资料",
    activities: "动态",
    inventory: "库存",
    friends: "好友",
    changeStatus: "更改状态",
    back: "返回",
    online: "在线",
    away: "离开",
    invisible: "隐身",
    offline: "离线",
  },

  // 繁體中文
  "zh-TW": {
    myProfile: "查看我的個人資料",
    activities: "動態",
    inventory: "庫存",
    friends: "好友",
    changeStatus: "更改狀態",
    back: "返回",
    online: "線上",
    away: "離開",
    invisible: "隱身",
    offline: "離線",
  },

  // ภาษาไทย
  th: {
    myProfile: "ดูโปรไฟล์ของฉัน",
    activities: "กิจกรรม",
    inventory: "คลังสิ่งของ",
    friends: "เพื่อน",
    changeStatus: "เปลี่ยนสถานะ",
    back: "กลับ",
    online: "ออนไลน์",
    away: "ไม่อยู่",
    invisible: "ซ่อนตัว",
    offline: "ออฟไลน์",
  },

  // Čeština
  cs: {
    myProfile: "Zobrazit můj profil",
    activities: "Aktivity",
    inventory: "Inventář",
    friends: "Přátelé",
    changeStatus: "Změnit stav",
    back: "Zpět",
    online: "Online",
    away: "Pryč",
    invisible: "Neviditelný",
    offline: "Offline",
  },

  // Dansk
  da: {
    myProfile: "Se min profil",
    activities: "Aktiviteter",
    inventory: "Inventar",
    friends: "Venner",
    changeStatus: "Skift status",
    back: "Tilbage",
    online: "Paikalla",
    away: "Væk",
    invisible: "Usynlig",
    offline: "Offline",
  },

  // Nederlands
  nl: {
    myProfile: "Bekijk mijn profiel",
    activities: "Activiteiten",
    inventory: "Inventaris",
    friends: "Vrienden",
    changeStatus: "Status wijzigen",
    back: "Terug",
    online: "Online",
    away: "Afwezig",
    invisible: "Onzichtbaar",
    offline: "Offline",
  },

  // Suomi
  fi: {
    myProfile: "Näytä profiilini",
    activities: "Aktiviteetit",
    inventory: "Inventaario",
    friends: "Ystävät",
    changeStatus: "Vaihda tila",
    back: "Takaisin",
    online: "Paikalla",
    away: "Poissa",
    invisible: "Näkymätön",
    offline: "Offline",
  },

  // Norsk
  no: {
    myProfile: "Se profilen min",
    activities: "Aktiviteter",
    inventory: "Inventar",
    friends: "Venner",
    changeStatus: "Endre status",
    back: "Tilbake",
    online: "Pålogget",
    away: "Borte",
    invisible: "Usynlig",
    offline: "Frakoblet",
  },

  // Svenska
  sv: {
    myProfile: "Visa min profil",
    activities: "Aktiviteter",
    inventory: "Inventarie",
    friends: "Vänner",
    changeStatus: "Ändra status",
    back: "Tillbaka",
    online: "Online",
    away: "Borta",
    invisible: "Osynlig",
    offline: "Offline",
  },

  // Magyar
  hu: {
    myProfile: "Profilom megtekintése",
    activities: "Tevékenységek",
    inventory: "Felszerelés",
    friends: "Barátok",
    changeStatus: "Állapot módosítása",
    back: "Vissza",
    online: "Elérhető",
    away: "Nincs a gépnél",
    invisible: "Láthatatlan",
    offline: "Nem elérhető",
  },

  // Română
  ro: {
    myProfile: "Vezi profilul meu",
    activities: "Activități",
    inventory: "Inventar",
    friends: "Prieteni",
    changeStatus: "Schimbă starea",
    back: "Înapoi",
    online: "Online",
    away: "Plecat",
    invisible: "Invizibil",
    offline: "Offline",
  },

  // Български
  bg: {
    myProfile: "Виж профила ми",
    activities: "Дейности",
    inventory: "Инвентар",
    friends: "Приятели",
    changeStatus: "Промяна на статус",
    back: "Назад",
    online: "На линия",
    away: "Отсъстващ",
    invisible: "Невидим",
    offline: "Извън линия",
  },

  // Ελληνικά
  el: {
    myProfile: "Προβολή προφίλ",
    activities: "Δραστηριότητες",
    inventory: "Αποθήκη",
    friends: "Φίλοι",
    changeStatus: "Αλλαγή κατάστασης",
    back: "Πίσω",
    online: "Σε σύνδεση",
    away: "Λείπω",
    invisible: "Αόρατος",
    offline: "Εκτός σύνδεσης",
  },
}

// ==============================================================================
// ОСНОВНОЙ КОД / MAIN CODE
// ==============================================================================
// Не изменяйте ниже если не уверены / Don't modify below if not sure

class SteamProfileEnhancer {
  constructor() {
    this.elements = {}
    this.currentLang = this.detectLanguage()
    this.statusViewActive = false
    this.savedMenuItems = []
    this.init()
  }

  // Определение языка / Language detection
  detectLanguage() {
    const lang =
      document.documentElement.lang ||
      document.querySelector('meta[name="language"]')?.content ||
      navigator.language ||
      "en"
    return lang.split("-")[0].toLowerCase()
  }

  // Получение перевода / Get translation
  t(key) {
    return TRANSLATIONS[this.currentLang]?.[key] || TRANSLATIONS.en[key] || key
  }

  // Кэширование элементов / Cache elements
  cacheElements() {
    const mainContainer = document.querySelector(CONFIG.selectors.mainContainer)
    const buttons = document.querySelectorAll(CONFIG.selectors.buttonClass)

    if (!mainContainer || !buttons.length) return false

    this.elements = {
      mainContainer,
      templateButton: buttons[0],
      separatorButton: buttons[4] || buttons[0],
    }
    return true
  }

  // Удаление дубликатов / Remove duplicates
  removeDuplicates() {
    const profileTexts = new Set(Object.values(TRANSLATIONS).map((l) => l.myProfile))
    document.querySelectorAll(CONFIG.selectors.buttonClass).forEach((btn) => {
      if (profileTexts.has(btn.textContent?.trim())) btn.remove()
    })
  }

  // Создание кнопки / Create button
  createButton(text, url) {
    const btn = this.elements.templateButton.cloneNode(true)
    btn.textContent = text
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      window.location.href = url
    })
    return btn
  }

  // Создание кнопки смены статуса / Create status change button
  createStatusButton() {
    const btn = this.elements.templateButton.cloneNode(true)
    btn.innerHTML = ""
    btn.id = "steam-status-change-btn"
    btn.style.cssText = "display:flex;align-items:center;justify-content:space-between"

    const text = document.createElement("span")
    text.textContent = this.t("changeStatus")
    text.style.flex = "1"

    const arrow = document.createElement("span")
    arrow.textContent = ">"
    arrow.style.cssText = "margin-left:auto;padding-left:8px"

    btn.append(text, arrow)
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.showStatusView()
    })

    return btn
  }

  // Показать меню статусов / Show status menu
  showStatusView() {
    if (this.statusViewActive) return
    this.statusViewActive = true

    const { mainContainer } = this.elements

    // Сохраняем и скрываем текущие элементы / Save and hide current items
    this.savedMenuItems = Array.from(mainContainer.children)
    this.savedMenuItems.forEach((el) => (el.style.display = "none"))

    // Кнопка "Назад" / Back button
    const backBtn = this.elements.templateButton.cloneNode(true)
    backBtn.innerHTML = ""
    backBtn.id = "steam-status-back-btn"
    backBtn.style.cssText = "display:flex;align-items:center"

    const backArrow = document.createElement("span")
    backArrow.textContent = "<"
    backArrow.style.marginRight = "8px"

    const backText = document.createElement("span")
    backText.textContent = this.t("back")

    backBtn.append(backArrow, backText)
    backBtn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.hideStatusView()
    })

    const backSeparator = document.createElement("hr")
    backSeparator.id = "steam-status-back-separator"
    backSeparator.className = this.elements.separatorButton.className

    // Кнопки статусов / Status buttons
    const statuses = [
      { key: "online", url: CONFIG.urls.online },
      { key: "away", url: CONFIG.urls.away },
      { key: "invisible", url: CONFIG.urls.invisible },
      { key: "offline", url: CONFIG.urls.offline },
    ]

    const statusBtns = statuses.map(({ key, url }) => {
      const btn = this.elements.templateButton.cloneNode(true)
      btn.textContent = this.t(key)
      btn.classList.add("steam-status-option")
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        window.location.href = url
      })
      return btn
    })

    mainContainer.insertBefore(backBtn, mainContainer.firstElementChild)
    mainContainer.insertBefore(backSeparator, backBtn.nextSibling)
    statusBtns.forEach((btn) => mainContainer.appendChild(btn))
  }

  // Скрыть меню статусов / Hide status menu
  hideStatusView() {
    if (!this.statusViewActive) return
    this.statusViewActive = false

    const { mainContainer } = this.elements

    const backBtn = document.getElementById("steam-status-back-btn")
    const backSeparator = document.getElementById("steam-status-back-separator")
    const statusBtns = document.querySelectorAll(".steam-status-option")

    backBtn?.remove()
    backSeparator?.remove()
    statusBtns.forEach((btn) => btn.remove())

    // Восстанавливаем оригинальные элементы / Restore original items
    this.savedMenuItems.forEach((el) => (el.style.display = ""))
    this.savedMenuItems = []
  }

  // Создание всех кнопок / Create all buttons
  createAllButtons() {
    return {
      profile: this.createButton(this.t("myProfile"), CONFIG.urls.profile),
      friends: this.createButton(this.t("friends"), CONFIG.urls.friends),
      activities: this.createButton(this.t("activities"), CONFIG.urls.activities),
      inventory: this.createButton(this.t("inventory"), CONFIG.urls.inventory),
      separator: this.elements.separatorButton.cloneNode(true),
      statusSeparator: this.elements.separatorButton.cloneNode(true),
      changeStatus: this.createStatusButton(),
    }
  }

  // Вставка кнопок / Insert buttons
  insertButtons(buttons) {
    const { mainContainer } = this.elements
    const order = ["separator", "changeStatus", "statusSeparator", "inventory", "activities", "friends", "profile"]

    order.forEach((key) => {
      if (buttons[key]) {
        mainContainer.insertBefore(buttons[key], mainContainer.firstElementChild)
      }
    })
  }

  // Перемещение driver / Reposition driver
  repositionDriver() {
    const driver = document.querySelector(CONFIG.selectors.driver)
    if (driver?.parentNode) driver.parentNode.appendChild(driver)
  }

  // Обновление языка / Update language
  updateLanguage() {
    this.currentLang = this.detectLanguage()
    if (this.elements.mainContainer) {
      this.removeDuplicates()
      this.insertButtons(this.createAllButtons())
    }
  }

  // Слушатели изменения языка / Language change listeners
  setupLanguageListeners() {
    document.addEventListener("languagechange", () => this.updateLanguage())

    new MutationObserver((mutations) => {
      if (mutations.some((m) => m.attributeName === "lang")) {
        this.updateLanguage()
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] })
  }

  // Инициализация / Initialize
  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init())
      return
    }

    if (!this.cacheElements()) {
      setTimeout(() => this.init(), 1000)
      return
    }

    this.removeDuplicates()
    this.insertButtons(this.createAllButtons())
    this.repositionDriver()
    this.setupLanguageListeners()
  }
}

// Запуск / Start
new SteamProfileEnhancer()
