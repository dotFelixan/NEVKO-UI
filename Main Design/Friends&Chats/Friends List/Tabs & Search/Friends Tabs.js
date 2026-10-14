// Friends / Chats buttons + search field | Styles: Friends Tabs.css
// Chats tab comes from the Recent Chats plugin; without it a placeholder button says where to get it

;(() => {
  "use strict"

  const TAB_BAR = ".socialTabContainer"
  const FRIENDS_LABEL = ".socialTabContainer > .friendTab:not(#recent-chats-tab-host, #nk-chats-tab) > .tabLabel"
  const PLUGIN_TAB = "recent-chats-tab-host"
  const PLUGIN_SEARCH = ".rcp-search"
  const PLUGIN_OPEN = "data-recent-chats-open" // on <html>
  const HEADER = ".friendlist > .friendListHeaderContainer"
  const RECENT_ROW = ".rcp-list .rcp-row-wrapper"
  const GROUP_ROW = ".FriendsListChatSection .ChatRoomListGroupItem"
  const FAKE_TAB = "nk-chats-tab"
  const TIP = "nk-chats-tip"

  const PLUGIN_WAIT = 1000 // ms, only when Millennium doesn't say if the plugin is loaded
  const STEAM_ID64_BASE = 76561197960265728n // + account id = SteamID64
  const TIP_TIME = 6000


  // Texts

  // Steam's own strings (any language)
  function localize(token, fallback) {
    for (const win of [window, window.opener]) {
      try {
        const text = win?.LocalizationManager?.LocalizeString(token)
        if (text && !text.startsWith("#")) return text
      } catch {}
    }
    return fallback
  }

  // No plugin (Steam has no string for this)
  const INSTALL_TEXTS = {
    en: "This tab becomes available after you install the “Recent Chats” plugin from steambrew.app",
    ru: "Вкладка станет доступна после установки плагина «Recent Chats» с steambrew.app",
    uk: "Вкладка стане доступною після встановлення плагіна «Recent Chats» із steambrew.app",
    bg: "Разделът ще е достъпен след инсталиране на приставката „Recent Chats“ от steambrew.app",
    de: "Dieser Tab wird verfügbar, sobald du das Plugin „Recent Chats“ von steambrew.app installierst",
    fr: "Cet onglet sera disponible après l’installation du plugin « Recent Chats » depuis steambrew.app",
    es: "Esta pestaña estará disponible tras instalar el plugin «Recent Chats» desde steambrew.app",
    "es-419": "Esta pestaña estará disponible después de instalar el plugin «Recent Chats» desde steambrew.app",
    pt: "Este separador fica disponível depois de instalar o plugin «Recent Chats» a partir de steambrew.app",
    "pt-br": "Esta aba fica disponível depois de instalar o plugin “Recent Chats” em steambrew.app",
    it: "Questa scheda sarà disponibile dopo aver installato il plugin «Recent Chats» da steambrew.app",
    nl: "Dit tabblad wordt beschikbaar nadat je de plug-in ‘Recent Chats’ via steambrew.app hebt geïnstalleerd",
    pl: "Ta karta będzie dostępna po zainstalowaniu wtyczki „Recent Chats” ze steambrew.app",
    cs: "Tato karta bude dostupná po instalaci pluginu „Recent Chats“ ze steambrew.app",
    hu: "Ez a lap a „Recent Chats” bővítmény telepítése után érhető el (steambrew.app)",
    ro: "Această filă devine disponibilă după instalarea pluginului „Recent Chats” de pe steambrew.app",
    el: "Η καρτέλα θα είναι διαθέσιμη μετά την εγκατάσταση του πρόσθετου «Recent Chats» από το steambrew.app",
    fi: "Välilehti on käytettävissä, kun asennat ”Recent Chats” -lisäosan osoitteesta steambrew.app",
    sv: "Fliken blir tillgänglig när du installerar insticksprogrammet ”Recent Chats” från steambrew.app",
    no: "Fanen blir tilgjengelig når du installerer programtillegget «Recent Chats» fra steambrew.app",
    da: "Fanen bliver tilgængelig, når du installerer pluginet “Recent Chats” fra steambrew.app",
    tr: "Bu sekme, steambrew.app üzerinden “Recent Chats” eklentisini yükledikten sonra kullanılabilir",
    ar: "ستتوفر هذه التبويبة بعد تثبيت إضافة «Recent Chats» من steambrew.app",
    th: "แท็บนี้จะใช้งานได้หลังติดตั้งปลั๊กอิน “Recent Chats” จาก steambrew.app",
    vi: "Thẻ này sẽ dùng được sau khi cài plugin “Recent Chats” từ steambrew.app",
    id: "Tab ini tersedia setelah memasang plugin “Recent Chats” dari steambrew.app",
    ko: "steambrew.app에서 “Recent Chats” 플러그인을 설치하면 이 탭을 사용할 수 있습니다",
    ja: "このタブは steambrew.app から「Recent Chats」プラグインをインストールすると利用できます",
    "zh-cn": "从 steambrew.app 安装“Recent Chats”插件后即可使用此标签页",
    "zh-tw": "從 steambrew.app 安裝「Recent Chats」外掛後即可使用此分頁",
  }

  function installText() {
    const lang = (document.documentElement.lang || navigator.language || "en").toLowerCase()
    return INSTALL_TEXTS[lang] ?? INSTALL_TEXTS[lang.split("-")[0]] ?? INSTALL_TEXTS.en
  }

  // List header counters: " · 3", nothing for 0
  const counter = count => count > 0 ? ` · ${count}` : ""

  // Group chats: from Steam's chat store (the list isn't in the DOM while folded)
  function groupCount() {
    for (const win of [window, window.opener]) {
      try {
        const size = win?.g_FriendsUIApp?.ChatStore?.m_mapChatGroups?.size
        if (typeof size === "number") return size
      } catch {}
    }
    return document.querySelectorAll(GROUP_ROW).length
  }

  // Chats avatars get Steam's avatar classes, so the theme's status indicator (Modern / Legacy) works on them
  // (the plugin draws a bare <img>, the status is only on its row)
  const STEAM_HOLDER = "nibodjvvrm86uCfnnAn4g"
  const STEAM_AVATAR = "_3h-QRJGxnVOIExtHD1R0f2"
  const STEAM_STATUS = "_3xUpb5DWXPFNcHHIcv-9pe"
  const STATUS_CLASSES = ["online", "offline", "ingame", "awayOrSnooze"]

  function decorateAvatars() {
    for (const holder of document.querySelectorAll(".rcp-row .rcp-avatar-holder")) {
      const row = holder.closest(".rcp-row")
      const wrapper = row.closest(".rcp-row-wrapper")
      if (wrapper) accountIdOf(wrapper) // before the DOM change below: the badges script reacts to it
      holder.classList.add(STEAM_HOLDER, "no-drag", "Medium")
      for (const status of STATUS_CLASSES) holder.classList.toggle(status, row.classList.contains(status))
      holder.querySelector("img")?.classList.add(STEAM_AVATAR)
      if (!holder.querySelector(`:scope > .${STEAM_STATUS}`)) {
        const mark = document.createElement("div")
        mark.className = `${STEAM_STATUS} avatarStatus`
        holder.prepend(mark)
      }
    }
  }

  // Chat Rows: account id, time

  // The plugin keeps the friend only in its React key ("friend:<accountId>"): put it on the row
  // (used here for the time and by Badges for Contributors.js)
  function accountIdOf(wrapper) {
    if (wrapper.dataset.nkAccountid) return wrapper.dataset.nkAccountid
    const fiberKey = Object.keys(wrapper).find(key => key.startsWith("__reactFiber"))
    const id = String(wrapper[fiberKey]?.key ?? "").match(/^friend:(\d+)$/)?.[1]
    if (id) wrapper.dataset.nkAccountid = id
    return id ?? null
  }

  // Last message time (unix seconds) from Steam's chat store
  function lastMessageTime(accountId) {
    for (const win of [window, window.opener]) {
      try {
        const chats = win?.g_FriendsUIApp?.ChatStore?.FriendChatStore
        const time = chats?.GetFriendChat(Number(accountId))?.time_last_message
        if (time > 0) return time
      } catch {}
    }
    return null
  }

  const LOCALE = (document.documentElement.lang || navigator.language || "en").toLowerCase()
  const sameDay = (a, b) => a.toDateString() === b.toDateString()

  // "17h" in the Steam language: 17 ч, 17 Std., 17時間
  const UNITS = [
    ["minute", 60], ["hour", 3600], ["day", 86400], ["week", 604800], ["month", 2592000], ["year", 31536000],
  ]
  const PLUGIN_UNITS = { s: "minute", m: "minute", h: "hour", d: "day", w: "week", mo: "month", y: "year" }

  function shortUnit(count, unit) {
    try {
      return new Intl.NumberFormat(LOCALE, { style: "unit", unit, unitDisplay: "narrow" }).format(count)
    } catch {
      return null
    }
  }

  function relativeTime(seconds) {
    let [unit, size] = UNITS[0]
    for (const [name, length] of UNITS) if (seconds >= length) [unit, size] = [name, length]
    return shortUnit(Math.max(1, Math.floor(seconds / size)), unit)
  }

  // No time from Steam: translate the plugin's own "17h"
  function translatePluginTime(text) {
    const [, count, unit] = text.trim().match(/^(\d+)\s*(mo|[smhdwy])$/i) || []
    const name = PLUGIN_UNITS[unit?.toLowerCase()]
    return name ? shortUnit(unit.toLowerCase() === "s" ? 1 : Number(count), name) : null
  }

  // Exact Time option of the theme (LastSeen.js): 14:00 / Yesterday / 12 Oct, same 12/24h as there
  function exactTime(date, formatTime) {
    const now = new Date()
    if (sameDay(date, now)) return formatTime(date)
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (sameDay(date, yesterday)) {
      const word = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" }).format(-1, "day")
      return word.charAt(0).toUpperCase() + word.slice(1)
    }
    const options = date.getFullYear() === now.getFullYear()
      ? { day: "numeric", month: "short" }
      : { day: "2-digit", month: "2-digit", year: "2-digit" }
    return new Intl.DateTimeFormat(LOCALE, options).format(date)
  }

  function timeText(wrapper, pluginText) {
    const seconds = lastMessageTime(accountIdOf(wrapper))
    const exact = window.__nevkoExactTime
    try {
      if (seconds && exact?.formatTime) return exactTime(new Date(seconds * 1000), exact.formatTime)
      if (seconds) return relativeTime(Math.max(0, Date.now() / 1000 - seconds))
    } catch {}
    return translatePluginTime(pluginText)
  }

  // Shown by CSS from the attribute, the plugin's text node stays untouched (React owns it)
  function updateTimes() {
    for (const wrapper of document.querySelectorAll(RECENT_ROW)) {
      const time = wrapper.querySelector(".rcp-time")
      if (!time) continue
      const text = timeText(wrapper, time.textContent)
      if (!text) time.removeAttribute("data-nk-time")
      else if (time.dataset.nkTime !== text) time.dataset.nkTime = text
    }
  }

  // Group Chats: fold / unfold animation | transform + opacity only (works on Linux)
  // Fold: groups fade and move up, then Steam hides them and the chat list slides into their place
  // Unfold: Steam shows them at once, the chat list slides down, groups fade in

  const GROUPS = ".FriendsListChatSection"
  const GROUP_TOGGLE = ".FriendsListChatSection .ToggleGroupChatList"
  const CHAT_LIST = ".rcp-panel > .rcp-list"
  const FOLD_OUT_MS = 140
  const FOLD_MOVE_MS = 220
  const FOLD_EASING = "cubic-bezier(.2, .8, .3, 1)"
  const HIDDEN_ROW = { opacity: 0, transform: "translateY(-8px)" }
  const SHOWN_ROW = { opacity: 1, transform: "none" }

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)")
  let folding = false
  let ownClick = false // our click that lets Steam fold after the animation

  const groupRows = section => [...section.querySelectorAll(".ChatRoomListGroupItem")]
  const groupsHeight = section => section.querySelector(".chatRoomListContainer")?.offsetHeight || 0

  function slideChatList(fromY) {
    if (!fromY) return
    document.querySelector(CHAT_LIST)?.animate(
      [{ transform: `translateY(${fromY}px)` }, { transform: "none" }],
      { duration: FOLD_MOVE_MS, easing: FOLD_EASING },
    )
  }

  async function fold(section, toggle) {
    folding = true
    const height = groupsHeight(section)
    const rows = groupRows(section)
    // Timer, not animation.finished: animations don't run (and never finish) while the window is hidden
    for (const row of rows) row.animate([SHOWN_ROW, HIDDEN_ROW], { duration: FOLD_OUT_MS, easing: "ease-in", fill: "forwards" })
    await new Promise(resolve => setTimeout(resolve, FOLD_OUT_MS))

    ownClick = true
    toggle.click() // Steam folds the section
    ownClick = false
    for (const row of rows) row.getAnimations().forEach(animation => animation.cancel())
    slideChatList(height)
    folding = false
  }

  function unfold(section) {
    slideChatList(-groupsHeight(section))
    for (const row of groupRows(section)) {
      row.animate([HIDDEN_ROW, SHOWN_ROW], { duration: FOLD_MOVE_MS, easing: FOLD_EASING })
    }
  }

  function onGroupToggle(event) {
    const toggle = event.target instanceof Element && event.target.closest(GROUP_TOGGLE)
    if (!toggle || ownClick) return
    if (reduceMotion.matches || !document.documentElement.hasAttribute(PLUGIN_OPEN)) return

    const section = toggle.closest(GROUPS)
    if (folding) {
      event.preventDefault()
      event.stopPropagation()
    } else if (section.classList.contains("Collapsed")) {
      // Steam unfolds on this click: animate once the groups are in the page
      requestAnimationFrame(() => requestAnimationFrame(() => unfold(section)))
    } else {
      event.preventDefault()
      event.stopPropagation()
      fold(section, toggle)
    }
  }

  // Header height for the sticky search in the Chats tab (CSS)
  let headerObserver = null
  let observedHeader = null

  function watchHeader() {
    const header = document.querySelector(HEADER)
    if (!header || header === observedHeader) return
    observedHeader = header
    headerObserver?.disconnect()
    // A variable written on <html> makes the browser restyle every element of the window: written only when the
    // value has changed, and the width (it changes on every step while the list is being dragged wider) only
    // after the dragging has stopped
    const root = document.documentElement
    const write = (name, value) => { if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value) }
    let widthTimer = null
    headerObserver = new ResizeObserver(() => {
      write("--nk-friends-header-height", header.offsetHeight + "px")
      // List width for the "Disconnected" plaque (Friends Code.css)
      clearTimeout(widthTimer)
      widthTimer = setTimeout(() => write("--nk-friends-list-width", header.offsetWidth + "px"), 200)
    })
    headerObserver.observe(header)
  }

  function unreadTotal() {
    for (const win of [window, window.opener]) {
      try {
        const count = win?.g_FriendsUIApp?.ChatStore?.FriendChatStore?.GetUnreadFriendMessageCount()
        if (typeof count === "number") return count
      } catch {}
    }
    return 0
  }

  function applyTexts() {
    const chats = localize("#Label_Chats", "Chats")
    const search = localize("#Contacts_Search_Title", "Search")

    // Search placeholder, "Recent Chats" list header (CSS ::before)
    const root = document.documentElement
    const cssTexts = {
      "--nk-search-text": search,
      "--nk-recent-chats-text": localize("#FriendGroup_RecentChats", "Recent Chats"),
      "--nk-group-count": counter(groupCount()),
      "--nk-recent-count": counter(document.querySelectorAll(RECENT_ROW).length),
    }
    for (const [name, text] of Object.entries(cssTexts)) {
      const value = JSON.stringify(text)
      if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value)
    }

    const label = document.querySelector(`#${PLUGIN_TAB} .tabLabel, #${FAKE_TAB} .tabLabel`)
    if (label && label.textContent !== chats) label.textContent = chats

    const input = document.querySelector(PLUGIN_SEARCH)
    if (input && input.placeholder !== search) input.placeholder = search

    // Unread messages in total, on the Chats button
    const tab = document.getElementById(PLUGIN_TAB)
    if (tab) {
      const unread = unreadTotal()
      const value = unread > 99 ? "99+" : String(unread)
      if (unread <= 0) tab.removeAttribute("data-nk-unread")
      else if (tab.dataset.nkUnread !== value) tab.dataset.nkUnread = value
    }
  }


  // Placeholder Chats Button (no plugin)

  let barSeenAt = 0

  // Millennium lists loaded plugins in SharedJSContext: true / false, null = unknown
  function pluginLoaded() {
    try {
      const list = window.opener?.PLUGIN_LIST
      if (!list) return null
      return Object.keys(list).some(name => /recent[-_ ]?chats/i.test(name))
    } catch {
      return null
    }
  }

  function createFakeTab() {
    const tab = document.createElement("div")
    tab.id = FAKE_TAB
    tab.className = "friendTab socialListTab"
    const label = document.createElement("span")
    label.className = "tabLabel"
    tab.append(label)
    return tab
  }

  function ensureFakeTab() {
    const bar = document.querySelector(TAB_BAR)
    const fake = document.getElementById(FAKE_TAB)
    if (!bar || document.getElementById(PLUGIN_TAB)) {
      fake?.remove()
      hideTip()
      return
    }
    if (fake) return
    const loaded = pluginLoaded()
    if (loaded) return // its tab is on the way
    if (loaded === null) {
      // Unknown: give the plugin a moment
      if (!barSeenAt) {
        barSeenAt = performance.now()
        setTimeout(update, PLUGIN_WAIT + 100)
      }
      if (performance.now() - barSeenAt < PLUGIN_WAIT) return
    }
    const tab = createFakeTab()
    tab.firstChild.textContent = localize("#Label_Chats", "Chats") // text at once, no empty button
    bar.append(tab)
  }

  let tipTimer = null

  function hideTip() {
    clearTimeout(tipTimer)
    document.getElementById(TIP)?.classList.remove("nk-shown")
  }

  function showTip(tab) {
    let tip = document.getElementById(TIP)
    if (!tip) {
      tip = document.createElement("div")
      tip.id = TIP
      document.body.append(tip)
    }
    tip.textContent = installText()

    // Under the button, inside the window
    const rect = tab.getBoundingClientRect()
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - tip.offsetWidth / 2, innerWidth - tip.offsetWidth - 8))
    tip.style.left = Math.round(left) + "px"
    tip.style.top = Math.round(rect.bottom + 8) + "px"
    tip.classList.add("nk-shown")

    clearTimeout(tipTimer)
    tipTimer = setTimeout(hideTip, TIP_TIME)
  }


  // Clicks

  let closingChats = false // our own click on the Chats tab (it closes Chats): the plugin must get it

  function onClick(event) {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return

    // Chats tab pressed while Chats is open: the plugin would close it (the tab is a switch there) and the
    // Friends tab would come. A tab that is open stays open
    if (!closingChats && target.closest(`#${PLUGIN_TAB}`) && document.documentElement.hasAttribute(PLUGIN_OPEN)) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    const fake = target.closest(`#${FAKE_TAB}`)
    if (fake) {
      event.preventDefault()
      event.stopPropagation()
      const shown = document.getElementById(TIP)?.classList.contains("nk-shown")
      shown ? hideTip() : showTip(fake)
      return
    }
    hideTip()

    // Chat row avatar: profile of that friend (the row itself opens the chat)
    const avatar = target.closest(".rcp-row .rcp-avatar-holder")
    const accountId = avatar?.closest(".rcp-row-wrapper")?.dataset.nkAccountid
    if (accountId) {
      event.preventDefault()
      event.stopPropagation()
      location.href = `steam://url/SteamIDPage/${STEAM_ID64_BASE + BigInt(accountId)}`
      return
    }

    // Friends label: Steam opens the search on it (label + search are one Steam button) -> block
    // The plugin closes Chats on a click in the header, it won't see this one: close Chats here
    if (target.closest(FRIENDS_LABEL)) {
      event.stopPropagation()
      if (document.documentElement.hasAttribute(PLUGIN_OPEN)) {
        closingChats = true
        try { document.getElementById(PLUGIN_TAB)?.click() } finally { closingChats = false }
      }
    }
  }


  // Start

  // Option "Default Friends Tab" (its value comes in a variable from the option's CSS): once, when the window
  // starts, the chosen tab is opened - whatever the plugin had open the last time. Chats is the plugin's tab:
  // it may come a little later than the window, so it is waited for; without the plugin Friends is all there is
  const DEFAULT_TAB_WAIT = 15000 // ms from the start of the window
  let defaultTabDone = false

  function applyDefaultTab() {
    if (defaultTabDone) return
    const tab = document.getElementById(PLUGIN_TAB)
    if (!tab) {
      if (performance.now() > DEFAULT_TAB_WAIT) defaultTabDone = true
      return
    }
    defaultTabDone = true
    const root = document.documentElement
    const chats = getComputedStyle(root).getPropertyValue("--nk-default-tab").trim().replace(/["']/g, "") === "chats"
    if (chats === root.hasAttribute(PLUGIN_OPEN)) return
    closingChats = true // the click passes our own guard of the open Chats tab
    try { tab.click() } finally { closingChats = false }
  }

  function update() {
    ensureFakeTab()
    applyDefaultTab()
    applyTexts()
    decorateAvatars()
    updateTimes()
    watchHeader()
  }

  function init() {
    document.addEventListener("click", onClick, true) // before React
    document.addEventListener("click", onGroupToggle, true)

    let frame = null
    new MutationObserver(() => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = null
        update()
      })
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["lang"] })

    update()
    setInterval(updateTimes, 30000) // minutes tick without DOM changes
    setInterval(applyTexts, 3000)   // unread total changes without DOM changes

    // Chats tab scrolled -> fade under the search (CSS)
    document.addEventListener("scroll", event => {
      const list = event.target
      if (!(list instanceof Element) || !list.matches(".friendlist")) return
      document.documentElement.classList.toggle("nk-chats-scrolled", list.scrollTop > 0)
    }, true)
    addEventListener("resize", hideTip)
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
