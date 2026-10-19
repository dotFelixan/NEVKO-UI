// Quick Access: 4x2 grid with pages, 8x1 in a wide window (styles in Quick.css)
// Drag friend to arrow and hold to flip page

;(() => {
  "use strict"

  const CONTAINER = ".quickAccessFriends"
  const PAGE_SIZE = 8
  const NARROW_COLUMNS = 4 // 4x2
  const WIDE_COLUMNS = 8   // 8x1
  const WIDE_FROM = 880    // px window width: 8 tiles in a row get as wide as 4 in the narrowest window
  const COLUMNS_ATTR = "nkQaColumns" // data-nk-qa-columns on the container and <html> (Quick.css, Friends Tabs.css)
  const ALIVE_CHECK_EVERY = 1200
  const HIDDEN_ATTR = "data-nk-qa-hidden" // not on this page
  const COMPACT_ATTR = "data-nk-qa-compact" // list too narrow for names: avatars only (Quick.css)
  const COMPACT_BELOW = 350 // px list width
  const FLIP_DELAY = 450    // ms
  const FLIP_REPEAT = 700   // ms
  const ARROW_REACH = 8     // px

  let columns = NARROW_COLUMNS
  let container = null
  let observer = null
  let resizeObserver = null
  let pairs = null      // [{ tile, name }], null = rebuild
  let page = 0
  let shownFrom = -1    // first index on page
  let footer = null


  // Pairs

  // display: none is Steam's (we use attribute)
  function hiddenBySteam(tile) {
    if (tile.style.display === "none") return true
    if (tile.hasAttribute(HIDDEN_ATTR)) return false
    return getComputedStyle(tile).display === "none"
  }

  function collectPairs() {
    const result = []
    const children = [...container.children]
    children.forEach((el, i) => {
      if (!el.classList.contains("favoriteElement")) return
      const next = children[i + 1]
      const name = next?.classList.contains("playerNameQuickAccessContainer") ? next : null

      // Hidden by Steam
      if (hiddenBySteam(el)) {
        if (name) setHidden(name, true)
        return
      }
      result.push({ tile: el, name })
    })
    return result
  }

  // Write only on change
  function setStyle(el, property, value) {
    if (el.style[property] !== value) el.style[property] = value
  }

  function setHidden(el, hidden) {
    if (hidden !== el.hasAttribute(HIDDEN_ATTR)) el.toggleAttribute(HIDDEN_ATTR, hidden)
  }

  function hidePair({ tile, name }) {
    setHidden(tile, true)
    if (name) setHidden(name, true)
  }

  // Tiles rows 1 & 3, names 2 & 4
  function showPair({ tile, name }, idx) {
    const column = String(idx % columns + 1)
    const tileRow = Math.floor(idx / columns) * 2 + 1

    setHidden(tile, false)
    setStyle(tile, "gridColumn", column)
    setStyle(tile, "gridRow", String(tileRow))

    if (name) {
      setHidden(name, false)
      setStyle(name, "gridColumn", column)
      setStyle(name, "gridRow", String(tileRow + 1))
    }
  }


  // Spacers

  // Keep grid height on short pages
  function addSpacers() {
    ;[["avatar", 1], ["name", 2], ["avatar", 3], ["name", 4]].forEach(([kind, row]) => {
      const className = `nk-qa-row-spacer-row${row}`
      if (container.querySelector(`.${className}`)) return

      const spacer = document.createElement(kind === "name" ? "span" : "div")
      spacer.className = `nk-qa-row-spacer ${className}`
      spacer.dataset.nkKind = kind
      spacer.style.gridColumn = String(columns)
      spacer.style.gridRow = String(row)

      if (kind === "name") {
        spacer.classList.add("playerNameQuickAccessContainer")
        const text = document.createElement("span")
        text.className = "playerName"
        text.textContent = " "
        spacer.append(text)
      }
      container.append(spacer)
    })
  }

  // Pale cells of the empty block (shown by Quick.css only while there are no favorites)
  function addEmptyCells() {
    if (container.querySelector(".nk-qa-empty-cell")) return
    for (let i = 1; i <= WIDE_COLUMNS; i++) {
      const cell = document.createElement("div")
      cell.className = "nk-qa-empty-cell"
      cell.style.gridColumn = String(i)
      if (i > NARROW_COLUMNS) cell.dataset.nkWide = ""
      container.append(cell)
    }
  }


  // Layout

  // List width -> columns, tiles are placed again when it changes
  // (not the window width: with docked chats the list is only a column of the window)
  function applyLayout() {
    const width = container?.closest(".friendlist")?.clientWidth || window.innerWidth
    const next = width >= WIDE_FROM ? WIDE_COLUMNS : NARROW_COLUMNS
    const value = String(next)
    if (document.documentElement.dataset[COLUMNS_ATTR] !== value) document.documentElement.dataset[COLUMNS_ATTR] = value
    const compact = width < COMPACT_BELOW
    if (container && container.hasAttribute(COMPACT_ATTR) !== compact) container.toggleAttribute(COMPACT_ATTR, compact)
    if (!container || (next === columns && container.dataset[COLUMNS_ATTR] === value)) return

    columns = next
    container.dataset[COLUMNS_ATTR] = value
    for (const spacer of container.querySelectorAll(".nk-qa-row-spacer")) setStyle(spacer, "gridColumn", value)
    scheduleRebuild()
  }


  // Pages

  const pageCount = () => Math.max(1, Math.ceil(pairs.length / PAGE_SIZE))

  // Footer "< 1 / 3 >"
  function createFooter() {
    footer = document.createElement("div")
    footer.className = "nk-qa-footer"

    const arrow = (direction, text, label) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = `nk-qa-nav nk-qa-nav-${direction}`
      button.dataset.dir = direction
      button.textContent = text
      button.setAttribute("aria-label", label)
      return button
    }

    const indicator = document.createElement("span")
    indicator.className = "nk-qa-page-indicator"

    footer.append(arrow("prev", "‹", "Предыдущие друзья"), indicator, arrow("next", "›", "Следующие друзья"))
    footer.addEventListener("click", event => {
      const button = event.target.closest(".nk-qa-nav")
      if (!button || button.disabled) return
      turnPage(button.dataset.dir === "next" ? 1 : -1)
    })
    container.append(footer)
  }

  function updateFooter() {
    if (!footer?.isConnected) createFooter()
    const total = pageCount()
    const [prev, indicator, next] = footer.children

    indicator.textContent = `${page + 1} / ${total}`
    prev.disabled = page <= 0
    next.disabled = page >= total - 1

    // One page, no footer
    if (total <= 1) footer.dataset.hidden = "true"
    else delete footer.dataset.hidden
  }


  function turnPage(step) {
    page += step
    render()
  }

  // Page fade (Quick.css), short-lived attribute
  const FLIP_ANIMATION_MS = 250
  let flipAnimationTimer = null

  function playFlipAnimation() {
    if (!container) return
    clearTimeout(flipAnimationTimer)
    container.removeAttribute("data-nk-qa-flip")
    void container.offsetWidth // restart
    container.setAttribute("data-nk-qa-flip", "")
    flipAnimationTimer = setTimeout(() => container?.removeAttribute("data-nk-qa-flip"), FLIP_ANIMATION_MS)
  }


  // Drag

  // dragover coords (+ pointermove fallback)
  let dragging = null // null, "html" or "pointer"
  let draggedTile = null // show its page after drop
  let follow = null      // { tile, name, until }
  let armedArrow = null
  let flipTimer = null
  let pointerStart = null

  function startDrag(mode) {
    if (!container) return
    // HTML drag wins
    if (dragging && !(mode === "html" && dragging === "pointer")) return
    dragging = mode
    container.classList.add("nk-qa-dragging")
  }

  function stopDrag(mode) {
    if (!dragging || (mode && dragging !== mode)) return
    dragging = null
    disarm()
    container?.classList.remove("nk-qa-dragging")
    setDropOver(false)

    // Steam moves friend later
    if (draggedTile) {
      const name = draggedTile.nextElementSibling?.textContent.trim()
      follow = { tile: draggedTile, name, until: Date.now() + 1500 }
      draggedTile = null
      scheduleRebuild() // already moved
    }
  }

  // By element, else by name
  function followedIndex() {
    if (!follow || Date.now() > follow.until) return -1
    let index = pairs.findIndex(pair => pair.tile === follow.tile)
    if (index < 0 && follow.name) index = pairs.findIndex(pair => pair.name?.textContent.trim() === follow.name)
    return index
  }

  // Stronger highlight while the dragged friend is over the block (Quick.css)
  function setDropOver(over) {
    if (container && container.classList.contains("nk-qa-drop-over") !== over) container.classList.toggle("nk-qa-drop-over", over)
  }

  function arrowAt(x, y) {
    if (!footer?.isConnected || footer.dataset.hidden) return null
    for (const arrow of footer.querySelectorAll(".nk-qa-nav")) {
      if (arrow.disabled) continue
      const r = arrow.getBoundingClientRect()
      const inside = x >= r.left - ARROW_REACH && x <= r.right + ARROW_REACH
        && y >= r.top - ARROW_REACH && y <= r.bottom + ARROW_REACH
      if (inside) return arrow
    }
    return null
  }

  function arm(arrow) {
    armedArrow = arrow
    const step = arrow.dataset.dir === "next" ? 1 : -1

    const flip = () => {
      turnPage(step)
      // Edge
      if (!armedArrow || armedArrow.disabled) return disarm()
      flipTimer = setTimeout(flip, FLIP_REPEAT)
    }

    flipTimer = setTimeout(flip, FLIP_DELAY)
  }

  function disarm() {
    clearTimeout(flipTimer)
    flipTimer = null
    armedArrow = null
  }

  function onDragMove(x, y) {
    if (!dragging) return
    const arrow = arrowAt(x, y)
    if (arrow === armedArrow) return
    disarm()
    if (arrow) arm(arrow)
  }

  const isTile = target => target instanceof Element && !!target.closest(`${CONTAINER} .favoriteElement`)

  function listenForDrags() {
    // HTML drag
    document.addEventListener("dragstart", event => {
      if (!isTile(event.target)) return
      draggedTile = event.target.closest(".favoriteElement")
      startDrag("html")
    }, true)
    document.addEventListener("dragover", event => {
      setDropOver(event.target instanceof Element && !!event.target.closest(CONTAINER))
      onDragMove(event.clientX, event.clientY)
    }, true)
    // Drags from the list below never call startDrag, so the highlight is cleared here too
    const endHtmlDrag = () => {
      setDropOver(false)
      stopDrag("html")
    }
    document.addEventListener("dragend", endHtmlDrag, true)
    document.addEventListener("drop", () => setTimeout(endHtmlDrag), true)

    // Pointer drag
    document.addEventListener("pointerdown", event => {
      pointerStart = isTile(event.target) ? { x: event.clientX, y: event.clientY } : null
      if (pointerStart) draggedTile = event.target.closest(".favoriteElement")
    }, true)
    document.addEventListener("pointermove", event => {
      if (!pointerStart || !(event.buttons & 1)) return
      if (!dragging && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) startDrag("pointer")
      onDragMove(event.clientX, event.clientY)
    }, true)
    // pointercancel on HTML drag start
    const endPointer = () => {
      pointerStart = null
      stopDrag("pointer")
    }
    document.addEventListener("pointerup", endPointer, true)
    document.addEventListener("pointercancel", endPointer, true)
  }


  // Render

  function render() {
    if (!container?.isConnected) return

    const rebuilt = !pairs
    if (rebuilt) {
      pairs = collectPairs()
      keepParentsFromShrinking()

      // Open dropped friend's page
      const index = followedIndex()
      if (index >= 0) {
        page = Math.floor(index / PAGE_SIZE)
        follow = null
      }
    }

    // One row is enough: no empty second row under it (Quick.css)
    const rows = pairs.length <= columns ? "1" : "2"
    if (container.dataset.nkQaRows !== rows) container.dataset.nkQaRows = rows

    page = Math.min(Math.max(page, 0), pageCount() - 1)
    const from = page * PAGE_SIZE
    const to = Math.min(from + PAGE_SIZE, pairs.length)

    if (rebuilt) {
      // List changed
      pairs.forEach((pair, i) => (i >= from && i < to ? showPair(pair, i - from) : hidePair(pair)))
    } else if (from !== shownFrom) {
      // Paging
      if (shownFrom >= 0) pairs.slice(shownFrom, shownFrom + PAGE_SIZE).forEach(hidePair)
      pairs.slice(from, to).forEach((pair, i) => showPair(pair, i))
      // No animation while dragging
      if (shownFrom >= 0 && !dragging) playFlipAnimation()
    }
    shownFrom = from

    updateFooter()
  }

  // Unclip parents (not scroll area / header)
  function keepParentsFromShrinking() {
    let el = container.parentElement
    for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
      const overflow = getComputedStyle(el).overflowY
      if (overflow === "auto" || overflow === "scroll") break
      if (el.querySelector(".titleBarContainer")) break

      setImportant(el, "flex-shrink", "0")
      setImportant(el, "max-height", "none")
      setImportant(el, "overflow", "visible")
    }
  }

  // Write only on change
  function setImportant(el, property, value) {
    if (el.style.getPropertyValue(property) !== value) el.style.setProperty(property, value, "important")
  }


  // Start

  let frame = null
  function scheduleRebuild() {
    pairs = null
    frame ??= requestAnimationFrame(() => {
      frame = null
      render()
    })
  }

  function boot() {
    const found = document.querySelector(CONTAINER)
    if (!found) return setTimeout(boot, 300)

    container = found
    pairs = null
    page = 0
    shownFrom = -1
    footer = null

    addSpacers()
    addEmptyCells()
    applyLayout()
    const list = container.closest(".friendlist")
    if (list) {
      resizeObserver?.disconnect()
      resizeObserver = new ResizeObserver(applyLayout)
      resizeObserver.observe(list)
    }
    render()

    // Direct children + tile style/class
    observer = new MutationObserver(records => {
      const relevant = records.some(record => record.type === "childList"
        ? record.target === container
        : record.target.parentElement === container)
      if (relevant) scheduleRebuild()
    })
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] })
  }

  // Steam may recreate the block, check periodically
  setInterval(() => {
    if (!container || container.isConnected) return
    observer?.disconnect()
    container = null
    boot()
  }, ALIVE_CHECK_EVERY)

  // Fallback hide rule
  const style = document.createElement("style")
  style.id = "nk-qa-hidden-style"
  style.textContent = `${CONTAINER} > [${HIDDEN_ATTR}] { display: none !important; }`
  ;(document.head || document.documentElement).append(style)

  listenForDrags()
  addEventListener("resize", applyLayout)

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", boot, { once: true })
    : boot()
})()
