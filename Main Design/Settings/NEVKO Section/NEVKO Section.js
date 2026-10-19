// Steam Settings: own section "NEVKO" at the top of the list of sections, a divider under it
// Its page: the logo, links (GitHub, Boosty, Info) and how far the redesign has got.
// Info opens a small window with a note from the author
// Styles: NEVKO Section.css

;(() => {
  "use strict"

  const LIST = ".SettingsModal .PagedSettingsDialog_PageList"
  const ITEM = ".PagedSettingsDialog_PageListItem"
  const COLUMN = ".SettingsModal .PagedSettingDialog_ContentColumn"
  const ITEM_ID = "nk-nevko-item"
  const DIVIDER_ID = "nk-nevko-divider"
  const PAGE_ID = "nk-nevko-page"
  const INFO_ID = "nk-nevko-info"
  const OPEN_ATTR = "data-nk-nevko-open" // on <html>: our page is shown, Steam's own is hidden
  const TITLE = "NEVKO"

  const GITHUB_URL = "https://github.com/dotFelixan/NEVKO-UI"
  const BOOSTY_URL = "https://boosty.to/dotfelixan"
  const DISCORD_URL = "https://discord.gg/UuAQWZ9HxE"

  // The logo of the theme (the head of a cat), in the color of the text around it
  const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><path d="M6.5 7.3C6.9 6 8.6 5.2 9.9 6.3L12.8 8.8C13.9 9.7 15.2 10.2 16.5 10.2H19.8C21.2 10.2 22.5 9.6 23.5 8.4L25.8 6.2C27 5.2 28.5 5.9 28.9 7.3C30.9 12.6 32 18.1 32 23.6C32 27.4 29.1 30.4 25.6 30.4H10.8C6.9 30.4 4 27.4 4 23.6C4 18.1 4.9 12.6 6.5 7.3Z" fill="currentColor"/></svg>'


  // Texts

  // Russian for a Russian client, English for the rest
  const RU = (document.documentElement.lang || "").toLowerCase().startsWith("ru")
  const text = (russian, english) => (RU ? russian : english)

  // How far the redesign has got. value: percent done; state: "progress" (being made) or "none" (not started)
  const PROGRESS = [
    { name: "Header", value: 80 },
    { name: "Friends & Chats", value: 80 },
    { name: "Library", state: "progress" },
    { name: text("Остальное", "Everything else"), state: "none" },
  ]
  const STATE_TEXT = {
    progress: text("В работе", "In progress"),
    none: text("Не начато", "Not started"),
  }

  // A note from the author (the Info window). [[Discord]] and [[GitHub]] become links
  const NOTE = text(
    "Эту тему я делаю давно и не раз её забрасывал: одному тяжело, мотивация уходила, а кодера рядом не было. Потом я всё-таки решил использовать Claude, и теперь есть силы развивать проект дальше, в том направлении, в котором я хотел с самого начала. CSS по-прежнему пишу я, Claude его правит и пишет все скрипты. Перед каждым обновлением я всё проверяю, но баги всё равно могут присутствовать. О любом баге можно написать на [[Discord]]-сервере или на [[GitHub]].",
    "I have been making this theme for a long time and dropped it more than once: it is hard alone, the motivation ran out, and there was no coder around. Then I decided to use Claude after all, and now I have the energy to take the project further, in the direction I wanted from the very start. I still write the CSS, Claude fixes it and writes all of the scripts. I check everything before each update, but there may still be bugs. You can report any bug on the [[Discord]] server or on [[GitHub]].",
  )
  const NOTE_LINKS = { Discord: DISCORD_URL, GitHub: GITHUB_URL }


  // Helpers

  const root = document.documentElement
  const isOpen = () => root.hasAttribute(OPEN_ATTR)

  function make(tag, className, content) {
    const el = document.createElement(tag)
    if (className) el.className = className
    if (content) el.textContent = content
    return el
  }

  function openUrl(url) {
    try {
      if (window.SteamClient?.System?.OpenInSystemBrowser) return SteamClient.System.OpenInSystemBrowser(url)
    } catch { /* the usual way then */ }
    window.open(url, "_blank")
  }


  // List Item

  // Steam's classes are hashed and change with updates: ours are copied from what is in the window now
  const activeOnly = new Set() // classes only the selected item has
  const plainClass = el => [...el.classList].filter(name => name !== "Active" && !activeOnly.has(name)).join(" ")

  function learnActive(list) {
    const active = list.querySelector(`${ITEM}.Active:not(#${ITEM_ID})`)
    const other = list.querySelector(`${ITEM}:not(.Active):not(#${ITEM_ID})`)
    if (!active || !other) return
    for (const name of active.classList) if (!other.classList.contains(name)) activeOnly.add(name)
  }

  function buildItem(list) {
    const sample = list.querySelector(`${ITEM}:not(#${ITEM_ID})`)
    if (!sample) return null
    const item = make("div", plainClass(sample))
    item.id = ITEM_ID
    item.setAttribute("role", "tab")
    const icon = make("div", sample.firstElementChild?.className || "PageListItem_Icon")
    icon.innerHTML = LOGO
    item.append(icon, make("div", sample.lastElementChild?.className || "PageListItem_Title", TITLE))
    item.addEventListener("click", () => setOpen(true))
    return item
  }

  function buildDivider(list) {
    const divider = make("div", list.querySelector(".PageListSeparator")?.className || "PageListSeparator")
    divider.id = DIVIDER_ID
    return divider
  }


  // Page

  // Steam's own button (the look of the buttons in the settings around)
  const STEAM_BUTTON = "nk-nevko-button DialogButton _DialogLayout Secondary Focusable"

  function buildHero() {
    const hero = make("div", "nk-nevko-hero")
    const logo = make("div", "nk-nevko-logo")
    logo.innerHTML = LOGO
    const buttons = make("div", "nk-nevko-buttons")
    const button = (label, run) => {
      const el = make("button", STEAM_BUTTON, label)
      el.type = "button"
      el.addEventListener("click", run)
      return el
    }
    buttons.append(
      button("GitHub", () => openUrl(GITHUB_URL)),
      button("Boosty", () => openUrl(BOOSTY_URL)),
      button("Info", openInfo),
    )
    hero.append(logo, buttons)
    return hero
  }

  function buildProgress() {
    const box = make("div", "nk-nevko-progress")
    box.append(make("div", "nk-nevko-heading", text("Прогресс редизайна", "Redesign progress")))
    for (const { name, value, state } of PROGRESS) {
      const row = make("div", "nk-nevko-row")
      if (state) row.dataset.nkState = state
      const line = make("div", "nk-nevko-row-line")
      line.append(make("span", "nk-nevko-row-name", name), make("span", "nk-nevko-row-value", state ? STATE_TEXT[state] : `~${value}%`))
      const bar = make("div", "nk-nevko-bar")
      const fill = make("div", "nk-nevko-bar-fill")
      if (!state) fill.style.width = `${Math.max(0, Math.min(value, 100))}%`
      bar.append(fill)
      row.append(line, bar)
      box.append(row)
    }
    return box
  }

  function buildNote() {
    const note = make("div", "nk-nevko-note")
    for (const piece of NOTE.split(/(\[\[[^\]]+\]\])/)) {
      const name = piece.match(/^\[\[([^\]]+)\]\]$/)?.[1]
      if (!name) {
        note.append(piece)
        continue
      }
      const link = make("span", "nk-nevko-link", name)
      link.setAttribute("role", "link")
      link.addEventListener("click", () => openUrl(NOTE_LINKS[name]))
      note.append(link)
    }
    return note
  }

  // The same boxes as a page of Steam (header, body), so it looks and scrolls the same
  function buildPage(column) {
    const steamPage = column.querySelector(`:scope > .DialogContent:not(#${PAGE_ID})`)
    const page = make("div", steamPage?.className || "DialogContent _DialogLayout PagedSettingsDialog_PageContent")
    page.id = PAGE_ID
    const inner = make("div", "DialogContent_InnerWidth")
    const body = make("div", steamPage?.querySelector(".DialogBody")?.className || "DialogBody")
    body.append(buildHero(), buildProgress())
    inner.append(make("div", "DialogHeader", TITLE), body)
    page.append(inner)
    return page
  }


  // Info Window

  function closeInfo() {
    document.getElementById(INFO_ID)?.remove()
  }

  // Built as a dialog of Steam: a header, the text, a button at the bottom right
  function openInfo() {
    closeInfo()
    const overlay = make("div")
    overlay.id = INFO_ID
    overlay.addEventListener("mousedown", event => {
      if (event.target === overlay) closeInfo() // a click past the window
    })
    const box = make("div", "nk-nevko-info-window")
    const buttons = make("div", "nk-nevko-info-buttons")
    const close = make("button", STEAM_BUTTON, text("Закрыть", "Close"))
    close.type = "button"
    close.addEventListener("click", closeInfo)
    buttons.append(close)
    box.append(make("div", "nk-nevko-info-title", text("О теме", "About the theme")), buildNote(), buttons)
    overlay.append(box)
    document.body.append(overlay)
  }


  // State

  function setOpen(open) {
    if (isOpen() !== open) root.toggleAttribute(OPEN_ATTR, open)
    if (!open) closeInfo()
    update()
  }

  function update() {
    const list = document.querySelector(LIST)
    if (!list) {
      // The window of the settings is closed
      if (isOpen()) root.removeAttribute(OPEN_ATTR)
      closeInfo()
      return
    }
    learnActive(list)

    // Put at the end of Steam's list (React keeps its own children in order and does not meet ours on the way);
    // shown first by their order (NEVKO Section.css)
    let item = document.getElementById(ITEM_ID)
    if (item?.parentElement !== list) {
      item?.remove()
      document.getElementById(DIVIDER_ID)?.remove()
      item = buildItem(list)
      if (!item) return
      list.append(item, buildDivider(list))
    }
    for (const name of ["Active", ...activeOnly]) {
      if (item.classList.contains(name) !== isOpen()) item.classList.toggle(name, isOpen())
    }
    item.setAttribute("aria-selected", String(isOpen()))

    const column = document.querySelector(COLUMN)
    const page = document.getElementById(PAGE_ID)
    if (!isOpen() || !column) return page?.remove()
    if (page?.parentElement !== column) {
      page?.remove()
      column.append(buildPage(column))
    }
  }

  // A section of Steam is chosen: back to Steam's pages (also the one that was selected under our page -
  // Steam does nothing on a click on it, its page is simply shown again)
  document.addEventListener("click", event => {
    if (!isOpen() || !(event.target instanceof Element)) return
    if (event.target.closest(`${LIST} ${ITEM}:not(#${ITEM_ID})`)) setOpen(false)
  }, true)
  addEventListener("keydown", event => {
    if (event.key === "Escape" && document.getElementById(INFO_ID)) {
      event.stopPropagation() // closes our window, not the settings
      closeInfo()
    }
  }, true)

  let queued = false
  new MutationObserver(() => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => { queued = false; update() })
  }).observe(document.documentElement, { childList: true, subtree: true })

  update()
})()
