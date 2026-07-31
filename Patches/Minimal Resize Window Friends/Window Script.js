;(() => {
  "use strict"

  const MIN_WIDTH    = 400
  const MIN_HEIGHT   = 500
  const TARGET_CLASS = "MillenniumWindow_FriendsList"

  // применяем только к окну списка друзей
  if (!document.documentElement.classList.contains(TARGET_CLASS)) return

  SteamClient.Window.SetMinSize(MIN_WIDTH, MIN_HEIGHT)
})()
