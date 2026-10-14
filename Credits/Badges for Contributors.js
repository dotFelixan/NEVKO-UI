// Contributor badges (site + client) | Data in Users/Badges/badges-data.js

;(() => {
  "use strict"

  const DATA_FILE = "Users/Badges/badges-data.js"
  const FALLBACK_BASE = "https://millennium.host/v1/themes/NEVKO-UI-REWRITE/Credits/"
  const STEAM_ID64_BASE = 76561197960265728n

  const ACCOUNT_BUTTON = "._3yD46y5pd3zOGR7CzKs0mC"
  const NATIVE_TOOLTIP = "._2FxbHJzYoH024ko7zqcJOf"

  // id -> { id, badge, description, tooltip }
  let users = new Map()
  let icons = {}


  // Data

  // currentScript is empty in Millennium modules, find own <script> by name
  function getOwnFolder() {
    const script = document.querySelector('script[src*="Badges"][src*="Contributors.js"]')
    if (!script) return FALLBACK_BASE
    return script.src.replace(/[^/]*$/, "")
  }

  function loadData(onReady) {
    if (window.__nevkoBadgesData) return onReady(window.__nevkoBadgesData)

    const script = document.createElement("script")
    script.src = getOwnFolder() + DATA_FILE
    script.onload = () => onReady(window.__nevkoBadgesData)
    // Failed -> no badges
    document.head.appendChild(script)
  }

  // Cached users -> skeleton while data loads
  const CACHE_KEY = "nevko-badges-known-ids"

  function readCache() {
    try {
      const ids = JSON.parse(localStorage.getItem(CACHE_KEY))
      return Array.isArray(ids) ? ids.filter(id => typeof id === "string") : []
    } catch { return [] }
  }

  function writeCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify([...users.keys()])) } catch { /* no storage */ }
  }

  function applyData(data) {
    if (!data) return false
    icons = data.icons || {}
    // Regular entries win over legacy
    users = new Map([
      ...(data.users_legacy || []).map(user => [user.id, user]),
      ...(data.users || []).map(user => [user.id, user]),
    ])
    return true
  }


  // SteamID

  // accountId -> SteamID64, null on garbage
  function toSteamId64(accountId) {
    if (!/^\d+$/.test(String(accountId ?? ""))) return null
    return String(STEAM_ID64_BASE + BigInt(accountId))
  }

  function idFromProfileLink(href) {
    return href?.match(/\/profiles\/(\d+)/)?.[1] ?? null
  }

  // SteamID from React props (persona / friend)
  function idFromReact(el) {
    const fiberKey = Object.keys(el).find(key => key.startsWith("__reactFiber"))
    let fiber = fiberKey && el[fiberKey]

    for (let depth = 0; fiber && depth < 5; depth++) {
      const props = fiber.memoizedProps
      const long = props?.persona?.m_steamid?.m_ulSteamID
      if (long) return String((BigInt(long.high >>> 0) << 32n) + BigInt(long.low >>> 0))
      if (props?.friend?.m_unAccountID) return toSteamId64(props.friend.m_unAccountID)
      fiber = fiber.return
    }
    return null
  }

  function idFromReactAncestors(el, stopAt) {
    for (let node = el; node && node !== stopAt; node = node.parentElement) {
      const id = idFromReact(node)
      if (id) return id
    }
    return null
  }

  // Own account: newest PopupSavedDimensions_<accountId>
  function findMyself() {
    let bestAccount = null
    let bestTime = -1

    for (const key of Object.keys(localStorage)) {
      const accountId = key.match(/^PopupSavedDimensions_(\d+)$/)?.[1]
      if (!accountId) continue
      try {
        for (const [, popup] of JSON.parse(localStorage.getItem(key)) || []) {
          if ((popup?.last_used || 0) > bestTime) {
            bestTime = popup.last_used
            bestAccount = accountId
          }
        }
      } catch { /* broken entry */ }
    }

    return bestAccount ? users.get(toSteamId64(bestAccount)) : null
  }


  // Tooltip

  let tooltip = null

  function showTooltip(badge, user, direction) {
    if (!tooltip) {
      tooltip = document.createElement("div")
      tooltip.id = "nevko-tooltip"
    }
    // Always last in body
    if (document.body.lastElementChild !== tooltip) document.body.appendChild(tooltip)

    tooltip.replaceChildren(textSpan("nevko-tooltip-title", user.description))
    if (user.tooltip) tooltip.append(textSpan("nevko-tooltip-sub", user.tooltip))

    const rect = badge.getBoundingClientRect()
    const below = direction === "down"
    const gap = direction === "up-near" ? 4 : 8

    tooltip.style.left = rect.left + rect.width / 2 + "px"
    tooltip.style.top = (below ? rect.bottom + 15 : rect.top - gap) + "px"
    tooltip.style.transform = below ? "translate(-50%, 0)" : "translate(-50%, -100%)"
    tooltip.classList.add("visible")

    // Hide other tooltips while hovering badge
    document.documentElement.classList.add("nevko-badge-hover")
    // Over web page -> popup window (Tooltip Popups.js)
    document.dispatchEvent(new CustomEvent("nevko-badge-tooltip", { detail: { visible: true } }))
  }

  function hideTooltip() {
    tooltip?.classList.remove("visible")
    document.documentElement.classList.remove("nevko-badge-hover")
    document.dispatchEvent(new CustomEvent("nevko-badge-tooltip", { detail: { visible: false } }))
  }

  function textSpan(className, text) {
    const span = document.createElement("span")
    span.className = className
    span.textContent = text
    return span
  }


  // Badge

  // One SVG is inserted many times (list, Quick Access, chat tab): with equal ids every url(#id) points at the first copy,
  // and the badge loses its mask / gradient once that copy is hidden
  let svgCopies = 0
  function withUniqueIds(svg) {
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(match => match[1])
    if (!ids.length) return svg
    const suffix = `-nk${++svgCopies}`
    for (const id of ids) {
      svg = svg.split(` id="${id}"`).join(` id="${id}${suffix}"`)
        .split(`url(#${id})`).join(`url(#${id}${suffix})`)
        .split(`href="#${id}"`).join(`href="#${id}${suffix}"`)
    }
    return svg
  }

  // Steam recolors everything inside an inactive chat tab (".ChatTab:not(.active) * { fill; stroke }"),
  // CSS beats the fill="" attributes, so the colors are repeated as inline styles
  function pinPaint(svg) {
    if (!svg) return
    for (const el of [svg, ...svg.querySelectorAll("*")]) {
      const fallback = el === svg ? "initial" : "inherit"
      el.style.fill = el.getAttribute("fill") || fallback
      el.style.stroke = el.getAttribute("stroke") || fallback
    }
  }

  // size: "full" (profile), "mini" (after name), "modern" (client lists)
  // pending = from cache, skeleton only
  function createBadge(user, { size = "mini", tooltipDirection = "up" } = {}) {
    const badge = document.createElement("span")
    badge.className = size === "full" ? "nevko-badge" : `nevko-badge-${size}`
    badge.dataset.steamid = user.id

    if (user.pending) {
      badge.classList.add(SKELETON)
      return badge
    }

    const icon = icons[user.badge] || ""
    if (icon.trimStart().startsWith("<svg")) {
      badge.innerHTML = withUniqueIds(icon)
      pinPaint(badge.querySelector("svg"))
    } else if (icon) {
      const img = document.createElement("img")
      img.src = icon
      img.alt = ""
      img.draggable = false
      // Skeleton until image is ready
      if (!img.complete) {
        badge.classList.add(SKELETON)
        img.decode().catch(() => {}).finally(() => {
          badge.classList.remove(SKELETON)
          reveal(badge)
        })
      }
      badge.append(img)
    }

    if (revealIds.has(user.id)) reveal(badge)

    badge.addEventListener("mouseenter", () => showTooltip(badge, user, tooltipDirection))
    badge.addEventListener("mouseleave", hideTooltip)
    return badge
  }

  const BADGE_SELECTOR = ".nevko-badge, .nevko-badge-mini, .nevko-badge-modern"
  const SKELETON = "nevko-badge-skeleton"
  // Reveal once, then drop the class (otherwise replays on Quick Access paging)
  const REVEAL = "nevko-badge-reveal"
  const revealIds = new Set() // had skeleton

  function reveal(badge) {
    badge.classList.add(REVEAL)
    badge.addEventListener("animationend", () => badge.classList.remove(REVEAL), { once: true })
  }
  const findBadge = el => el.querySelector(BADGE_SELECTOR)


  // Places

  // Site Profile
  function profilePage() {
    const id = window.g_rgProfileData?.steamid || idFromProfileLink(location.pathname)
    const user = id && users.get(id)
    const name = document.querySelector(".actual_persona_name")
    if (!user || !name || findBadge(name)) return
    name.append(createBadge(user, { size: "full" }))
  }

  // Comment Authors (name link, not avatar link)
  function comments() {
    for (const link of document.querySelectorAll(".commentthread_comment_author a[data-miniprofile]")) {
      if (link.querySelector("img") || findBadge(link)) continue
      const user = users.get(toSteamId64(link.dataset.miniprofile))
      if (user) link.append(createBadge(user))
    }
  }

  // Site Friend Blocks (two layouts)
  const FRIEND_BLOCKS = [
    { block: ".friendBlock", content: ".friendBlockContent", link: ".friendBlockLinkOverlay" },
    { block: ".friend_block_v2", content: ".friend_block_content", link: ".selectable_overlay" },
  ]

  function friendBlocks() {
    for (const layout of FRIEND_BLOCKS) {
      for (const block of document.querySelectorAll(layout.block)) {
        const content = block.querySelector(layout.content)
        if (!content || findBadge(content)) continue

        const link = block.querySelector(layout.link)
        const miniprofile = block.dataset.miniprofile || link?.dataset.miniprofile
        const id = block.dataset.steamid
          || (miniprofile && toSteamId64(miniprofile))
          || idFromProfileLink(link?.getAttribute("href"))
        const user = id && users.get(id)
        if (user) appendAfterName(content, createBadge(user))
      }
    }
  }

  // Wrap name text node so badge goes right after it
  function appendAfterName(content, badge) {
    const first = content.firstChild
    if (first?.nodeType === Node.TEXT_NODE) {
      const wrapper = document.createElement("span")
      wrapper.textContent = first.textContent
      wrapper.append(badge)
      first.replaceWith(wrapper)
    } else if (first?.nodeType === Node.ELEMENT_NODE) {
      first.append(badge)
    } else {
      content.append(badge)
    }
  }

  // Account Button
  function accountButton(myself) {
    const button = document.querySelector(ACCOUNT_BUTTON)
    if (!myself || !button || findBadge(button)) return
    const nameDiv = [...button.children].find(el => el.tagName === "DIV" && !el.className)
    nameDiv?.after(createBadge(myself, { tooltipDirection: "down" }))
  }

  // Own Name in Friends Header (no React props)
  function myNameInFriends(myself) {
    const name = document.querySelector(".currentUserContainer .playerName, .currentUserContainer [class*='playerName']")
    if (!myself || !name || findBadge(name)) return
    const badge = createBadge(myself, { size: "modern", tooltipDirection: "down" })
    badge.classList.add("nevko-badge-current-user")
    name.append(badge)
  }

  // Client Names | Steam reuses nodes, cache by text
  let checkedNames = new WeakMap() // element -> { text, user }

  function clientNames(doc) {
    // .speakerName: name above the messages in a chat
    for (const name of doc.querySelectorAll(".playerName, [class*='playerName'], .rcp-name, .speakerName")) {
      // Skip Quick Access container
      if (name.matches("[class*='playerNameQuickAccessContainer']")) continue

      // Recent Chats plugin rows: no persona in React, id is put on the row by Friends Tabs.js
      const chatRow = name.matches(".rcp-name") ? name.closest(".rcp-row-wrapper") : null
      if (chatRow && !chatRow.dataset.nkAccountid) continue // not set yet, check again later

      const text = name.textContent
      let checked = checkedNames.get(name)

      if (checked?.text !== text) {
        const id = chatRow ? toSteamId64(chatRow.dataset.nkAccountid) : idFromReactAncestors(name, doc.body)
        checked = { text, user: users.get(id) }
        checkedNames.set(name, checked)
      }

      const badge = findBadge(name)
      // Handled by myNameInFriends
      if (badge?.classList.contains("nevko-badge-current-user")) continue
      if (badge && badge.dataset.steamid !== checked.user?.id) badge.remove()
      if (checked.user && !findBadge(name)) {
        name.append(createBadge(checked.user, { size: "modern", tooltipDirection: "up-near" }))
      }
    }
  }

  // Mini Profile | Site reuses one popup and loads late, compare avatar / name
  let hovered = null // { id, avatar, name }

  const AVATAR_IMG = "img[src*='avatars']"
  const avatarHashIn = el => el?.querySelector(AVATAR_IMG)?.src.match(/[0-9a-f]{40}/i)?.[0].toLowerCase() ?? null

  // Text without our badge
  function ownText(el) {
    let text = ""
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.parentElement.closest(BADGE_SELECTOR)) text += node.nodeValue + " "
    }
    return text.replace(/\s+/g, " ").trim()
  }

  // First line = name
  function firstLine(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.nodeValue.replace(/\s+/g, " ").trim()
      if (text) return text
    }
    return null
  }

  function rememberHoveredUser(event) {
    const el = event.target instanceof Element && event.target.closest("[data-miniprofile], [data-steamid]")
    if (!el) return
    const id = el.dataset.steamid || toSteamId64(el.dataset.miniprofile)
    if (!id || id === hovered?.id) return

    // Avatar / name may be in a sibling with the same SteamID
    const attr = el.dataset.steamid ? "data-steamid" : "data-miniprofile"
    const peers = [el, ...document.querySelectorAll(`[${attr}="${el.getAttribute(attr)}"]`)]
    const avatar = peers.map(avatarHashIn).find(Boolean) ?? null
    const name = peers.map(peer => firstLine(peer.querySelector(".friend_block_content, .friendBlockContent") || peer)).find(Boolean) ?? null

    hovered = { id, avatar, name }
    scheduleRefresh()
  }

  // Popup shows hovered user?
  function popupShowsHovered(popup, nameEl) {
    if (!hovered) return false
    const popupAvatar = avatarHashIn(popup)
    if (popupAvatar && hovered.avatar) return popupAvatar === hovered.avatar

    const popupName = ownText(nameEl)
    if (popupName && hovered.name) return popupName.includes(hovered.name) || hovered.name.includes(popupName)
    return true // nothing to compare
  }

  function miniProfile() {
    const popup = document.querySelector(
      ".miniprofile_container, " +
      ":is([class*='HoverPosition'], [class*='HoverPopup']) [class*='miniProfile'], " +
      "[class*='HoverPosition'][class*='miniProfile'], " +
      ".client_chat_frame [class*='miniProfile']"
    )
    if (!popup) return

    const label = popup.querySelector("[class*='personaNameLabel']")
    const webName = popup.querySelector(".persona")
    const name = label || popup.querySelector("[class*='personaName']") || webName
    if (!name) return

    // Popup fingerprint: avatar or name
    const shownKey = avatarHashIn(popup) || ownText(name)

    // Same user, badge already set
    const badge = findBadge(popup)
    if (badge && badge.dataset.shownKey === shownKey) return

    // Client: SteamID from React | Site: check last hover
    const id = idFromReactAncestors(name, popup)
      || (popupShowsHovered(popup, name) ? hovered.id : null)
    const user = id ? users.get(id) : null

    // Other user now
    badge?.remove()
    if (!user) return

    const newBadge = createBadge(user, { tooltipDirection: "up-near" })
    newBadge.dataset.shownKey = shownKey
    if (label) {
      label.append(newBadge)
    } else if (name === webName) {
      Object.assign(webName.style, { display: "inline-flex", alignItems: "center", gap: "4px" })
      webName.append(newBadge)
    } else {
      name.after(newBadge)
    }
  }


  // Start

  // Friends list in iframe
  function getDocuments() {
    const docs = [document]
    for (let i = 0; i < window.frames.length; i++) {
      try {
        const doc = window.frames[i].document
        if (doc?.body) docs.push(doc)
      } catch { /* cross-origin */ }
    }
    return docs
  }

  let myself = null

  function refresh() {
    profilePage()
    comments()
    friendBlocks()
    accountButton(myself)
    myNameInFriends(myself)
    getDocuments().forEach(clientNames)
    miniProfile()
  }

  // Batch mutations, update once per frame
  let refreshQueued = false
  function scheduleRefresh() {
    if (refreshQueued) return
    refreshQueued = true
    requestAnimationFrame(() => {
      refreshQueued = false
      refresh()
    })
  }

  // Text changes: names only
  function onMutations(records) {
    const relevant = records.some(record => record.type === "childList"
      || record.target.parentElement?.closest(".playerName, [class*='playerName'], .speakerName"))
    if (relevant) scheduleRefresh()
  }

  const watched = new WeakSet()
  function watchDocuments() {
    for (const doc of getDocuments()) {
      if (watched.has(doc)) continue
      watched.add(doc)
      new MutationObserver(onMutations).observe(doc.body, { childList: true, subtree: true, characterData: true })
    }
  }

  function injectStyles() {
    const style = document.createElement("style")
    style.id = "nevko-badges-style"
    style.textContent = STYLES
    document.head.append(style)
  }

  let started = false
  function startWatching() {
    if (started) return
    started = true
    injectStyles()
    document.addEventListener("mouseenter", rememberHoveredUser, true)
    window.addEventListener("load", watchDocuments, true) // new iframes
    watchDocuments()
  }

  // Clear skeletons and checked names
  function dropSkeletons() {
    for (const doc of getDocuments()) {
      for (const el of doc.querySelectorAll("." + SKELETON + ":not(:has(img))")) {
        revealIds.add(el.dataset.steamid)
        el.remove()
      }
    }
    checkedNames = new WeakMap()
  }

  // Skeletons from cache first
  function startFromCache() {
    const ids = readCache()
    if (!ids.length) return
    users = new Map(ids.map(id => [id, { id, pending: true }]))
    myself = findMyself()
    startWatching()
    refresh()
  }

  function start(data) {
    const ok = applyData(data)
    if (started) dropSkeletons()
    if (!ok) {
      users = new Map() // no data
      return
    }
    writeCache()
    myself = findMyself()
    startWatching()
    refresh()
    revealIds.clear() // no animation after this
  }

  const STYLES = `
    .nevko-badge,
    .nevko-badge-mini,
    .nevko-badge-modern {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      flex-shrink: 0;
    }

    /* Skeleton + Reveal */
    .nevko-badge-skeleton {
      min-width: 16px;
      min-height: 16px;
      border-radius: 3px;
      background: linear-gradient(90deg,
        var(--skeleton-color, rgba(255,255,255,.06)) 0%,
        var(--skeleton-shine, rgba(255,255,255,.16)) 50%,
        var(--skeleton-color, rgba(255,255,255,.06)) 100%) 0 0 / 200% 100%;
      animation: nevko-skeleton 1.4s linear infinite;
    }
    .nevko-badge.nevko-badge-skeleton { min-width: 20px; min-height: 20px; }
    .nevko-badge-skeleton > img { opacity: 0; }
    .nevko-badge-reveal > :is(svg, img) {
      animation: nevko-badge-in .15s ease-out;
    }
    @keyframes nevko-skeleton {
      from { background-position: 100% 0; }
      to { background-position: -100% 0; }
    }
    @keyframes nevko-badge-in {
      from { opacity: 0; }
    }
    .nevko-badge      { margin-left: 6px; margin-top: -4px; }
    .nevko-badge-mini { margin-left: 4px; margin-top: -4px; }
    .nevko-badge-modern { margin-right: 4px; }

    .nevko-badge svg,
    .nevko-badge img { width: 20px; height: 20px; filter: drop-shadow(0 1px 2px var(--shadow-soft, rgba(0,0,0,.3))); }
    .nevko-badge-mini :is(svg, img),
    .nevko-badge-modern :is(svg, img) { width: 16px; height: 16px; filter: drop-shadow(0 1px 1px var(--shadow-soft, rgba(0,0,0,.3))); }

    /* Account Button */
    ${ACCOUNT_BUTTON} .nevko-badge-mini { margin: 0 2px; }

    /* Own Name in Friends Header */
    .nevko-badge-current-user {
      position: relative;
      top: -1px;
      margin: 0 0 0 4px;
      z-index: 10;
    }

    /* Ellipsis, badge stays */
    [class*='statusAndName'],
    [class*='playerNameQuickAccessContainer'] { min-width: 0; overflow: hidden; }
    .playerName,
    [class*='playerName'] { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Site friend blocks clip content */
    .friendBlockContent,
    .friend_block_content { overflow: visible !important; }
    :is(.friendBlockContent, .friend_block_content) .nevko-badge-mini {
      position: relative;
      z-index: 3;
      cursor: default;
      margin-top: -4px !important;
    }
    :is(.miniprofile_container, .miniprofile_playersection) .player_content .nevko-badge-mini {
      position: relative;
      z-index: 3;
      margin-top: 0;
    }

    /* Hide other tooltips on hover */
    .nevko-badge-hover ${NATIVE_TOOLTIP},
    .nevko-badge-hover #nk-anchor-tooltip,
    .nevko-badge-hover #nk-rich-presence-tooltip { visibility: hidden !important; }

    #nevko-tooltip {
      position: fixed;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      padding: 6px 10px;
      border-radius: 2px;
      background: var(--tooltip-background, #696773);
      color: var(--tooltip-text, #E0E1E6);
      font-size: 13px;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      box-shadow: 1px 1px 8px var(--shadow-soft, rgba(0,0,0,.3)), 2px 2px 16px 1px var(--shadow-soft, rgba(0,0,0,.3));
      opacity: 0;
      transition: opacity .2s;
    }
    #nevko-tooltip.visible { opacity: 1; }
    #nevko-tooltip .nevko-tooltip-sub { font-size: 11px; color: var(--tooltip-subtext, #9c9aa6); }
  `

  const begin = () => {
    startFromCache()
    loadData(start)
  }
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", begin, { once: true })
    : begin()
})()
