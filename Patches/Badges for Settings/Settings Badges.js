// Beta / Alpha / Untested / Plugin badges next to theme settings
// Add to BADGES: "Setting Name": { label: "Beta", color: "#FFA500", tooltip: "..." } (tooltip optional)

;(() => {
  "use strict"

  const UNSTABLE = "This feature is not yet stable and is still in development."
  const BETA = { label: "Beta", color: "var(--badge-beta-color)", tooltip: UNSTABLE }
  const ALPHA = { label: "Alpha", color: "var(--badge-alpha-color)", tooltip: UNSTABLE }
  const UNFINISHED = { label: "Unfinished", color: "var(--badge-unfinished-color)", tooltip: "This feature is not finished yet and may not work." }
  const UNTESTED = { label: "Untested", color: "var(--badge-untested-color)", tooltip: "This feature has not been fully tested yet and may behave unexpectedly." }
  const PLUGIN = { label: "Plugin", color: "var(--badge-plugin-color)", tooltip: "Requires the Recent Chats plugin to work correctly." }

  const BADGES = {
    "Rounding Avatars": BETA,
    "Rounding Framed Avatars": BETA,
    "Rounding Group Avatars": BETA,
    "Avatar Decoration": BETA,
    "Rounding Buttons": BETA,
    "Badges for Contributors": ALPHA,
    "Bypass Age Verification": ALPHA,
    "Default Friends Tab": PLUGIN,
    "Auto Close Chat Tabs": UNTESTED,
    "Chat Header Background": BETA,
    "Faded Deleted Messages": ALPHA,
    "Save Deleted Messages": ALPHA,
    "Menu Rendering": UNTESTED,
    "Button Press Animation": BETA,
    "Context Menu": ALPHA,
    "Emoticon Side Panel": ALPHA,
    "Emoticons in Message Field": ALPHA,
    "Compact Manage Downloads Button": BETA,
    "Fake Device Status": ALPHA,
    "Blur Account Name": UNFINISHED,
  }


  // Find Labels

  // Added text nodes only
  function findLabels(root) {
    if (root.nodeType === Node.TEXT_NODE) return checkTextNode(root)
    if (root.nodeType !== Node.ELEMENT_NODE) return

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) checkTextNode(node)
  }

  function checkTextNode(node) {
    const badge = BADGES[node.textContent.trim()]
    const label = node.parentElement
    if (!badge || !label || label.querySelector(":scope > .nk-badge")) return
    addBadge(label, badge)
  }


  // Badge & Tooltip

  const liveBadges = new Map() // badge -> tooltip text
  let tooltip = null

  function addBadge(label, { label: text, color, tooltip: hint }) {
    const badge = document.createElement("span")
    badge.className = "nk-badge"
    badge.textContent = text
    badge.style.backgroundColor = color
    label.append(badge)

    if (hint) liveBadges.set(badge, hint)
  }

  // Shared mousemove (mouseenter may not reach badge)
  let hovered = null
  let frameRequested = false

  function onMouseMove(event) {
    if (frameRequested || !liveBadges.size) return
    frameRequested = true
    requestAnimationFrame(() => {
      frameRequested = false
      updateHover(event.clientX, event.clientY)
    })
  }

  function updateHover(x, y) {
    let found = null
    for (const badge of liveBadges.keys()) {
      // Settings closed
      if (!badge.isConnected) {
        liveBadges.delete(badge)
        continue
      }
      const r = badge.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) found = badge
    }

    if (found === hovered) return
    hovered = found
    found ? showTooltip(found) : hideTooltip()
  }

  function showTooltip(badge) {
    if (!tooltip) {
      tooltip = document.createElement("span")
      tooltip.className = "nk-tooltip"
      // In <html>, no clipping
      document.documentElement.append(tooltip)
    }
    const r = badge.getBoundingClientRect()
    tooltip.textContent = liveBadges.get(badge)
    tooltip.style.left = `${r.left - 40}px`
    tooltip.style.top = `${r.bottom + 6}px`
    tooltip.style.opacity = "1"
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.opacity = "0"
  }


  // Start

  function injectStyles() {
    const style = document.createElement("style")
    style.id = "nevko-badge-style"
    style.textContent = `
      .nk-badge {
        display: inline-block;
        align-self: center;
        flex-shrink: 0;
        height: 18px;
        margin-left: 12px;
        padding: 1px 6px;
        border-radius: 3px;
        color: var(--text-dark-color);
        font-size: 10px;
        font-weight: bold;
        line-height: 16px;
        letter-spacing: .04em;
        text-transform: uppercase;
        user-select: none;
        cursor: default;
      }
      .nk-tooltip {
        position: fixed !important;
        z-index: 2147483647 !important;
        padding: 6px 8px !important;
        border-radius: 2px !important;
        background-color: var(--tooltip-background) !important;
        color: var(--tooltip-text) !important;
        font-family: "Motiva Sans", Arial, Helvetica, sans-serif !important;
        font-size: 13px !important;
        white-space: nowrap !important;
        box-shadow: 1px 1px 8px var(--tooltip-shadow), 2px 2px 16px 1px var(--tooltip-shadow) !important;
        pointer-events: none !important;
        user-select: none !important;
        opacity: 0;
        transition: opacity .25s !important;
      }
    `
    document.head.append(style)
  }

  function init() {
    injectStyles()
    findLabels(document.body)

    // Text changes too
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "characterData") checkTextNode(record.target)
        else record.addedNodes.forEach(findLabels)
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true })

    document.addEventListener("mousemove", onMouseMove, { passive: true })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
