;(function settingsPreloader() {
  "use strict"

  // Открывает настройки при каждом запуске Steam через window.location.href
  // (window.open со steam:// возвращает null — Steam его блокирует).
  // Закрывает окно настроек через SteamClient.Window.Close() после задержки —
  // DRS Script успевает перейти на вкладку, кликнуть тоггл и скрыть строки.
  //
  // Подключать с: "MatchRegexString": "^Steam$"

  const OPEN_DELAY = 3000   // ждём 3 сек после загрузки Steam

  function openSettings() {
    // проверяем что DRS Script загружен — если нет, не открываем настройки
    if (!window.__nk_drs_ready) return

    // пишем токен прямо перед открытием — DRS прочитает его внутри initInterval
    // (когда появятся кнопки меню), к тому моменту токен уже точно будет записан
    try { localStorage.setItem("nk_drs_token", "1") } catch (_) {}
    window.location.href = "steam://open/settings"
  }

  if (document.readyState === "complete") {
    setTimeout(openSettings, OPEN_DELAY)
  } else {
    window.addEventListener("load", () => setTimeout(openSettings, OPEN_DELAY))
  }

})()
