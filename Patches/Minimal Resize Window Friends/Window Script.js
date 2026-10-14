// Friends window min size | Detected by .friendListHeaderContainer (works in overlay), chats skipped

;(() => {
  const MIN_WIDTH = 450
  const MIN_HEIGHT = 500
  const FRIENDS_HEADER = ".friendListHeaderContainer"
  const GIVE_UP_AFTER = 30000 // never became friends window = chat

  const root = document.documentElement
  if (root.classList.contains("MillenniumWindow_FriendChatWindow")) return

  function apply() {
    try { SteamClient.Window.SetMinSize(MIN_WIDTH, MIN_HEIGHT) } catch {}
  }

  // Normal friends window
  if (root.classList.contains("MillenniumWindow_FriendsList") || document.querySelector(FRIENDS_HEADER)) return apply()

  // Overlay: wait for header
  const observer = new MutationObserver(() => {
    if (!document.querySelector(FRIENDS_HEADER)) return
    stop()
    apply()
  })
  const timer = setTimeout(() => stop(), GIVE_UP_AFTER)
  function stop() {
    observer.disconnect()
    clearTimeout(timer)
  }
  observer.observe(root, { childList: true, subtree: true })
})()
