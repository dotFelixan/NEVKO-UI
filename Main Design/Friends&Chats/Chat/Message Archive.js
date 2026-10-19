// Deleted and expired messages, as in AyuGram (styles: Message Archive.css)
// Every message the client gets is kept in a local archive (IndexedDB of the Steam windows, only on this computer).
// Deleted by somebody else: Steam drops a deleted message from the chat; here it stays, a little faded, with a bin at
// its time; own deletions too. Deleted while Steam was closed: its text comes back from the archive.
// Expired: a message of a one-on-one chat the servers of Steam no longer give (the history read to its start): put
// back at the top of the chat from the archive, with a clock at its time. Only you see either of them
//
// The chats live in Steam's shared window, not in this one: the part that changes them (the engine) is made there,
// from its source, and lives as long as Steam - not as long as this window. This window only marks the bubbles

;(() => {
  "use strict"

  // Engine: runs in the shared window (created there with that window's Function, so nothing of it belongs here)
  function engine(win, version, themeName) {
    "use strict"
    const app = win.g_FriendsUIApp
    const store = app.ChatStore
    const DB_NAME = "nevko-messages"
    const STORE = "messages"
    const SCAN_MS = 3000
    const records = new Map() // key -> { key, chat, ts, ord, author, text, deleted } | "folder|<chat>" -> { key, folder }
    const deleted = new Set()
    const expired = new Set()
    const putBack = new Set() // chats whose expired messages are back
    const dirty = new Set() // chats whose log file is to be written again
    const chatObjects = new Map() // chat id -> the chat (the last one seen)
    let db = null

    const chatId = chat => chat.m_unAccountIDFriend ? `f${chat.m_unAccountIDFriend}` : `g${chat.m_ulGroupID}:${chat.m_ulChatID}`
    const keyOf = (chat, msg) => `${chatId(chat)}|${msg.rtTimestamp}|${msg.unOrdinal || 0}`
    // Steam's server sends a deleted message again with "<deleted>" for its text: that is no text
    // A message just sent holds the command ("/quote Name\ntext") until the server's copy comes: kept as the server
    // writes it, or a deleted reply came back as the bare command
    const asServer = text => /^\/quote /.test(text) ? `[quote]${text.slice(7)}[/quote]` : text
    const textOf = msg => typeof msg?.strMessageInternal === "string" && msg.strMessageInternal !== "<deleted>" ? asServer(msg.strMessageInternal) : ""
    const isUserMessage = msg => !!msg?.unAccountID && !msg.eServerMsgType && !!textOf(msg)

    function save(record) {
      records.set(record.key, record)
      if (record.chat) dirty.add(record.chat)
      try { db?.transaction(STORE, "readwrite").objectStore(STORE).put(record) } catch { /* no storage */ }
    }


    // Chat Logs: every chat in a folder of its own in Cache/Chat Logs, its messages as text in a file named as it.
    // Written again when the chat has changed (not more often than LOG_MS); written through Steam, as the backgrounds
    const LOGS = "Cache/Chat Logs"
    const LOG_MS = 10000
    let disk = null
    async function diskAccess() {
      if (disk) return disk
      const config = await win.Millennium.callServerMethod("core", "Core_GetStartConfig")
      const themes = String((typeof config === "string" ? JSON.parse(config) : config).themesPath || "").split("\\").join("/")
      let load = null
      win.webpackChunksteamui.push([[Symbol("nevko")], {}, require => { load = require }])
      const id = Object.keys(load.m).find(key => String(load.m[key]).includes("SystemManager.WriteFile#1"))
      const service = id && Object.values(load(id)).find(value => typeof value?.WriteFile === "function")
      if (!themes || !service) throw new Error("no file writing")
      disk = async (path, text) => {
        const result = await service.WriteFile({ path: `${themes}/${themeName}/${path}`, data: new win.TextEncoder().encode(text) })
        if (!result.BSuccess()) throw new Error(`"${path}" is not written`)
      }
      return disk
    }

    const safeName = text => String(text || "").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/\s+/g, " ").trim().slice(0, 60).replace(/[. ]+$/, "")
    function chatName(chat) {
      try {
        if (chat.m_unAccountIDFriend) return app.FriendStore.GetPlayer(chat.m_unAccountIDFriend)?.display_name || ""
        const group = store.GetChatRoomGroup?.(chat.m_ulGroupID)
        return [group?.name, chat.name].filter(Boolean).join(" - ")
      } catch {
        return ""
      }
    }
    // A folder keeps the name it got first: a friend who renames stays in the same folder
    function folderOf(id) {
      const known = records.get(`folder|${id}`)?.folder
      if (known) return known
      const name = safeName(chatName(chatObjects.get(id)))
      const folder = name ? `${name} (${id})` : id
      save({ key: `folder|${id}`, folder })
      return folder
    }

    const pad = number => String(number).padStart(2, "0")
    const dayOf = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    const timeOf = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`
    // Steam's text (BBCode) as plain text
    function plain(text) {
      return text.replace(/[\u2063\u200B\u200C\u200D\u2060]/g, "")
        .replace(/\[quote(?:=[^\]]*)?\]([\s\S]*?)\[\/quote\]/g, (_, inner) => {
          const [who, ...rest] = inner.trim().split("\n")
          return `» ${who}: ${rest.join(" ")}\n`
        })
        .replace(/\[img src=([^\s\]]+)[^\]]*\](?:[\s\S]*?\[\/img\])?/g, "[image] $1")
        .replace(/\[video[^\]]*?src=([^\s\]]+)[^\]]*\](?:[\s\S]*?\[\/video\])?/g, "[video] $1")
        .replace(/\[sticker type="?([^"\s\]]+)"?[^\]]*\](?:[\s\S]*?\[\/sticker\])?/g, "[sticker $1]")
        .replace(/\[emoticon\]([^[]*)\[\/emoticon\]/g, ":$1:")
        .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/g, "$2 ($1)")
        .replace(/\[\/?[a-z]+[^\]]*\]/g, "")
        .trim()
    }

    function logText(id) {
      const title = chatName(chatObjects.get(id)) || id
      let deletedWord = "Message Deleted"
      try { deletedWord = win.LocalizationManager?.LocalizeString("#Chat_MessageDeleted") || deletedWord } catch { /* English */ }
      const lines = [title, "=".repeat(Math.max(10, Math.min(60, title.length)))]
      let day = ""
      const list = [...records.values()].filter(record => record.chat === id && record.text).sort((a, b) => a.ts - b.ts || a.ord - b.ord)
      for (const record of list) {
        const date = new Date(record.ts * 1000)
        if (dayOf(date) !== day) {
          day = dayOf(date)
          lines.push("", `--- ${day} ---`)
        }
        let name = ""
        try { name = app.FriendStore.GetPlayer(record.author)?.display_name || "" } catch { /* not known */ }
        const body = plain(record.text).split("\n").join("\n        ")
        if (!body) continue
        lines.push(`${timeOf(date)}  ${name || record.author}: ${body}${record.deleted ? `  [${deletedWord}]` : ""}`)
      }
      return `${lines.join("\r\n")}\r\n`
    }

    // Only chats seen in this session: the name of a chat not seen yet is not known
    let flushing = false
    async function flushLogs() {
      if (flushing || stopped || !themeName || !dirty.size) return
      flushing = true
      try {
        const write = await diskAccess()
        for (const id of [...dirty]) {
          if (!chatObjects.has(id)) continue
          dirty.delete(id)
          const folder = folderOf(id)
          try { await write(`${LOGS}/${folder}/${folder}.txt`, logText(id)) } catch { dirty.add(id) }
        }
      } catch { /* no file writing: the archive itself stays */ } finally {
        flushing = false
      }
    }

    function allChats() {
      const chats = [...(store.FriendChatStore?.m_rgFriendChats || [])]
      for (const group of store.m_mapChatGroups?.values?.() || []) {
        try { chats.push(...(group.chatRoomList || [])) } catch { /* group is leaving */ }
      }
      return chats
    }

    function keep(chat, msg) {
      if (!isUserMessage(msg) || msg.eDeleteState) return
      const key = keyOf(chat, msg)
      const old = records.get(key)
      if (old?.text === textOf(msg)) return
      save({ key, chat: chatId(chat), ts: msg.rtTimestamp, ord: msg.unOrdinal || 0, author: msg.unAccountID, text: textOf(msg), deleted: !!old?.deleted })
    }

    function markDeleted(chat, msg, text) {
      const key = keyOf(chat, msg)
      deleted.add(key)
      const old = records.get(key)
      save({ key, chat: chatId(chat), ts: msg.rtTimestamp, ord: msg.unOrdinal || 0, author: msg.unAccountID, ...old, text: text || old?.text || "", deleted: true })
    }

    // Steam says it is deleted: back as it was, if its text is known
    function restore(chat, msg) {
      if (!msg?.eDeleteState || !msg.unAccountID || msg.eServerMsgType) return
      const text = textOf(msg) || asServer(records.get(keyOf(chat, msg))?.text || "")
      if (!text) return
      markDeleted(chat, msg, text)
      msg.strMessageInternal = text
      msg.eDeleteState = 0
    }

    // One-on-one chat read to its start: the kept messages older than all it has are put back before them.
    // Only when its history came from the server and there is no more of it - not a chat not read yet
    function putBackExpired(chat) {
      if (!chat.m_unAccountIDFriend || !chat.m_bChatLogsLoaded || chat.m_bMoreAvailable || !chat.m_rgChatMessages?.length) return
      const id = chatId(chat)
      if (putBack.has(id)) return
      putBack.add(id)
      const present = new Set(chat.m_rgChatMessages.map(msg => keyOf(chat, msg)))
      const oldest = chat.m_rgChatMessages.find(msg => msg.unOrdinal != -1)?.rtTimestamp ?? Infinity
      const gone = [...records.values()]
        .filter(record => record.chat === id && !present.has(record.key) && record.ts < oldest && record.text)
        .sort((a, b) => a.ts - b.ts || a.ord - b.ord)
      if (!gone.length) return
      const Message = chat.m_rgChatMessages[0].constructor
      const messages = gone.map(record => {
        ;(record.deleted ? deleted : expired).add(record.key)
        return new Message(record.author, record.ts, record.ord, asServer(record.text), [])
      })
      chat.AddMessagesToHistory(messages, false)
    }

    // Steam's methods, on the class every chat of a kind shares (both on the same class: a mark per method).
    // Each one is remembered: a newer engine (a new version of the theme while Steam runs) puts them back
    let stopped = false
    let timer = null
    let logTimer = null
    const wrapped = [] // { owner, name, original, wrapper }
    const patched = new Set()
    const patchedHistory = new Set()
    function ownerOf(obj, name) {
      for (let proto = obj; proto; proto = Object.getPrototypeOf(proto)) if (Object.prototype.hasOwnProperty.call(proto, name)) return proto
      return null
    }
    function wrap(owner, name, wrapper) {
      wrapped.push({ owner, name, original: owner[name], wrapper })
      owner[name] = wrapper
    }
    function stop() {
      stopped = true
      win.clearInterval(timer)
      win.clearInterval(logTimer)
      for (const { owner, name, original, wrapper } of wrapped) if (owner[name] === wrapper) owner[name] = original
    }
    function patch(chat) {
      const deletes = ownerOf(chat, "UpdateChatMessageDeletedState")
      if (deletes && !patched.has(deletes)) {
        patched.add(deletes)
        const original = deletes.UpdateChatMessageDeletedState
        wrap(deletes, "UpdateChatMessageDeletedState", function (list, state) {
          if (!stopped && state && Array.isArray(list)) {
            list = list.filter(item => {
              const msg = (this.m_rgChatMessages || []).find(m => m.rtTimestamp == item.rtTimestamp && m.unOrdinal == item.unOrdinal)
              if (!isUserMessage(msg)) return true
              markDeleted(this, msg, textOf(msg))
              return false
            })
            if (!list.length) return
          }
          return original.call(this, list, state)
        })
      }
      const history = ownerOf(chat, "AddMessagesToHistory")
      if (history && !patchedHistory.has(history)) {
        patchedHistory.add(history)
        const original = history.AddMessagesToHistory
        wrap(history, "AddMessagesToHistory", function (messages, more) {
          if (stopped) return original.call(this, messages, more)
          for (const msg of messages || []) restore(this, msg)
          const result = original.call(this, messages, more)
          try { putBackExpired(this) } catch { /* Steam changed it */ }
          return result
        })
      }
    }

    function scan() {
      if (stopped) return
      for (const chat of allChats()) {
        try {
          patch(chat)
          chatObjects.set(chatId(chat), chat)
          for (const msg of chat.m_rgChatMessages || []) msg.eDeleteState ? restore(chat, msg) : keep(chat, msg)
          putBackExpired(chat)
        } catch { /* chat is closing */ }
      }
    }

    new Promise((resolve, reject) => {
      const request = win.indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "key" })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    }).then(opened => new Promise(resolve => {
      db = opened
      const all = db.transaction(STORE, "readonly").objectStore(STORE).getAll()
      all.onsuccess = () => {
        for (const record of all.result || []) {
          records.set(record.key, record)
          if (record.deleted) deleted.add(record.key)
          if (record.chat) dirty.add(record.chat) // every chat of the archive gets its log once
        }
        resolve()
      }
      all.onerror = () => resolve()
    })).catch(() => { /* no storage: only this session */ }).finally(() => {
      scan()
      timer = win.setInterval(scan, SCAN_MS)
      logTimer = win.setInterval(flushLogs, LOG_MS)
    })

    // The deleted messages of a chat, oldest first, as plain copies (for the list of the chat menu, Chat.js)
    function listDeleted(chat) {
      const id = chatId(chat)
      return [...records.values()]
        .filter(record => record.chat === id && record.deleted && record.text)
        .sort((a, b) => a.ts - b.ts || a.ord - b.ord)
        .map(record => ({ ts: record.ts, ord: record.ord, author: record.author, text: asServer(record.text) }))
    }

    return { version, deleted, expired, keyOf, listDeleted, stop }
  }

  // Raised with every change of the engine: the one already running in Steam is replaced
  const ENGINE_VERSION = 6
  // Folder of the theme: this script is loaded from it (the logs are written into its Cache)
  const THEME_SCRIPT = document.currentScript?.src || [...document.scripts].map(script => script.src).find(src => /Message%20Archive\.js/.test(src)) || ""
  const THEME_NAME = decodeURIComponent(THEME_SCRIPT.match(/\/themes\/([^/]+)\//)?.[1] || "")


  // This Window: the bubbles of the kept messages are marked (look: Message Archive.css)

  const host = [window.opener, window].find(win => { try { return !!win?.g_FriendsUIApp } catch { return false } })
  if (!host) return
  let archive = null
  try {
    archive = host.__nkMessageArchive
    if (archive?.version !== ENGINE_VERSION) {
      // An older one: stopped (its methods back to Steam's); one without stop() (the first) is wrapped over, and
      // its own rules never see the messages this one has taken
      try { archive?.stop?.() } catch { /* its window is gone */ }
      archive = host.__nkMessageArchive = new host.Function("win", "version", "themeName", `return (${engine.toString()})(win, version, themeName)`)(host, ENGINE_VERSION, THEME_NAME)
    }
  } catch {
    return // no access to the shared window
  }

  const KEPT_ATTR = "data-nk-kept"

  // Steam's own word for a deleted message; ours for an expired one
  function steamText(token, fallback) {
    for (const win of [window, window.opener]) {
      try {
        const text = win?.LocalizationManager?.LocalizeString(`#${token}`)
        if (text) return text
      } catch { /* no access */ }
    }
    return fallback
  }
  const EXPIRED = {
    en: "Expired on Steam's servers, only you can see it",
    ru: "Истекло на серверах Steam, видно только вам",
    uk: "Минуло на серверах Steam, бачите лише ви",
    bg: "Изтекло на сървърите на Steam, виждате го само вие",
    de: "Auf den Steam-Servern abgelaufen, nur du siehst es",
    fr: "Expiré sur les serveurs de Steam, vous seul le voyez",
    es: "Caducado en los servidores de Steam, solo tú lo ves",
    pt: "Expirou nos servidores do Steam, só tu o vês",
    "pt-br": "Expirou nos servidores do Steam, só você vê",
    it: "Scaduto sui server di Steam, lo vedi solo tu",
    nl: "Verlopen op de servers van Steam, alleen jij ziet het",
    pl: "Wygasło na serwerach Steam, widzisz to tylko ty",
    cs: "Vypršelo na serverech Steamu, vidíte jen vy",
    hu: "Lejárt a Steam szerverein, csak te látod",
    ro: "Expirat pe serverele Steam, doar tu îl vezi",
    el: "Έληξε στους διακομιστές του Steam, το βλέπετε μόνο εσείς",
    da: "Udløbet på Steams servere, kun du kan se det",
    sv: "Utgånget på Steams servrar, bara du ser det",
    no: "Utløpt på Steams servere, bare du ser det",
    fi: "Vanhentunut Steamin palvelimilla, vain sinä näet sen",
    tr: "Steam sunucularında süresi doldu, yalnızca sen görüyorsun",
    ar: "انتهت صلاحيتها على خوادم Steam، تراها أنت فقط",
    ja: "Steam のサーバーで期限切れ、あなただけに表示",
    ko: "Steam 서버에서 만료됨, 나만 볼 수 있음",
    "zh-cn": "已在 Steam 服务器上过期，仅你可见",
    "zh-tw": "已在 Steam 伺服器上過期，僅你可見",
    th: "หมดอายุบนเซิร์ฟเวอร์ Steam แล้ว เห็นได้เฉพาะคุณ",
    vi: "Đã hết hạn trên máy chủ Steam, chỉ bạn thấy",
    id: "Kedaluwarsa di server Steam, hanya kamu yang melihatnya",
  }
  function expiredText() {
    const lang = (document.documentElement.lang || "en").toLowerCase()
    const zh = lang.startsWith("zh") && (/tw|hk|hant/.test(lang) ? "zh-tw" : "zh-cn")
    return EXPIRED[lang] || EXPIRED[zh] || EXPIRED[lang.split("-")[0]] || EXPIRED[{ nb: "no", nn: "no" }[lang]] || EXPIRED.en
  }

  // Message component above the bubble keeps the message and the view of its chat
  function messageOf(el) {
    const key = Object.keys(el).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && el[key], depth = 0; fiber && depth < 8; fiber = fiber.return, depth++) {
      const props = fiber.memoizedProps
      if (props?.msg && props.chatView) return props
    }
    return null
  }

  function mark() {
    // The engine running now: another window may have replaced it with a newer one
    try { archive = host.__nkMessageArchive || archive } catch { /* shared window is gone */ }
    for (const bubble of document.querySelectorAll(".chatWindow .ChatMessageBlock > .msg")) {
      let state = null
      try {
        const found = messageOf(bubble)
        const chat = found?.chatView?.m_chat
        if (chat) {
          const key = archive.keyOf(chat, found.msg)
          state = archive.deleted.has(key) ? "deleted" : archive.expired.has(key) ? "expired" : null
        }
      } catch { /* bubble is going */ }
      if (bubble.getAttribute(KEPT_ATTR) !== state) {
        if (state) bubble.setAttribute(KEPT_ATTR, state)
        else bubble.removeAttribute(KEPT_ATTR)
      }
      const time = bubble.querySelector(":scope > .nk-msg-time")
      const title = state === "deleted" ? steamText("Chat_MessageDeleted", "Message Deleted") : state === "expired" ? expiredText() : ""
      if (time && (time.dataset.nkKeptTitle || "") !== title) {
        time.dataset.nkKeptTitle = title
        time.title = title || time.title
      }
    }
  }

  let frame = null
  function schedule() {
    frame ??= requestAnimationFrame(() => {
      frame = null
      mark()
    })
  }

  function init() {
    schedule()
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true })
    setInterval(mark, 3000) // a deletion changes no element when the bubble stays
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
