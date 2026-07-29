// добавляет кнопки профиля, инвентаря, друзей и смены статуса в меню аккаунта Steam

const CONFIG = {
  urls: {
    profile:    "steam://url/SteamIDMyProfile",
    activities: "steam://url/SteamIDFriendsPage",
    inventory:  "steam://url/CommunityInventory",
    friends:    "steam://openurl/https://steamcommunity.com/friends",
    online:     "steam://friends/status/online",
    away:       "steam://friends/status/away",
    invisible:  "steam://friends/status/invisible",
    offline:    "steam://friends/status/offline",
  },

  selectors: {
    mainContainer: ".HoGkIKTQnkTEFGjqO-GMl",
    buttonClass:   "._2jXHP0742MyApMUVUM8IFn",
    driver:        "#driver",
  },
}

// переводы для всех поддерживаемых языков

const TRANSLATIONS = {
  ru:    { myProfile: "Мой профиль", activities: "Активности", inventory: "Инвентарь", friends: "Друзья", changeStatus: "Сменить статус", back: "Назад", online: "В сети", away: "Нет на месте", invisible: "Невидимка", offline: "Не в сети" },
  en:    { myProfile: "View my profile", activities: "Activities", inventory: "Inventory", friends: "Friends", changeStatus: "Change Status", back: "Back", online: "Online", away: "Away", invisible: "Invisible", offline: "Offline" },
  es:    { myProfile: "Ver mi perfil", activities: "Actividades", inventory: "Inventario", friends: "Amigos", changeStatus: "Cambiar Estado", back: "Volver", online: "Conectado", away: "Ausente", invisible: "Invisible", offline: "Desconectado" },
  de:    { myProfile: "Mein Profil", activities: "Aktivitäten", inventory: "Inventar", friends: "Freunde", changeStatus: "Status ändern", back: "Zurück", online: "Online", away: "Abwesend", invisible: "Unsichtbar", offline: "Offline" },
  fr:    { myProfile: "Afficher mon profil", activities: "Activités", inventory: "Inventaire", friends: "Amis", changeStatus: "Changer le statut", back: "Retour", online: "En ligne", away: "Absent", invisible: "Invisible", offline: "Hors ligne" },
  it:    { myProfile: "Visualizza il mio profilo", activities: "Attività", inventory: "Inventario", friends: "Amici", changeStatus: "Cambia stato", back: "Indietro", online: "Online", away: "Assente", invisible: "Invisibile", offline: "Offline" },
  pt:    { myProfile: "Ver meu perfil", activities: "Atividades", inventory: "Inventário", friends: "Amigos", changeStatus: "Mudar Status", back: "Voltar", online: "Online", away: "Ausente", invisible: "Invisível", offline: "Offline" },
  pl:    { myProfile: "Zobacz mój profil", activities: "Aktywności", inventory: "Ekwipunek", friends: "Znajomi", changeStatus: "Zmień status", back: "Wstecz", online: "Online", away: "Zaraz wracam", invisible: "Niewidoczny", offline: "Offline" },
  tr:    { myProfile: "Profilimi görüntüle", activities: "Etkinlikler", inventory: "Envanter", friends: "Arkadaşlar", changeStatus: "Durumu Değiştir", back: "Geri", online: "Çevrimiçi", away: "Uzakta", invisible: "Görünmez", offline: "Çevrimdışı" },
  uk:    { myProfile: "Переглянути мій профіль", activities: "Активності", inventory: "Інвентар", friends: "Друзі", changeStatus: "Змінити статус", back: "Назад", online: "В мережі", away: "Відійшов", invisible: "Невидимий", offline: "Не в мережі" },
  ja:    { myProfile: "プロフィールを表示", activities: "アクティビティ", inventory: "インベントリ", friends: "フレンド", changeStatus: "ステータスを変更", back: "戻る", online: "オンライン", away: "退席中", invisible: "非表示", offline: "オフライン" },
  ko:    { myProfile: "내 프로필 보기", activities: "활동", inventory: "인벤토리", friends: "친구", changeStatus: "상태 변경", back: "뒤로", online: "온라인", away: "자리 비움", invisible: "오프라인 표시", offline: "오프라인" },
  "zh-cn": { myProfile: "查看我的个人资料", activities: "动态", inventory: "库存", friends: "好友", changeStatus: "更改状态", back: "返回", online: "在线", away: "离开", invisible: "隐身", offline: "离线" },
  "zh-tw": { myProfile: "查看我的個人資料", activities: "動態", inventory: "庫存", friends: "好友", changeStatus: "更改狀態", back: "返回", online: "線上", away: "離開", invisible: "隱身", offline: "離線" },
  "zh":    { myProfile: "查看我的个人资料", activities: "动态", inventory: "库存", friends: "好友", changeStatus: "更改状态", back: "返回", online: "在线", away: "离开", invisible: "隐身", offline: "离线" },
  th:    { myProfile: "ดูโปรไฟล์ของฉัน", activities: "กิจกรรม", inventory: "คลังสิ่งของ", friends: "เพื่อน", changeStatus: "เปลี่ยนสถานะ", back: "กลับ", online: "ออนไลน์", away: "ไม่อยู่", invisible: "ซ่อนตัว", offline: "ออฟไลน์" },
  cs:    { myProfile: "Zobrazit můj profil", activities: "Aktivity", inventory: "Inventář", friends: "Přátelé", changeStatus: "Změnit stav", back: "Zpět", online: "Online", away: "Pryč", invisible: "Neviditelný", offline: "Offline" },
  da:    { myProfile: "Se min profil", activities: "Aktiviteter", inventory: "Inventar", friends: "Venner", changeStatus: "Skift status", back: "Tilbage", online: "Online", away: "Væk", invisible: "Usynlig", offline: "Offline" },
  nl:    { myProfile: "Bekijk mijn profiel", activities: "Activiteiten", inventory: "Inventaris", friends: "Vrienden", changeStatus: "Status wijzigen", back: "Terug", online: "Online", away: "Afwezig", invisible: "Onzichtbaar", offline: "Offline" },
  fi:    { myProfile: "Näytä profiilini", activities: "Aktiviteetit", inventory: "Inventaario", friends: "Ystävät", changeStatus: "Vaihda tila", back: "Takaisin", online: "Paikalla", away: "Poissa", invisible: "Näkymätön", offline: "Offline" },
  no:    { myProfile: "Se profilen min", activities: "Aktiviteter", inventory: "Inventar", friends: "Venner", changeStatus: "Endre status", back: "Tilbake", online: "Pålogget", away: "Borte", invisible: "Usynlig", offline: "Frakoblet" },
  sv:    { myProfile: "Visa min profil", activities: "Aktiviteter", inventory: "Inventarie", friends: "Vänner", changeStatus: "Ändra status", back: "Tillbaka", online: "Online", away: "Borta", invisible: "Osynlig", offline: "Offline" },
  hu:    { myProfile: "Profilom megtekintése", activities: "Tevékenységek", inventory: "Felszerelés", friends: "Barátok", changeStatus: "Állapot módosítása", back: "Vissza", online: "Elérhető", away: "Nincs a gépnél", invisible: "Láthatatlan", offline: "Nem elérhető" },
  ro:    { myProfile: "Vezi profilul meu", activities: "Activități", inventory: "Inventar", friends: "Prieteni", changeStatus: "Schimbă starea", back: "Înapoi", online: "Online", away: "Plecat", invisible: "Invizibil", offline: "Offline" },
  bg:    { myProfile: "Виж профила ми", activities: "Дейности", inventory: "Инвентар", friends: "Приятели", changeStatus: "Промяна на статус", back: "Назад", online: "На линия", away: "Отсъстващ", invisible: "Невидим", offline: "Извън линия" },
  el:    { myProfile: "Προβολή προφίλ", activities: "Δραστηριότητες", inventory: "Αποθήκη", friends: "Φίλοι", changeStatus: "Αλλαγή κατάστασης", back: "Πίσω", online: "Σε σύνδεση", away: "Λείπω", invisible: "Αόρατος", offline: "Εκτός σύνδεσης" },
}

;(() => {
  // определяем язык один раз при загрузке
  const rawLang = (
    document.documentElement.lang ||
    document.querySelector('meta[name="language"]')?.content ||
    navigator.language ||
    "en"
  ).toLowerCase()

  // сначала пробуем точное совпадение (zh-cn, zh-tw), потом базовый язык (zh, en, ru...)
  const lang = TRANSLATIONS[rawLang] ? rawLang : rawLang.split("-")[0]

  const t = (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key

  // нужно чтобы потом удалить оригинальную кнопку "View my profile" и её переводы
  const allProfileLabels = new Set(Object.values(TRANSLATIONS).map((l) => l.myProfile))

  const { mainContainer: containerSel, buttonClass: btnSel, driver: driverSel } = CONFIG.selectors

  let observer = null

  // вспомогательные функции

  function makeBtn(template, text, url) {
    const btn = template.cloneNode(true)
    btn.textContent = text
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      window.location.href = url
    })
    return btn
  }

  function makeStatusToggleBtn(template, separator) {
    const btn = template.cloneNode(true)
    btn.innerHTML = ""
    btn.id = "steam-status-change-btn"
    btn.style.cssText = "display:flex;align-items:center;justify-content:space-between"

    const span = document.createElement("span")
    span.textContent = t("changeStatus")
    span.style.flex = "1"

    const arrow = document.createElement("span")
    arrow.textContent = ">"
    arrow.style.cssText = "margin-left:auto;padding-left:8px"

    btn.append(span, arrow)
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      showStatusView(template, separator)
    })
    return btn
  }

  // подменю смены статуса

  function showStatusView(template, separator) {
    const container = document.querySelector(containerSel)
    if (!container || document.getElementById("steam-status-back-btn")) return

      // прячем текущие пункты меню — покажем их обратно при нажатии "Назад"
    const saved = Array.from(container.children)
    saved.forEach((el) => (el.style.display = "none"))

    // кнопка возврата назад
    const backBtn = template.cloneNode(true)
    backBtn.id = "steam-status-back-btn"
    backBtn.innerHTML = ""
    backBtn.style.cssText = "display:flex;align-items:center"

    const backArrow = document.createElement("span")
    backArrow.textContent = "<"
    backArrow.style.marginRight = "8px"

    const backText = document.createElement("span")
    backText.textContent = t("back")

    backBtn.append(backArrow, backText)
    backBtn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      hideStatusView(saved)
    })

    const backSep = separator.cloneNode(true)
    backSep.id = "steam-status-back-separator"

    const statusBtns = [
      { key: "online",    url: CONFIG.urls.online },
      { key: "away",      url: CONFIG.urls.away },
      { key: "invisible", url: CONFIG.urls.invisible },
      { key: "offline",   url: CONFIG.urls.offline },
    ].map(({ key, url }) => {
      const b = template.cloneNode(true)
      b.textContent = t(key)
      b.classList.add("steam-status-option")
      b.addEventListener("click", (e) => {
        e.preventDefault()
        window.location.href = url
      })
      return b
    })

    container.prepend(backSep)
    container.prepend(backBtn)
    statusBtns.forEach((b) => container.appendChild(b))
  }

  function hideStatusView(saved) {
    document.getElementById("steam-status-back-btn")?.remove()
    document.getElementById("steam-status-back-separator")?.remove()
    document.querySelectorAll(".steam-status-option").forEach((b) => b.remove())
    saved.forEach((el) => (el.style.display = ""))
  }

  function tryInit() {
    const container = document.querySelector(containerSel)
    const buttons   = document.querySelectorAll(btnSel)

    if (!container || !buttons.length) return false

    // нашли что нужно — наблюдатель больше не нужен
    observer?.disconnect()
    observer = null

    const template  = buttons[0]
    const separator = buttons[4] ?? buttons[0]

    // убираем оригинальную кнопку "View my profile" — мы добавим свою
    document.querySelectorAll(btnSel).forEach((btn) => {
      if (allProfileLabels.has(btn.textContent?.trim())) btn.remove()
    })

    // вставляем через prepend в обратном порядке — итоговый порядок сверху вниз будет правильным
    const toInsert = [
      separator.cloneNode(true),
      makeStatusToggleBtn(template, separator),
      separator.cloneNode(true),
      makeBtn(template, t("inventory"),   CONFIG.urls.inventory),
      makeBtn(template, t("activities"),  CONFIG.urls.activities),
      makeBtn(template, t("friends"),     CONFIG.urls.friends),
      makeBtn(template, t("myProfile"),   CONFIG.urls.profile),
    ]

    toInsert.forEach((el) => container.insertBefore(el, container.firstElementChild))

    // driver должен быть последним в списке
    const driver = document.querySelector(driverSel)
    if (driver?.parentNode) driver.parentNode.appendChild(driver)

    // если язык Steam изменился — пересоздаём кнопки с новыми переводами
    new MutationObserver(() => {
      document.querySelectorAll(btnSel).forEach((btn) => {
        if (allProfileLabels.has(btn.textContent?.trim())) btn.remove()
      })
      toInsert.forEach((el) => el.remove())
      tryInit()
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] })

    return true
  }

  function init() {
    if (tryInit()) return

    // меню ещё не появилось — ждём через MutationObserver, не через setTimeout
    observer = new MutationObserver(() => {
      if (tryInit()) observer?.disconnect()
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true })
  } else {
    init()
  }
})()
