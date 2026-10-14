// Forced Steam settings, written straight to Steam on launch (no Settings window)
// Their rows are hidden in the Settings window by Force Disable Settings.js. Both always run (skin.json, Patches)

;(() => {
  "use strict"

  // Friends & Chat
  const FRIENDS = {
    bCompactFriendsList: false,
    bCompactQuickAccess: false,
    bAlwaysNewChatWindow: false, // chats stay in the docked window
  }

  // Friends & Chat: chats open docked to the friends list, not in their own window (kept apart from the settings above)
  const DOCK_CHATS = true

  // Library, Accessibility
  const CLIENT = {
    library_display_icon_in_game_list: true,
    ready_to_play_includes_streaming:  false,
    accessibility_high_contrast_mode:  false,
    accessibility_reduce_motion:       false,
  }

  const RETRY_EVERY = 500 // ms, settings load after login
  const MAX_TRIES = 120

  const shared = window.opener
  if (!shared) return

  const loaded = object => !!object && Object.keys(object).length > 0

  function apply() {
    const store = shared.settingsStore
    const friends = store?.friendSettings
    if (!loaded(friends) || !loaded(store.clientSettings)) return false

    const changed = Object.entries(FRIENDS).filter(([name, value]) => name in friends && friends[name] !== value)
    if (changed.length) store.UpdateFriendSettings({ ...friends, ...Object.fromEntries(changed) })

    for (const [name, value] of Object.entries(CLIENT)) {
      const [current, set] = store.GetClientSetting(name)
      if (current !== undefined && current !== value) set(value)
    }

    // The same message the switch in the Settings window sends: Steam moves the open chats itself
    const docked = shared.g_FriendsUIApp?.SettingsStore?.BSingleWindowModeEnabled?.()
    if (docked !== undefined && docked !== DOCK_CHATS) {
      shared.SteamClient.Messaging.PostMessage("LibraryCommands", "ToggleDockedMode", JSON.stringify({ checked: DOCK_CHATS }))
    }
    return true
  }

  // __nk_drs_ready: set by Force Disable Settings.js in this window
  let tries = 0
  function run() {
    try { if (window.__nk_drs_ready && apply()) return } catch {}
    if (++tries < MAX_TRIES) setTimeout(run, RETRY_EVERY)
  }

  run()
})()
