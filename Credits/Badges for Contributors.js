// NEVKO-UI Badges — adds custom icons next to usernames across Steam pages.
//
// Данные загружаются из badges.json рядом с этим скриптом.
// badges.json содержит: users, users_legacy, icons
//
// Each entry: { id, badge, description, tooltip? }
//   id          — Steam ID64
//   badge       — key from icons
//   description — main tooltip line
//   tooltip     — optional second tooltip line (smaller, grey)

// Millennium инжектирует JS через millennium.host/v1/themes/<папка>/ — он же не имеет CORS.
// document.currentScript.src даёт точный URL текущего скрипта — из него вычисляем базу.
const _SCRIPT_BASE = (document.currentScript?.src || "")
  .replace(/\/[^/]*$/, "/")  // обрезаем имя файла, оставляем путь
const _BASE_URL = _SCRIPT_BASE || "https://millennium.host/v1/themes/NEVKO-UI-REWRITE/Credits/Users/Badges/"

// Данные заполняются после загрузки badges.json
let USERS = []
let USERS_LEGACY = []
let BADGE_ICONS = {}
let BADGE_ICONS_LEGACY = {}

// -- New icons -- keys must match badge names in USERS
// BADGE_ICONS и BADGE_ICONS_LEGACY заполняются из badges.json через fetch

// -- Styles --
const BADGE_STYLES = `
  .nevko-badge {
    display: inline-flex;
    align-items: center;
    margin-left: 6px;
    vertical-align: middle;
    margin-top: -4px;
  }
  .nevko-badge svg {
    width: 20px;
    height: 20px;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
  }
  /* legacy: badge appended after name */
  .nevko-badge-mini {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    vertical-align: middle;
    margin-top: -4px;
  }
  .nevko-badge-mini svg {
    width: 16px;
    height: 16px;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
  }
  /* modern: badge prepended before name */
  .nevko-badge-modern {
    display: inline-flex;
    align-items: center;
    margin-right: 4px;
    vertical-align: middle;
    flex-shrink: 0;
  }
  .nevko-badge-modern svg {
    width: 16px;
    height: 16px;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
  }
  /* Badge inside .AccountMenu — sits right after the username div */
  ._3yD46y5pd3zOGR7CzKs0mC .nevko-badge-mini {
    margin-left: 2px;
    margin-right: 2px;
    margin-top: 0px;
    flex-shrink: 0;
  }
  /* Badge inside quickAccessFriend playerName — hidden */
  [class*='quickAccessFriend'] [class*='playerName'] .nevko-badge-modern,
  [class*='quickAccessFriend'] [class*='playerName'] .nevko-badge-mini {
    display: none !important;
  }

  /* Current user badge in the friends list header */
  .nevko-badge-current-user {
    position: relative;
    top: -1px;
    margin-left: 4px;
    flex-shrink: 0;
    z-index: 10;
    overflow: visible;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    margin-right: 0;
  }
  /* Ensure flex containers can shrink so playerName gets ellipsis */
  [class*='statusAndName'],
  [class*='playerNameQuickAccessContainer'] {
    min-width: 0;
    overflow: hidden;
  }
  /* playerName text clips with ellipsis when a badge takes up space */
  [class*='playerName'],
  .playerName {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  /* friendBlock/friend_block_v2 — Steam sets overflow:hidden + white-space:nowrap on the content
     wrapper which clips the badge. Force overflow:visible and prevent the badge from shrinking. */
  .friendBlockContent .nevko-badge-mini,
  .friend_block_content .nevko-badge-mini {
    position: relative;
    z-index: 3;
    cursor: default;
    flex-shrink: 0;
    overflow: visible;
    margin-top: -4px !important;
    vertical-align: middle;
  }
  /* friendBlockContent itself must not clip its children */
  .friendBlockContent,
  .friend_block_content {
    overflow: visible !important;
  }
  /* Badge inside web miniprofile — span.persona gets inline-flex via JS so the badge
     sits on the same line as the name. Just ensure it does not overflow or shift. */
  .miniprofile_container .player_content .nevko-badge-mini,
  .miniprofile_playersection .player_content .nevko-badge-mini {
    position: relative;
    z-index: 3;
    cursor: default;
    vertical-align: middle;
    margin-top: 0;
    flex-shrink: 0;
  }

  /* Single shared tooltip for the whole page */
  #nevko-tooltip {
    position: fixed;
    background-color: #696773;
    color: #E0E1E6;
    padding: 6px 10px;
    border-radius: 2px;
    font-size: 13px;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    opacity: 0;
    transition: opacity 0.2s;
    box-shadow: 1px 1px 8px rgba(0,0,0,0.3), 2px 2px 16px 1px rgba(0,0,0,0.3);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  #nevko-tooltip.visible {
    opacity: 1;
  }
  #nevko-tooltip .nevko-tooltip-title {
    font-size: 13px;
    color: #E0E1E6;
  }
  #nevko-tooltip .nevko-tooltip-sub {
    font-size: 11px;
    color: #9c9aa6;
  }
`

// -- Tooltip --
let globalTooltip = null

function initTooltip() {
  globalTooltip = document.createElement("div")
  globalTooltip.id = "nevko-tooltip"
  document.body.appendChild(globalTooltip)
}

function showTooltip(element, text, direction = "up", subtitle = null) {
  if (!globalTooltip) return
  // Always move to end of body so it renders above all other fixed/absolute elements
  if (globalTooltip.parentElement !== document.body || document.body.lastElementChild !== globalTooltip) {
    document.body.appendChild(globalTooltip)
  }
  const rect = element.getBoundingClientRect()
  globalTooltip.innerHTML = ""
  const title = document.createElement("span")
  title.className = "nevko-tooltip-title"
  title.textContent = text
  globalTooltip.appendChild(title)
  if (subtitle) {
    const sub = document.createElement("span")
    sub.className = "nevko-tooltip-sub"
    sub.textContent = subtitle
    globalTooltip.appendChild(sub)
  }
  globalTooltip.style.left = rect.left + rect.width / 2 + "px"
  if (direction === "down") {
    globalTooltip.style.top = rect.bottom + 15 + "px"
    globalTooltip.style.transform = "translate(-50%, 0)"
  } else if (direction === "up-near") {
    globalTooltip.style.top = rect.top - 4 + "px"
    globalTooltip.style.transform = "translate(-50%, -100%)"
  } else {
    globalTooltip.style.top = rect.top - 8 + "px"
    globalTooltip.style.transform = "translate(-50%, -100%)"
  }
  globalTooltip.classList.add("visible")
}

function hideTooltip() {
  if (!globalTooltip) return
  globalTooltip.classList.remove("visible")
}

// -- Utilities --

// Fast O(1) lookup map — built once after badges.json is loaded.
// USERS (new-style) take priority over USERS_LEGACY for the same ID.
// Each entry gets an extra `_icons` field pointing to the correct icon set.
let USER_MAP = new Map()

function buildUserMap() {
  USER_MAP = new Map([
    ...USERS_LEGACY.map(u => [u.id, { ...u, _icons: BADGE_ICONS_LEGACY }]),
    ...USERS.map(u => [u.id, { ...u, _icons: BADGE_ICONS }]),
  ])
}

// Converts Steam ID3 (from data-miniprofile attribute) to Steam ID64
const ID3_CACHE = new Map()
function steamId3ToSteamId64(steamId3) {
  if (ID3_CACHE.has(steamId3)) return ID3_CACHE.get(steamId3)
  const BASE = BigInt("76561197960265728")
  const id64 = (BASE + BigInt(steamId3)).toString()
  ID3_CACHE.set(steamId3, id64)
  return id64
}

// Gets Steam ID64 of the currently viewed profile page
function getPageSteamId() {
  if (window.g_rgProfileData && window.g_rgProfileData.steamid) {
    return window.g_rgProfileData.steamid
  }
  const profileMatch = window.location.pathname.match(/\/profiles\/(\d+)/)
  if (profileMatch) return profileMatch[1]
  return null
}

// Finds a user entry by Steam ID64
function findUser(steamId64) {
  return USER_MAP.get(steamId64)
}

// Extracts Steam ID64 from a /profiles/ID link
function extractSteamIdFromHref(href) {
  if (!href) return null
  const match = href.match(/\/profiles\/(\d+)/)
  return match ? match[1] : null
}

// Creates a badge element for a user.
// style: "full" = large (20px), "mini" = legacy 16px appended after name, "modern" = 16px prepended before name
function createBadge(user, mini = false, tooltipDir = "up", style = "mini") {
  const badge = document.createElement("span")
  if (!mini) {
    badge.className = "nevko-badge"
  } else if (style === "modern") {
    badge.className = "nevko-badge-modern"
  } else {
    badge.className = "nevko-badge-mini"
  }
  const icons = user._icons || BADGE_ICONS
  const svgContent = icons[user.badge] || BADGE_ICONS[user.badge] || ""
  badge.innerHTML = svgContent
  badge.dataset.description = user.description

  let nativeHideObserver = null

  badge.addEventListener("mouseenter", () => {
    showTooltip(badge, user.description, tooltipDir, user.tooltip || null)

    // Hide any already-existing native tooltip immediately
    document.querySelectorAll("._2FxbHJzYoH024ko7zqcJOf").forEach(el => {
      el.style.visibility = "hidden"
    })

    // Also watch for native tooltip appearing late (Steam renders it async)
    nativeHideObserver = new MutationObserver(() => {
      document.querySelectorAll("._2FxbHJzYoH024ko7zqcJOf").forEach(el => {
        el.style.visibility = "hidden"
      })
    })
    nativeHideObserver.observe(document.body, { childList: true, subtree: true })
  })

  badge.addEventListener("mouseleave", () => {
    // Stop watching and restore native tooltips
    if (nativeHideObserver) {
      nativeHideObserver.disconnect()
      nativeHideObserver = null
    }
    document.querySelectorAll("._2FxbHJzYoH024ko7zqcJOf").forEach(el => {
      el.style.visibility = ""
    })
    hideTooltip()
  })

  return badge
}

// -- Core --

function init() {
  const style = document.createElement("style")
  style.textContent = BADGE_STYLES
  document.head.appendChild(style)

  initTooltip()
  addAllBadges()
  waitForClientHeader()
  observeChanges()
}

function addAllBadges() {
  addProfileBadge()
  addCommentBadges()
  addFriendBlockBadges()
  addSelectableOverlayBadges()
}


// Determines the active Steam account by resetting all EventsLastFetch_* values to -1,
// then waiting for Steam to re-write only the active account's value.
// Returns a Promise that resolves to the matching USERS entry or null.
// Finds the current logged-in user by reading PopupSavedDimensions_<id3> from localStorage.
// Each entry contains popup positions with last_used timestamps.
// The active account always has the most recent last_used value across all its popups.
function getClientCurrentUser() {
  let bestId3 = null
  let bestLastUsed = -1

  for (const key of Object.keys(localStorage)) {
    const match = key.match(/^PopupSavedDimensions_(\d+)$/)
    if (!match) continue
    try {
      const entries = JSON.parse(localStorage.getItem(key))
      if (!Array.isArray(entries)) continue
      for (const [, data] of entries) {
        const t = data?.last_used || 0
        if (t > bestLastUsed) {
          bestLastUsed = t
          bestId3 = match[1]
        }
      }
    } catch { /* ignore parse errors */ }
  }

  if (!bestId3) return null
  const id64 = steamId3ToSteamId64(bestId3)
  return findUser(id64)
}

// Inserts badge inside .AccountMenu right after the username div.
// Waits for getClientCurrentUser (Promise) to resolve, then inserts badge if user is found.
function waitForClientHeader() {
  const user = getClientCurrentUser()
  if (!user) return

  function tryInsert() {
    const accountMenu = document.querySelector("._3yD46y5pd3zOGR7CzKs0mC")
    if (!accountMenu) return false
    if (accountMenu.querySelector(".nevko-badge-mini")) return true
    const nameDiv = Array.from(accountMenu.children).find(el => el.tagName === "DIV" && !el.className)
    if (!nameDiv) return false
    nameDiv.after(createBadge(user, true, "down"))
    return true
  }

  if (tryInsert()) return

  const observer = new MutationObserver(() => {
    if (tryInsert()) observer.disconnect()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

// Badge next to the current user's name in the friends list header (.currentUserContainer).
// Uses getClientCurrentUser() since the element has no data-steamid.
function addCurrentUserFriendListBadge() {
  const user = getClientCurrentUser()
  if (!user) return

  // .currentUserContainer > .AvatarAndUser > .labelHolder > .statusAndName > .playerName
  const nameEl = document.querySelector(".currentUserContainer [class*='playerName'], .currentUserContainer .playerName")
  if (!nameEl) return
  if (nameEl.querySelector(".nevko-badge-modern, .nevko-badge-mini")) return

  const style = user._icons === BADGE_ICONS ? "modern" : "mini"
  const badge = createBadge(user, true, "down", style)
  // Extra class for positioning overrides and tooltip-direction logic
  badge.classList.add("nevko-badge-current-user")
  // Steam's tooltip handler listens in capture phase on a parent element.
  // By using capture phase here on the badge itself, we fire BEFORE Steam's handler
  // and stop propagation so their tooltip never sees the event.
  // We also temporarily strip `title` attributes from all ancestors to prevent
  // the native browser / Steam tooltip from showing on top of ours.
  badge.addEventListener("mouseenter", e => {
    e.stopPropagation()
    const steamTip = document.getElementById("nk-anchor-tooltip")
    if (steamTip) steamTip.style.setProperty("visibility", "hidden", "important")
    showTooltip(badge, user.description, "down", user.tooltip || null)
  }, true)
  badge.addEventListener("mouseleave", () => {
    const steamTip = document.getElementById("nk-anchor-tooltip")
    if (steamTip) steamTip.style.removeProperty("visibility")
    hideTooltip()
  }, true)
  badge.addEventListener("mouseover", e => e.stopPropagation(), true)
  nameEl.appendChild(badge)
}

// Badge on profile page next to the username
function addProfileBadge() {
  const steamId = getPageSteamId()
  if (!steamId) return

  const user = findUser(steamId)
  if (!user) return

  const nameElement = document.querySelector(".actual_persona_name")
  if (!nameElement || nameElement.querySelector(".nevko-badge")) return

  nameElement.appendChild(createBadge(user, false))
}

// Mini badges in comment threads next to author names
function addCommentBadges() {
  // Select only the name link (no <img> inside), not the avatar link
  const commentAuthors = document.querySelectorAll(".commentthread_comment_author a[data-miniprofile]")

  commentAuthors.forEach((link) => {
    if (link.querySelector("img")) return
    if (link.querySelector(".nevko-badge-mini")) return

    const miniprofile = link.getAttribute("data-miniprofile")
    if (!miniprofile) return

    const steamId64 = steamId3ToSteamId64(miniprofile)
    const user = findUser(steamId64)

    if (user) {
      link.appendChild(createBadge(user, true))
    }
  })
}

// Mini badges in the friends list (friendBlock layout)
function addFriendBlockBadges() {
  // Collect all friendBlock elements — miniprofile may be on the block itself or on the overlay
  const blocks = document.querySelectorAll(".friendBlock[data-miniprofile], .friendBlock:has(.friendBlockLinkOverlay)")

  blocks.forEach((block) => {
    // Get miniprofile from the block itself or from the overlay inside it
    const miniprofile = block.getAttribute("data-miniprofile")
      || block.querySelector(".friendBlockLinkOverlay")?.getAttribute("data-miniprofile")
    const href = block.querySelector(".friendBlockLinkOverlay")?.getAttribute("href")

    let steamId64 = null
    if (miniprofile) {
      steamId64 = steamId3ToSteamId64(miniprofile)
    } else if (href) {
      steamId64 = extractSteamIdFromHref(href)
    }
    if (!steamId64) return

    const user = findUser(steamId64)
    if (!user) return

    const content = block.querySelector(".friendBlockContent")
    if (!content || content.querySelector(".nevko-badge-mini")) return

    // Find the first text node (username) inside the content block
    const textNodes = Array.from(content.childNodes).filter(
      (node) =>
        node.nodeType === Node.TEXT_NODE ||
        (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains("nevko-badge-mini")),
    )

    if (textNodes.length > 0) {
      const lastTextNode = textNodes[0]
      if (lastTextNode.nodeType === Node.TEXT_NODE) {
        const wrapper = document.createElement("span")
        wrapper.textContent = lastTextNode.textContent
        wrapper.appendChild(createBadge(user, true))
        lastTextNode.replaceWith(wrapper)
      } else {
        lastTextNode.appendChild(createBadge(user, true))
      }
    } else {
      content.appendChild(createBadge(user, true))
    }
  })
}

// Mini badges in the chat/overlay friends list (selectable_overlay / friend_block_v2 layout)
function addSelectableOverlayBadges() {
  // friend_block_v2 has data-miniprofile/data-steamid on the outer div
  const blocks = document.querySelectorAll(".friend_block_v2[data-miniprofile], .friend_block_v2[data-steamid]")

  blocks.forEach((block) => {
    const miniprofile = block.getAttribute("data-miniprofile")
    const steamidAttr = block.getAttribute("data-steamid")
    const overlay = block.querySelector(".selectable_overlay")
    const href = overlay?.getAttribute("href")

    let steamId64 = null
    if (steamidAttr) {
      steamId64 = steamidAttr
    } else if (miniprofile) {
      steamId64 = steamId3ToSteamId64(miniprofile)
    } else if (href) {
      steamId64 = extractSteamIdFromHref(href)
    }
    if (!steamId64) return

    const user = findUser(steamId64)
    if (!user) return

    const content = block.querySelector(".friend_block_content")
    if (!content || content.querySelector(".nevko-badge-mini")) return

    // Find the first text node (username) inside the content block
    const textNodes = Array.from(content.childNodes).filter(
      (node) =>
        node.nodeType === Node.TEXT_NODE ||
        (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains("nevko-badge-mini")),
    )

    if (textNodes.length > 0) {
      const lastTextNode = textNodes[0]
      if (lastTextNode.nodeType === Node.TEXT_NODE) {
        const wrapper = document.createElement("span")
        wrapper.textContent = lastTextNode.textContent
        wrapper.appendChild(createBadge(user, true))
        lastTextNode.replaceWith(wrapper)
      } else {
        lastTextNode.appendChild(createBadge(user, true))
      }
    } else {
      content.appendChild(createBadge(user, true))
    }
  })
}

// Converts a Long {low, high, unsigned} object (from React fiber persona data) to a Steam ID64 string.
function longToSteamId64(long) {
  if (!long) return null
  // ID64 = high * 2^32 + low (treat both as unsigned)
  const high = (long.high >>> 0)
  const low = (long.low >>> 0)
  // Use BigInt to avoid float precision loss
  return String(BigInt(high) * BigInt(0x100000000) + BigInt(low))
}

// Reads the Steam ID64 from the React fiber of a LabelHolder/playerName element in the Steam client.
// The fiber at depth 1 above LabelHolder contains persona.m_steamid.m_ulSteamID {low, high}.
function getSteamIdFromFiber(el) {
  const fiberKey = Object.keys(el).find(k => k.startsWith("__reactFiber"))
  if (!fiberKey) return null
  let fiber = el[fiberKey]
  let depth = 0
  while (fiber && depth < 5) {
    const p = fiber.memoizedProps
    if (p?.persona?.m_steamid?.m_ulSteamID) {
      return longToSteamId64(p.persona.m_steamid.m_ulSteamID)
    }
    if (p?.friend?.m_unAccountID) {
      return steamId3ToSteamId64(String(p.friend.m_unAccountID))
    }
    fiber = fiber.return
    depth++
  }
  return null
}

// Badges next to player names in the Steam client friends/playing panels.
// Finds [class*="playerName"] elements, reads ID from React fiber, inserts badge.
// Returns all documents accessible from the current context (main + all iframes)
function getAllDocuments() {
  const docs = [document]
  try {
    for (const frame of Array.from(window.frames)) {
      try { if (frame.document) docs.push(frame.document) } catch { /* cross-origin */ }
    }
  } catch { /* ignore */ }
  return docs
}

function addClientPlayerNameBadges() {
  getAllDocuments().forEach(doc => {
    doc.querySelectorAll("[class*='playerName']").forEach(nameEl => {
      // Skip elements inside quickAccessFriend — those are handled by addQuickAccessFriendBadges
      if (nameEl.closest(".quickAccessFriend, [class*='quickAccessFriend']")) return
      // Skip the currentUserContainer — handled by addCurrentUserFriendListBadge
      if (nameEl.closest(".currentUserContainer")) return

      // Already has a visible badge (skip hidden ones — they may be leftover from quickAccess)
      const existing = nameEl.querySelector(".nevko-badge-modern, .nevko-badge-mini")
      if (existing) {
        if (getComputedStyle(existing).display !== "none") return
        // Remove hidden badge so we can re-insert a visible one
        existing.remove()
      }

      // Walk up from nameEl looking for fiber with persona/friend data
      let steamId64 = null
      let el = nameEl
      while (el && el !== doc.body) {
        steamId64 = getSteamIdFromFiber(el)
        if (steamId64) break
        el = el.parentElement
      }
      if (!steamId64) return

      const user = findUser(steamId64)
      if (!user) return

      const style = user._icons === BADGE_ICONS ? "modern" : "mini"
      nameEl.appendChild(createBadge(user, true, "up-near", style))
    })
  })
}

// Badges in the Steam client quick-access friends panel (top bar / side panel).
// Structure: .quickAccessFriend > div > .playerNameQuickAccessContainer > .playerName
// Steam ID is read via React fiber from the .playerName element's ancestors.
function addQuickAccessFriendBadges() {
  document.querySelectorAll(".quickAccessFriend .playerName, [class*='quickAccessFriend'] .playerName").forEach(nameEl => {
    // Insert badge inside playerNameQuickAccessContainer, after the name text (= right of text)
    const nameContainer = nameEl.closest("[class*='playerNameQuickAccessContainer']") || nameEl.parentElement
    if (!nameContainer) return
    if (nameEl.querySelector(".nevko-badge-modern, .nevko-badge-mini")) return

    // Walk up to find a React fiber with persona data
    let steamId64 = null
    let el = nameEl
    while (el) {
      steamId64 = getSteamIdFromFiber(el)
      if (steamId64) break
      el = el.parentElement
    }
    if (!steamId64) return

    const user = findUser(steamId64)
    if (!user) return

    // Append badge inside nameEl itself — sits right of the name text, can't land in a sibling
    const style = user._icons === BADGE_ICONS ? "modern" : "mini"
    nameEl.appendChild(createBadge(user, true, "up-near", style))
  })
}

// Tracks the last hovered Steam ID — used to identify who the miniprofile popup belongs to.
// Listens on the document for mouseenter on any element with data-miniprofile or data-steamid.
let _lastHoveredSteamId64 = null
document.addEventListener("mouseenter", e => {
  if (!(e.target instanceof Element)) return
  const el = e.target.closest("[data-miniprofile], [data-steamid]")
  if (!el) return
  const steamid = el.getAttribute("data-steamid")
  const miniprofile = el.getAttribute("data-miniprofile")
  if (steamid) {
    _lastHoveredSteamId64 = steamid
  } else if (miniprofile) {
    _lastHoveredSteamId64 = steamId3ToSteamId64(miniprofile)
  }
}, true)

// Badge inside the hover miniprofile popup.
// Web: .miniprofile_container
// Client: the .miniProfile div that is a direct child of the HoverPosition container (not a permanent page element)
function addMiniprofilePopupBadges() {
  // Web popup
  let popup = document.querySelector(".miniprofile_container")

  // Client popup — find the miniProfile div inside any HoverPosition/HoverPopup wrapper
  if (!popup) {
    const hoverContainer = document.querySelector(
      "[class*='HoverPositionPopup'], [class*='HoverPosition'][class*='Ready'], [class*='HoverPopup']"
    )
    if (hoverContainer) {
      popup = hoverContainer.querySelector("[class*='miniProfile']")
      // If hoverContainer itself is the miniProfile root
      if (!popup && (hoverContainer.className.includes("miniProfile") || hoverContainer.className.includes("miniprofile"))) {
        popup = hoverContainer
      }
    }
  }

  // Also try the client's direct HoverPopup body structure
  if (!popup) {
    popup = document.querySelector(".HoverPopupBody [class*='miniProfile'], .client_chat_frame [class*='miniProfile']")
  }

  if (!popup || popup.querySelector(".nevko-badge-mini, .nevko-badge-modern")) return

  // personaNameLabel is the innermost flex container that holds just the name text
  // personaName is its parent — also flex but may be column
  // We target personaNameLabel specifically so the badge sits inline with the name text
  const nameLabel = popup.querySelector("[class*='personaNameLabel']")
  const nameContainer = popup.querySelector("[class*='personaName']")
  const webPersona = popup.querySelector(".persona")
  const nameEl = nameLabel || nameContainer || webPersona
  if (!nameEl) return

  // Try to get Steam ID from React fiber — walk up from nameEl to popup root
  let steamId64 = null
  let el = nameEl
  while (el && el !== popup) {
    steamId64 = getSteamIdFromFiber(el)
    if (steamId64) break
    el = el.parentElement
  }
  // Fallback to last hovered ID (web case where fiber has no persona data)
  if (!steamId64) steamId64 = _lastHoveredSteamId64
  if (!steamId64) return

  const user = findUser(steamId64)
  if (!user) return

  // personaNameLabel is itself a flex row — append badge inside it so it sits next to the name text.
  // For web miniprofile, nameEl is span.persona — append the badge inside it (not after) so it
  // stays on the same line as the name text rather than becoming a separate flex-column item.
  if (nameLabel) {
    nameLabel.appendChild(createBadge(user, true, "up-near"))
  } else if (webPersona && nameEl === webPersona) {
    webPersona.style.display = "inline-flex"
    webPersona.style.alignItems = "center"
    webPersona.style.gap = "4px"
    webPersona.appendChild(createBadge(user, true, "up-near"))
  } else {
    nameEl.after(createBadge(user, true, "up-near"))
  }
}

// Re-runs badge injection whenever the DOM changes (for dynamically loaded content)
// Debounced to 50ms — batches rapid mutations into a single run
// Also re-checks client header badge in case Steam re-renders the AccountMenu
function observeChanges() {
  const cachedUser = getClientCurrentUser()

  let timer = null
  let retryTimers = []

  const runAll = () => {
    timer = null
    if (cachedUser) {
      const accountMenu = document.querySelector("._3yD46y5pd3zOGR7CzKs0mC")
      if (accountMenu && !accountMenu.querySelector(".nevko-badge-mini")) {
        const nameDiv = Array.from(accountMenu.children).find(el => el.tagName === "DIV" && !el.className)
        if (nameDiv) nameDiv.after(createBadge(cachedUser, true, "down"))
      }
    }
    addCommentBadges()
    addFriendBlockBadges()
    addSelectableOverlayBadges()
    addCurrentUserFriendListBadge()
    addClientPlayerNameBadges()
    addQuickAccessFriendBadges()
    addMiniprofilePopupBadges()
  }

  // React renders async — run immediately then retry a few times with growing delays
  // to catch elements that appear after the first mutation fires.
  const runWithRetries = () => {
    retryTimers.forEach(clearTimeout)
    retryTimers = []
    runAll()
      ;[100, 300, 600, 1200].forEach(delay => {
        retryTimers.push(setTimeout(runAll, delay))
      })
  }

  const debounced = () => {
    if (timer) return
    timer = setTimeout(runWithRetries, 50)
  }

  // Observe every accessible document (main frame + all iframes)
  const attachObservers = () => {
    getAllDocuments().forEach(doc => {
      if (!doc.body) return
      if (doc.body._nevkoBadgeObserver) return
      const obs = new MutationObserver(debounced)
      obs.observe(doc.body, { childList: true, subtree: true })
      doc.body._nevkoBadgeObserver = obs
    })
  }

  attachObservers()
  // Re-attach when new iframes load
  window.addEventListener("load", attachObservers, true)
}

// -- Boot: загружаем badges-data.js через <script> тег — не подчиняется CORS --
// badges-data.js содержит: window.__nevkoBadgesData = { users, users_legacy, icons }
function boot() {
  function start() {
    const data = window.__nevkoBadgesData
    if (data) {
      USERS = data.users || []
      USERS_LEGACY = data.users_legacy || []
      BADGE_ICONS = data.icons || {}
      BADGE_ICONS_LEGACY = data.icons || {}
    }
    buildUserMap()
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init)
    } else {
      init()
    }
  }

  // Если badges-data.js уже загружен раньше (инжектирован через skin.json) — стартуем сразу
  if (window.__nevkoBadgesData) {
    start()
    return
  }

  // Иначе загружаем динамически через <script> — обходит CORS
  function injectScript() {
    const script = document.createElement("script")
    script.src = _BASE_URL + "badges-data.js"
    script.onload = start
    script.onerror = () => { buildUserMap() }
      ; (document.head || document.documentElement).appendChild(script)
  }

  if (document.head) {
    injectScript()
  } else {
    document.addEventListener("DOMContentLoaded", injectScript, { once: true })
  }
}

boot()
