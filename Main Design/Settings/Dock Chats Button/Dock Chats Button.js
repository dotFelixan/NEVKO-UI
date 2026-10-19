// Millennium theme settings: the option "Dock chats to the friends list" is Steam's own setting, so instead of a
// switch it has a button. The button opens Steam Settings on Friends & Chat and the row of that setting flashes there.
// The two windows talk through localStorage (same origin), the Settings window may not be open yet
// Styles: Dock Chats Button.css

;(() => {
  "use strict"

  const CONDITION = "Dock chats to the friends list" // = name of the option in skin.json
  const BUTTON_CLASS = "nk-dock-open"
  const HIDDEN_ATTR = "data-nk-dock-hidden"
  const SPOTLIGHT_KEY = "nevko-settings-spotlight"
  const SPOTLIGHT_ATTR = "data-nk-spotlight"
  const SPOTLIGHT_MS = 2500 // = animation in Dock Chats Button.css
  const SPOTLIGHT_TTL = 15000 // a request older than this is stale

  const SETTINGS_WINDOW = "MillenniumWindow_Settings"
  const ROW = ".eKmEXJCm_lgme24Fp_HWt"
  const ROW_INDEX = 9 // on Friends & Chat, when the text is not found
  const ACTIVE_TAB = ".PagedSettingsDialog_PageListItem.Active"
  const FRIENDS_URL = "steam://settings/friends"

  const RU = (document.documentElement.lang || navigator.language || "").toLowerCase().startsWith("ru")
  const BUTTON_TEXT = RU ? "Открыть в настройках Steam" : "Open in Steam settings"


  // Millennium window: the button

  function placeButton(field) {
    // No description: the name says it all
    field.querySelector(".FieldDescription")?.setAttribute(HIDDEN_ATTR, "")
    if (field.querySelector(`.${BUTTON_CLASS}`)) return
    const toggle = field.querySelector(".Toggle, [role='checkbox']")
    if (!toggle) return
    toggle.setAttribute(HIDDEN_ATTR, "")
    // Looks as the dropdowns of the other options (Steam's classes)
    const button = document.createElement("button")
    button.type = "button"
    button.className = `DialogDropDown _DialogInputContainer ${BUTTON_CLASS}`
    const label = document.createElement("div")
    label.className = "DialogDropDown_CurrentDisplay"
    label.textContent = BUTTON_TEXT
    button.append(label)
    button.addEventListener("click", event => {
      event.preventDefault()
      event.stopPropagation()
      try { localStorage.setItem(SPOTLIGHT_KEY, JSON.stringify({ name: "dock", at: Date.now() })) } catch { /* no storage: no flash */ }
      // The main window has no SteamClient.URL: the shared window (opener) does
      const urls = [window, window.opener].map(win => { try { return win?.SteamClient?.URL } catch { return null } }).find(api => api?.ExecuteSteamURL)
      urls?.ExecuteSteamURL(FRIENDS_URL)
    })
    toggle.after(button)
  }

  // Options that are only a note for now (always on while being tested): no switch, the description says why
  const NOTE_ONLY = ["Save Deleted Messages"]

  function scanFields() {
    for (const field of document.querySelectorAll(`[data-condition="${CONDITION}"]`)) placeButton(field)
    for (const name of NOTE_ONLY) {
      for (const field of document.querySelectorAll(`[data-condition="${name}"]`)) {
        field.querySelector(".Toggle, [role='checkbox']")?.setAttribute(HIDDEN_ATTR, "")
      }
    }
  }


  // Steam Settings window: the flash

  function dockRow() {
    const rows = [...document.querySelectorAll(ROW)]
    let label = "Dock chats to the friends list"
    try { label = LocalizationManager.LocalizeString("#FriendSettings_DockChats") || label } catch { /* English */ }
    return rows.find(row => row.textContent.trim().startsWith(label)) || rows[ROW_INDEX] || null
  }

  function takeRequest() {
    try {
      const request = JSON.parse(localStorage.getItem(SPOTLIGHT_KEY) || "null")
      if (!request || Date.now() - request.at > SPOTLIGHT_TTL) return false
      return true
    } catch {
      return false
    }
  }

  let waiting = false
  async function spotlight() {
    if (waiting || !takeRequest()) return
    waiting = true
    try {
      // The page may still be opening
      let row = null
      for (let i = 0; i < 40 && !row; i++) {
        const tab = document.querySelector(ACTIVE_TAB)
        if (tab) row = dockRow()
        if (!row) await new Promise(resolve => setTimeout(resolve, 100))
      }
      if (!row) return
      try { localStorage.removeItem(SPOTLIGHT_KEY) } catch { /* left to expire */ }
      row.scrollIntoView({ block: "center" })
      row.removeAttribute(SPOTLIGHT_ATTR)
      void row.offsetWidth // restart the animation
      row.setAttribute(SPOTLIGHT_ATTR, "")
      setTimeout(() => row.removeAttribute(SPOTLIGHT_ATTR), SPOTLIGHT_MS)
    } finally {
      waiting = false
    }
  }


  function start() {
    if (document.documentElement.classList.contains(SETTINGS_WINDOW)) {
      addEventListener("storage", event => { if (event.key === SPOTLIGHT_KEY && event.newValue) spotlight() })
      addEventListener("focus", spotlight)
      spotlight()
      return
    }
    scanFields()
    new MutationObserver(scanFields).observe(document.body, { childList: true, subtree: true })
  }

  if (document.body) start()
  else addEventListener("DOMContentLoaded", start, { once: true })
})()
