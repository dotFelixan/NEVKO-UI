// Friends and chat windows min size | Friends: detected by .friendListHeaderContainer (works in overlay)
// With a chat on screen (its own window, or docked to the friends list) the window cannot get so narrow that the
// messages have less than CHAT_MIN: the channels and members of a group and the docked emoticon panel stay beside
// them (Emoticon Panel.js does not open the panel in a window too narrow for it)

;(() => {
  const MIN_WIDTH = 450
  const MIN_HEIGHT = 500
  const CHAT_MIN = 480 // = CHAT_MIN of Emoticon Panel.js
  const FRIENDS_HEADER = ".friendListHeaderContainer"
  const GIVE_UP_AFTER = 30000 // never became friends window = chat

  const root = document.documentElement
  const isChatWindow = root.classList.contains("MillenniumWindow_FriendChatWindow")

  let applied = ""
  function setMin(width, height) {
    const value = `${width}x${height}`
    if (value === applied) return
    applied = value
    try { SteamClient.Window.SetMinSize(width, height) } catch {}
  }

  function wantedWidth() {
    const history = [...document.querySelectorAll(".multiChatDialog .chatHistoryScroll")].find(el => el.offsetParent)
    if (!history) return MIN_WIDTH
    return Math.max(MIN_WIDTH, Math.ceil(innerWidth - history.clientWidth + CHAT_MIN))
  }

  // Layout changes (a chat opened, columns folded, the list dragged wider): once per frame at most.
  // A window in the background may get no frames: then a timer does it
  let queued = false
  function update() {
    if (queued) return
    queued = true
    const run = () => {
      if (!queued) return
      queued = false
      setMin(wantedWidth(), MIN_HEIGHT)
    }
    requestAnimationFrame(run)
    setTimeout(run, 200)
  }

  function watch() {
    update()
    new MutationObserver(update).observe(document.body, { childList: true, subtree: true })
    new ResizeObserver(update).observe(root)
  }

  // Chat window, normal friends window
  if (isChatWindow || root.classList.contains("MillenniumWindow_FriendsList") || document.querySelector(FRIENDS_HEADER)) return watch()

  // Overlay: wait for header
  const observer = new MutationObserver(() => {
    if (!document.querySelector(FRIENDS_HEADER)) return
    stop()
    watch()
  })
  const timer = setTimeout(() => stop(), GIVE_UP_AFTER)
  function stop() {
    observer.disconnect()
    clearTimeout(timer)
  }
  observer.observe(root, { childList: true, subtree: true })
})()
