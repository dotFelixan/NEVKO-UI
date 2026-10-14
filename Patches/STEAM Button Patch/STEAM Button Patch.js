// STEAM menu: View, Friends, Games, Help as submenus at the top (their header buttons stay hidden)
// Taken from the header buttons themselves: Steam's own items, labels in any language

;(() => {
  "use strict"

  const ROOT_BUTTONS = "._2UyOBeiSdBayaFdRa39N2O"
  const STEAM_MENU = "Steam Root Menu"

  const shared = window.opener
  if (!shared?.webpackChunksteamui || shared.__nkSteamSubmenus) return

  // Webpack (SharedJSContext)

  function getRequire() {
    let req
    try { shared.webpackChunksteamui.push([[Symbol("nk-steam-menu")], {}, r => { req = r }]) } catch {}
    return req
  }

  function findExport(req, needle, test) {
    for (const [id, factory] of Object.entries(req.m)) {
      if (!factory.toString().includes(needle)) continue
      let exports
      try { exports = req(id) } catch { continue }
      for (const value of Object.values(exports || {})) if (typeof value === "function" && test(value)) return value
    }
    return null
  }

  const hasMethods = (...names) => value => {
    const own = value.prototype ? Object.getOwnPropertyNames(value.prototype) : []
    return names.every(name => own.includes(name))
  }

  // Header Buttons -> their menus

  function fiberOf(el) {
    const key = Object.keys(el).find(k => k.startsWith("__reactFiber"))
    return key && el[key]
  }

  function rootMenus(doc) {
    const menus = []
    for (const el of doc.querySelectorAll(ROOT_BUTTONS)) {
      for (let fiber = fiberOf(el), depth = 0; fiber && depth < 6; fiber = fiber.return, depth++) {
        const props = fiber.memoizedProps
        if (typeof props?.title !== "string" || !props.title.endsWith(" Root Menu")) continue
        if (props.title !== STEAM_MENU && (props.menuContent || props.menuItems?.length)) {
          const label = typeof props.children === "string" ? props.children : el.textContent.trim()
          menus.push({ ...props, label })
        }
        break
      }
    }
    return menus
  }

  function patch() {
    const React = shared.SP_REACT
    const req = getRequire()
    if (!React || !req?.m) return

    const Manager = findExport(req, "CreateContextMenuInstance", hasMethods("CreateContextMenuInstance", "ShowMenu"))
    // Exported wrapper of the submenu item class: e => <SubMenuItem {...e} bInGamepadUI={...}/>
    const SubMenu = findExport(req, "RenderSubMenu", value => !value.prototype && value.toString().includes("bInGamepadUI:"))
    // Steam's list renderer for menuItems arrays (Games, Help)
    const MenuItems = findExport(req, "bSuperNavBehavior", value => {
      const source = value.toString()
      return source.includes("menuItems") && source.includes("disabledItemClass")
        && !source.includes("refContextMenu") && !source.includes("bSuperNavBehavior")
    })
    if (!Manager || !SubMenu || !MenuItems) return

    const h = React.createElement

    // Header buttons may mount after the Steam menu: retry a few times
    function Submenus({ doc, children }) {
      const [, refresh] = React.useReducer(n => n + 1, 0)
      const tries = React.useRef(0)
      const menus = rootMenus(doc)
      React.useEffect(() => {
        if (menus.length || tries.current++ > 20) return
        const timer = setTimeout(refresh, 500)
        return () => clearTimeout(timer)
      })

      // Steam menu content is <Component/> returning <MenuItems menuItems=[...]/>: render it here to split its list
      // (called on every render, so its hooks stay in order)
      // (Millennium changes it to a fragment of ready items + its own: split those then)
      let list = null
      let output = null
      const content = React.isValidElement(children) ? children : null
      if (typeof content?.type === "function" && !content.type.prototype?.render) {
        output = content.type(content.props)
        if (Array.isArray(output?.props?.menuItems)) list = output
      }
      const original = output || children
      if (!menus.length) return original

      const separator = h(MenuItems, { key: "nk-separator", menuItems: [{ name: "NkSeparator" }] })
      const submenus = [
        ...menus.map(menu => h(SubMenu, { key: menu.title, label: menu.label },
          menu.menuContent || h(MenuItems, { menuItems: menu.menuItems, disabledItemClass: menu.disabledItemClass }))),
        separator,
      ]
      // Above Settings, else at the end
      if (!list && output?.props?.children) {
        const nodes = React.Children.toArray(output.props.children)
        const at = nodes.findIndex(node => node?.props?.name === "#Menu_Settings")
        if (at >= 0) return h(React.Fragment, null, ...nodes.slice(0, at), ...submenus, ...nodes.slice(at))
      }
      const items = list?.props.menuItems || []
      const settings = items.findIndex(item => item?.name === "#Menu_Settings")
      if (settings < 0) return h(React.Fragment, null, original, separator, ...submenus.slice(0, -1))
      return h(React.Fragment, null,
        h(list.type, { ...list.props, key: "nk-before", menuItems: items.slice(0, settings) }),
        ...submenus,
        h(list.type, { ...list.props, key: "nk-after", menuItems: items.slice(settings) }))
    }

    const wrap = (element, doc) => element.props.children?.type === Submenus ? element
      : React.cloneElement(element, { children: h(Submenus, { doc }, element.props.children) })

    const create = Manager.prototype.CreateContextMenuInstance
    Manager.prototype.CreateContextMenuInstance = function (element, target, x, y, options, ...rest) {
      try {
        const doc = target?.ownerDocument
        if (options?.title === STEAM_MENU && doc && React.isValidElement(element)) element = wrap(element, doc)
      } catch {}
      return create.call(this, element, target, x, y, options, ...rest)
    }

    // Menu created before this script (Steam creates it hidden when the header mounts): wrap on show
    const showMenu = Manager.prototype.ShowMenu
    Manager.prototype.ShowMenu = function (instance, ...rest) {
      try {
        const doc = instance.m_position?.element?.ownerDocument
        if (instance.m_options?.title === STEAM_MENU && doc && React.isValidElement(instance.m_rctElement)) {
          instance.m_rctElement = wrap(instance.m_rctElement, doc)
        }
      } catch {}
      return showMenu.call(this, instance, ...rest)
    }

    shared.__nkSteamSubmenus = true
  }

  try { patch() } catch {}
})()
