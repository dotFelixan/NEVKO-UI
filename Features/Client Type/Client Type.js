// Option "Fake Device Status": friends see the Big Picture / phone mark next to your status
// The value comes from the option's CSS (--nk-client-type), this script tells it to Steam
//
// Steam's client reports its status with a message that has a field of "client type" flags and leaves the field
// empty. Here the flag of the chosen device is written into every such message. This is not what Steam's own client
// sends: the option is off unless it is switched on

;(() => {
  "use strict"

  const FLAGS = { bigpicture: 1024, mobile: 512 } // Steam's persona state flags: "tenfoot" client, mobile client
  const APPLIED_KEY = "nevko-client-type" // flags that were sent last: taken back when the option is switched off
  const RETRY_EVERY = 1000 // ms, the friends store appears after login
  const MAX_TRIES = 120

  const shared = window.opener
  if (!shared) return

  const chosenFlags = () => FLAGS[getComputedStyle(document.documentElement).getPropertyValue("--nk-client-type").trim()] || 0

  // Every status message of the client gets the flags that are wanted now. The function is made in Steam's own
  // context: it must live on when this window is closed
  function hookStatus(connection) {
    if (connection.__nkClientType) return
    connection.__nkClientType = true
    const send = connection.Send
    connection.Send = shared.Function("send", `return function (message, ...rest) {
      try {
        const body = message && message.Body && message.Body()
        if (body && typeof body.set_persona_state_flags === "function" && typeof body.set_persona_state === "function" && window.__nkClientFlags !== undefined) {
          body.set_persona_state_flags(window.__nkClientFlags)
        }
      } catch (error) { /* the message goes as Steam made it */ }
      return send.call(this, message, ...rest)
    }`)(send)
  }

  function apply() {
    const friends = shared.g_FriendsUIApp?.FriendStore
    const connection = friends?.m_CMInterface
    if (typeof connection?.Send !== "function" || typeof friends.SendPersonaStateToServer !== "function") return false
    if (!friends.self?.persona?.m_bStatusInitialized) return false // not logged in yet

    const wanted = chosenFlags()
    const applied = Number(localStorage.getItem(APPLIED_KEY)) || 0
    if (!wanted && !applied) return true // the option is off and nothing of ours is set: Steam is left alone
    hookStatus(connection)
    shared.__nkClientFlags = wanted // 0 is sent too: Steam keeps the old flags until it is told otherwise
    friends.SendPersonaStateToServer(false, "nevko-client-type")
    if (wanted) localStorage.setItem(APPLIED_KEY, String(wanted))
    else localStorage.removeItem(APPLIED_KEY)
    return true
  }

  let tries = 0
  function run() {
    try { if (apply()) return } catch { /* Steam changed its store: nothing is sent */ }
    if (++tries < MAX_TRIES) setTimeout(run, RETRY_EVERY)
  }

  // After the option's CSS is in
  document.readyState === "complete" ? setTimeout(run, RETRY_EVERY) : addEventListener("load", () => setTimeout(run, RETRY_EVERY), { once: true })
})()
