// GIF tab of the emoticon menu of the message field, to the right of the stickers (styles: Gif Picker.css)
// Search of Giphy or Klipy (option "GIF Source"), each with the user's own API key, typed in the tab itself.
// Three sections under the list: the service (trending, search), Favorites, History - History also keeps the GIFs uploaded
// from the computer (by the button there, or by Steam's own attach / drop of a .gif). Rows of one height (as Giphy).
// A GIF is sent as a file through Steam's own upload of the chat: everybody sees it, animated, from Steam

;(() => {
  "use strict"

  const PICKER = ".contextMenu:not([data-nk-ghost]) .Picker[data-nk-entry='1']" // the mark: Emoji Pack.js
  const TAB_CLASS = "nk-gif-tab"
  const PANE_ID = "nk-gif-pane"
  const OPEN_ATTR = "data-nk-gif-open"
  const OPEN_KEY = "nevko-gif-open"
  const SECTION_KEY = "nevko-gif-section"
  const SENT_KEY = "nevko-gif-sent"
  const FAVORITES_KEY = "nevko-gif-favorites"
  const API_KEY = source => `nevko-gif-key-${source}`
  const CUSTOMER_KEY = "nevko-gif-customer" // Klipy asks for an id of the user
  const LIST_MAX = 100
  const PAGE = 30
  const ROW_HEIGHT = 96
  const GAP = 4
  const SEARCH_DELAY = 400
  const MORE_AT = 300 // px before the end of the list: the next page is asked for


  // Texts, in the languages of Steam. One row per language, in the order of KEYS; others get English. %s: the service
  const KEYS = [
    "Search %s", "Favorites", "History", "Enter your %s API key", "API key", "Save", "How to get a key",
    "This key does not work", "Nothing found", "No favorites yet", "History is empty", "Upload GIF",
    "Could not load GIFs", "Add to favorites", "Remove from favorites",
  ]
  const TEXTS = {
    ru: ["Поиск в %s", "Избранное", "История", "Введите свой API-ключ %s", "API-ключ", "Сохранить", "Как получить ключ", "Этот ключ не работает", "Ничего не найдено", "В избранном пока пусто", "История пуста", "Загрузить GIF", "Не удалось загрузить GIF", "В избранное", "Убрать из избранного"],
    uk: ["Пошук у %s", "Обране", "Історія", "Введіть свій API-ключ %s", "API-ключ", "Зберегти", "Як отримати ключ", "Цей ключ не працює", "Нічого не знайдено", "В обраному поки порожньо", "Історія порожня", "Завантажити GIF", "Не вдалося завантажити GIF", "До обраного", "Прибрати з обраного"],
    bg: ["Търсене в %s", "Любими", "История", "Въведете своя API ключ за %s", "API ключ", "Запазване", "Как да получите ключ", "Този ключ не работи", "Нищо не е намерено", "Още няма любими", "Историята е празна", "Качване на GIF", "GIF не можаха да се заредят", "Към любими", "Премахване от любими"],
    de: ["%s durchsuchen", "Favoriten", "Verlauf", "Gib deinen API-Schlüssel für %s ein", "API-Schlüssel", "Speichern", "Wie bekomme ich einen Schlüssel", "Dieser Schlüssel funktioniert nicht", "Nichts gefunden", "Noch keine Favoriten", "Der Verlauf ist leer", "GIF hochladen", "GIFs konnten nicht geladen werden", "Zu Favoriten", "Aus Favoriten entfernen"],
    fr: ["Rechercher sur %s", "Favoris", "Historique", "Saisissez votre clé API %s", "Clé API", "Enregistrer", "Comment obtenir une clé", "Cette clé ne fonctionne pas", "Aucun résultat", "Aucun favori pour l'instant", "L'historique est vide", "Importer un GIF", "Impossible de charger les GIF", "Ajouter aux favoris", "Retirer des favoris"],
    es: ["Buscar en %s", "Favoritos", "Historial", "Introduce tu clave API de %s", "Clave API", "Guardar", "Cómo obtener una clave", "Esta clave no funciona", "No se ha encontrado nada", "Aún no hay favoritos", "El historial está vacío", "Subir GIF", "No se pudieron cargar los GIF", "Añadir a favoritos", "Quitar de favoritos"],
    pt: ["Pesquisar no %s", "Favoritos", "Histórico", "Introduz a tua chave API do %s", "Chave API", "Guardar", "Como obter uma chave", "Esta chave não funciona", "Nada encontrado", "Ainda não há favoritos", "O histórico está vazio", "Carregar GIF", "Não foi possível carregar os GIF", "Adicionar aos favoritos", "Remover dos favoritos"],
    "pt-br": ["Pesquisar no %s", "Favoritos", "Histórico", "Digite sua chave de API do %s", "Chave de API", "Salvar", "Como conseguir uma chave", "Esta chave não funciona", "Nada encontrado", "Ainda não há favoritos", "O histórico está vazio", "Enviar GIF", "Não foi possível carregar os GIFs", "Adicionar aos favoritos", "Remover dos favoritos"],
    it: ["Cerca su %s", "Preferiti", "Cronologia", "Inserisci la tua chiave API di %s", "Chiave API", "Salva", "Come ottenere una chiave", "Questa chiave non funziona", "Nessun risultato", "Ancora nessun preferito", "La cronologia è vuota", "Carica GIF", "Impossibile caricare le GIF", "Aggiungi ai preferiti", "Rimuovi dai preferiti"],
    nl: ["Zoeken op %s", "Favorieten", "Geschiedenis", "Voer je API-sleutel van %s in", "API-sleutel", "Opslaan", "Hoe krijg ik een sleutel", "Deze sleutel werkt niet", "Niets gevonden", "Nog geen favorieten", "De geschiedenis is leeg", "GIF uploaden", "GIF's konden niet worden geladen", "Toevoegen aan favorieten", "Verwijderen uit favorieten"],
    pl: ["Szukaj w %s", "Ulubione", "Historia", "Wpisz swój klucz API %s", "Klucz API", "Zapisz", "Jak zdobyć klucz", "Ten klucz nie działa", "Nic nie znaleziono", "Brak ulubionych", "Historia jest pusta", "Prześlij GIF", "Nie udało się wczytać GIF-ów", "Dodaj do ulubionych", "Usuń z ulubionych"],
    cs: ["Hledat na %s", "Oblíbené", "Historie", "Zadejte svůj API klíč pro %s", "API klíč", "Uložit", "Jak získat klíč", "Tento klíč nefunguje", "Nic nenalezeno", "Zatím žádné oblíbené", "Historie je prázdná", "Nahrát GIF", "GIFy se nepodařilo načíst", "Přidat do oblíbených", "Odebrat z oblíbených"],
    hu: ["Keresés: %s", "Kedvencek", "Előzmények", "Add meg a(z) %s API-kulcsodat", "API-kulcs", "Mentés", "Hogyan kapok kulcsot", "Ez a kulcs nem működik", "Nincs találat", "Még nincsenek kedvencek", "Az előzmények üresek", "GIF feltöltése", "Nem sikerült betölteni a GIF-eket", "Kedvencekhez", "Eltávolítás a kedvencekből"],
    ro: ["Caută pe %s", "Favorite", "Istoric", "Introdu cheia ta API %s", "Cheie API", "Salvează", "Cum obții o cheie", "Această cheie nu funcționează", "Nu s-a găsit nimic", "Încă nu ai favorite", "Istoricul este gol", "Încarcă GIF", "GIF-urile nu au putut fi încărcate", "Adaugă la favorite", "Elimină din favorite"],
    el: ["Αναζήτηση στο %s", "Αγαπημένα", "Ιστορικό", "Εισαγάγετε το κλειδί API του %s", "Κλειδί API", "Αποθήκευση", "Πώς να πάρετε κλειδί", "Αυτό το κλειδί δεν λειτουργεί", "Δεν βρέθηκε τίποτα", "Δεν υπάρχουν αγαπημένα ακόμη", "Το ιστορικό είναι κενό", "Μεταφόρτωση GIF", "Δεν ήταν δυνατή η φόρτωση των GIF", "Στα αγαπημένα", "Αφαίρεση από τα αγαπημένα"],
    da: ["Søg på %s", "Favoritter", "Historik", "Indtast din API-nøgle til %s", "API-nøgle", "Gem", "Sådan får du en nøgle", "Denne nøgle virker ikke", "Intet fundet", "Ingen favoritter endnu", "Historikken er tom", "Upload GIF", "GIF'er kunne ikke indlæses", "Føj til favoritter", "Fjern fra favoritter"],
    sv: ["Sök på %s", "Favoriter", "Historik", "Ange din API-nyckel för %s", "API-nyckel", "Spara", "Hur får jag en nyckel", "Den här nyckeln fungerar inte", "Inget hittades", "Inga favoriter än", "Historiken är tom", "Ladda upp GIF", "Det gick inte att läsa in GIF:ar", "Lägg till i favoriter", "Ta bort från favoriter"],
    no: ["Søk på %s", "Favoritter", "Historikk", "Skriv inn API-nøkkelen din for %s", "API-nøkkel", "Lagre", "Slik får du en nøkkel", "Denne nøkkelen fungerer ikke", "Ingenting funnet", "Ingen favoritter ennå", "Historikken er tom", "Last opp GIF", "Kunne ikke laste inn GIF-er", "Legg til i favoritter", "Fjern fra favoritter"],
    fi: ["Hae palvelusta %s", "Suosikit", "Historia", "Anna oma %s-API-avaimesi", "API-avain", "Tallenna", "Miten saan avaimen", "Tämä avain ei toimi", "Mitään ei löytynyt", "Ei vielä suosikkeja", "Historia on tyhjä", "Lataa GIF", "GIF-kuvia ei voitu ladata", "Lisää suosikkeihin", "Poista suosikeista"],
    tr: ["%s içinde ara", "Favoriler", "Geçmiş", "%s API anahtarını gir", "API anahtarı", "Kaydet", "Anahtar nasıl alınır", "Bu anahtar çalışmıyor", "Hiçbir şey bulunamadı", "Henüz favori yok", "Geçmiş boş", "GIF yükle", "GIF'ler yüklenemedi", "Favorilere ekle", "Favorilerden çıkar"],
    ar: ["البحث في %s", "المفضلة", "السجل", "أدخل مفتاح API الخاص بك لـ %s", "مفتاح API", "حفظ", "كيف أحصل على مفتاح", "هذا المفتاح لا يعمل", "لم يتم العثور على شيء", "لا توجد مفضلة بعد", "السجل فارغ", "رفع GIF", "تعذّر تحميل صور GIF", "إضافة إلى المفضلة", "إزالة من المفضلة"],
    ja: ["%s で検索", "お気に入り", "履歴", "%s の API キーを入力してください", "API キー", "保存", "キーの入手方法", "このキーは使用できません", "見つかりませんでした", "お気に入りはまだありません", "履歴はありません", "GIF をアップロード", "GIF を読み込めませんでした", "お気に入りに追加", "お気に入りから削除"],
    ko: ["%s에서 검색", "즐겨찾기", "기록", "%s API 키를 입력하세요", "API 키", "저장", "키 받는 방법", "이 키는 작동하지 않습니다", "찾은 항목이 없습니다", "아직 즐겨찾기가 없습니다", "기록이 없습니다", "GIF 업로드", "GIF를 불러오지 못했습니다", "즐겨찾기에 추가", "즐겨찾기에서 제거"],
    "zh-cn": ["在 %s 中搜索", "收藏", "历史记录", "输入你的 %s API 密钥", "API 密钥", "保存", "如何获取密钥", "此密钥无效", "未找到任何内容", "还没有收藏", "暂无历史记录", "上传 GIF", "无法加载 GIF", "加入收藏", "取消收藏"],
    "zh-tw": ["在 %s 中搜尋", "我的最愛", "歷史紀錄", "輸入你的 %s API 金鑰", "API 金鑰", "儲存", "如何取得金鑰", "此金鑰無效", "找不到任何內容", "還沒有我的最愛", "尚無歷史紀錄", "上傳 GIF", "無法載入 GIF", "加入我的最愛", "從我的最愛移除"],
    th: ["ค้นหาใน %s", "รายการโปรด", "ประวัติ", "ใส่คีย์ API ของ %s ของคุณ", "คีย์ API", "บันทึก", "วิธีรับคีย์", "คีย์นี้ใช้ไม่ได้", "ไม่พบสิ่งใด", "ยังไม่มีรายการโปรด", "ยังไม่มีประวัติ", "อัปโหลด GIF", "โหลด GIF ไม่สำเร็จ", "เพิ่มในรายการโปรด", "นำออกจากรายการโปรด"],
    vi: ["Tìm trên %s", "Yêu thích", "Lịch sử", "Nhập khóa API %s của bạn", "Khóa API", "Lưu", "Cách lấy khóa", "Khóa này không hoạt động", "Không tìm thấy gì", "Chưa có mục yêu thích", "Lịch sử trống", "Tải lên GIF", "Không thể tải GIF", "Thêm vào yêu thích", "Bỏ khỏi yêu thích"],
    id: ["Cari di %s", "Favorit", "Riwayat", "Masukkan kunci API %s milikmu", "Kunci API", "Simpan", "Cara mendapatkan kunci", "Kunci ini tidak berfungsi", "Tidak ditemukan apa pun", "Belum ada favorit", "Riwayat kosong", "Unggah GIF", "Gagal memuat GIF", "Tambahkan ke favorit", "Hapus dari favorit"],
  }
  // Steam names its language in the page: "ru", "pt-BR", "zh-CN"...
  function texts() {
    const lang = (document.documentElement.lang || "en").toLowerCase()
    const zh = lang.startsWith("zh") && (/tw|hk|hant/.test(lang) ? "zh-tw" : "zh-cn")
    return TEXTS[lang] || TEXTS[zh] || TEXTS[lang.split("-")[0]] || TEXTS[{ nb: "no", nn: "no" }[lang]] || null
  }
  const say = (english, name = "") => (texts()?.[KEYS.indexOf(english)] || english).replace("%s", name)


  // Services

  const source = () => getComputedStyle(document.documentElement).getPropertyValue("--nk-gif-source").trim() === "klipy" ? "klipy" : "giphy"

  function customerId() {
    let id = localStorage.getItem(CUSTOMER_KEY)
    if (!id) {
      id = crypto.randomUUID?.() || String(Math.random()).slice(2)
      localStorage.setItem(CUSTOMER_KEY, id)
    }
    return id
  }

  class BadKey extends Error {}

  async function getJson(url) {
    const response = await fetch(url)
    if (response.status === 401 || response.status === 403) throw new BadKey()
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (data?.result === false) throw new BadKey() // Klipy says it so
    return data
  }

  // page(key, query, cursor) -> { items: [{ id, preview, url, w, h }], next }: the cursor of the next page or null
  const SOURCES = {
    giphy: {
      name: "GIPHY",
      keyUrl: "https://developers.giphy.com/dashboard/",
      async page(key, query, cursor) {
        const offset = cursor || 0
        const params = new URLSearchParams({ api_key: key, limit: PAGE, offset, rating: "pg-13" })
        if (query) params.set("q", query)
        if (query && document.documentElement.lang) params.set("lang", document.documentElement.lang.split("-")[0])
        const data = await getJson(`https://api.giphy.com/v1/gifs/${query ? "search" : "trending"}?${params}`)
        const items = (data.data || []).map(result => {
          const images = result.images || {}
          const small = images.fixed_height_small || images.fixed_height || images.downsized
          const full = images.downsized || images.fixed_height || images.original || small
          if (!small?.url || !full?.url) return null
          return { id: `giphy:${result.id}`, preview: small.url, url: full.url, w: Number(small.width) || 1, h: Number(small.height) || 1 }
        }).filter(Boolean)
        const paging = data.pagination || {}
        const next = offset + (paging.count || items.length)
        return { items, next: items.length && next < (paging.total_count ?? Infinity) ? next : null }
      },
    },
    klipy: {
      name: "KLIPY",
      keyUrl: "https://partner.klipy.com",
      async page(key, query, cursor) {
        const page = cursor || 1
        const params = new URLSearchParams({ page, per_page: PAGE, customer_id: customerId() })
        if (query) params.set("q", query)
        const data = await getJson(`https://api.klipy.com/api/v1/${encodeURIComponent(key)}/gifs/${query ? "search" : "trending"}?${params}`)
        const body = data.data || {}
        const items = (body.data || []).map(result => {
          const file = result.file || {}
          const small = file.sm?.gif || file.xs?.gif || file.md?.gif
          const full = file.md?.gif || file.hd?.gif || small
          if (!small?.url || !full?.url) return null // ads and others without a file
          return { id: `klipy:${result.id ?? result.slug}`, preview: small.url, url: full.url, w: small.width || 1, h: small.height || 1 }
        }).filter(Boolean)
        return { items, next: body.has_next ? page + 1 : null }
      },
    },
  }


  // Favorites, Sent

  function readList(key) {
    try {
      const list = JSON.parse(localStorage.getItem(key) || "[]")
      return Array.isArray(list) ? list.filter(item => item?.id) : []
    } catch {
      return []
    }
  }
  function writeList(key, list) {
    const before = readList(key)
    try { localStorage.setItem(key, JSON.stringify(list.slice(0, LIST_MAX))) } catch { /* no room */ }
    forgetFiles(before)
  }
  const addTo = (key, item) => writeList(key, [item, ...readList(key).filter(other => other.id !== item.id)])
  const isFavorite = id => readList(FAVORITES_KEY).some(item => item.id === id)
  function toggleFavorite(item) {
    const list = readList(FAVORITES_KEY)
    writeList(FAVORITES_KEY, list.some(other => other.id === item.id) ? list.filter(other => other.id !== item.id) : [item, ...list])
  }

  // Uploaded GIFs themselves: files of the theme in Cache/GIFs, by the id of their item
  const GIF_FOLDER = "Cache/GIFs"
  const diskName = id => `${id.replace(/\W+/g, "-")}.gif`
  const themeFiles = () => window.__nevkoThemeFiles

  // Before the folder they were in the storage of this page (IndexedDB)
  let database = null
  function files() {
    database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open("nevko-gifs", 1)
      request.onupgradeneeded = () => request.result.createObjectStore("files")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return database
  }
  async function fileRequest(mode, work) {
    const store = (await files()).transaction("files", mode).objectStore("files")
    return new Promise((resolve, reject) => {
      const request = work(store)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  async function putFile(id, blob) {
    const disk = themeFiles()
    if (!disk) throw new Error("no theme files")
    await disk.write(`${GIF_FOLDER}/${diskName(id)}`, await blob.arrayBuffer())
  }
  async function getFile(id) {
    const disk = themeFiles()
    const response = disk && await fetch(disk.fileUrl(GIF_FOLDER, diskName(id))).catch(() => null)
    if (response?.ok) return response.blob()
    // Old place: moved into the folder
    const old = await fileRequest("readonly", store => store.get(id)).catch(() => null)
    if (old && disk) {
      try {
        await putFile(id, old)
        await fileRequest("readwrite", store => store.delete(id))
      } catch { /* stays where it is */ }
    }
    return old || null
  }
  setTimeout(() => fileRequest("readonly", store => store.getAllKeys()).then(ids => ids.forEach(getFile)).catch(() => {}), 3000)

  // A file that neither list has any more is deleted
  async function forgetFiles(before) {
    const kept = new Set([...readList(SENT_KEY), ...readList(FAVORITES_KEY)].map(item => item.id))
    for (const item of before) {
      if (!item.file || kept.has(item.id)) continue
      fileUrls.delete(item.id)
      try { await themeFiles()?.remove(`${GIF_FOLDER}/${diskName(item.id)}`) } catch { /* not there */ }
      try { await fileRequest("readwrite", store => store.delete(item.id)) } catch { /* not there */ }
    }
  }

  const fileUrls = new Map() // id -> address of the stored file
  async function fileUrl(id) {
    if (!fileUrls.has(id)) {
      const blob = await getFile(id)
      if (!blob) return ""
      fileUrls.set(id, URL.createObjectURL(blob))
    }
    return fileUrls.get(id)
  }

  async function rememberUpload(file) {
    try {
      const id = `file:${Date.now()}`
      const picture = await createImageBitmap(file)
      await putFile(id, file)
      addTo(SENT_KEY, { id, file: true, w: picture.width || 1, h: picture.height || 1 })
      picture.close()
      refreshAll()
    } catch { /* not a picture, or no storage */ }
  }


  // Sending

  const fiberProps = (el, depth, pick) => {
    const key = Object.keys(el).find(name => name.startsWith("__reactFiber"))
    for (let fiber = key && el[key], i = 0; fiber && i < depth; fiber = fiber.return, i++) {
      const value = pick(fiber.memoizedProps || {})
      if (value) return value
    }
    return null
  }
  // View of the chat on screen: a group chat has the view of the group, with the chat of its open channel in it
  function shownView() {
    const chat = [...document.querySelectorAll(".chatWindow")].find(el => el.offsetParent)
    return chat ? fiberProps(chat, 14, props => props.chatView || props.groupView?.GetActiveChatView?.()) : null
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

  // Steam's own upload, without its window: the file is set, then sent as soon as Steam has read it
  let sendingOwn = false
  async function sendFile(file) {
    const view = shownView()
    if (!view?.SetFileToUpload || !view.UploadFile) return false
    watchUploads(view)
    sendingOwn = true
    try {
      view.SetFileToUpload(file)
      for (let i = 0; i < 60 && !view.m_fileUploadManager?.file_upload_data_url; i++) await wait(50)
      await view.UploadFile(false)
      return true
    } catch {
      return false
    } finally {
      sendingOwn = false
    }
  }

  async function send(item) {
    let blob = null
    try {
      blob = item.file ? await getFile(item.id) : await (await fetch(item.url)).blob()
    } catch { /* the service does not give the file to this page */ }
    const sent = blob
      ? await sendFile(new File([blob], `${item.id.replace(/\W+/g, "-")}.gif`, { type: "image/gif" }))
      : !item.file && sendLink(item.url)
    if (!sent) return
    addTo(SENT_KEY, item)
    if (section === "sent") refreshAll()
  }

  // No file: the address as a message, Steam shows its preview
  function sendLink(url) {
    try {
      shownView()?.SendChatMessage(url)
      return true
    } catch {
      return false
    }
  }

  // Steam's own attach or drop of a .gif: kept in Sent too
  function watchUploads(view) {
    const proto = view && Object.getPrototypeOf(view)
    if (!proto?.UploadFile || Object.hasOwn(proto, "__nkGifUploads")) return
    proto.__nkGifUploads = true
    const upload = proto.UploadFile
    proto.UploadFile = function (...args) {
      try {
        const file = this.m_fileUploadManager?.file
        if (!sendingOwn && file?.type === "image/gif") rememberUpload(file)
      } catch { /* Steam changed it */ }
      return upload.apply(this, args)
    }
  }


  // State of the service list: kept while the menu is closed and opened again (the same source, the same search)

  let section = ["search", "favorites", "sent"].includes(localStorage.getItem(SECTION_KEY)) ? localStorage.getItem(SECTION_KEY) : "search"
  let results = { source: "", key: "", query: "", items: [], next: null, loading: false, error: "", done: false }
  let query = ""

  function resetResults() {
    results = { source: source(), key: localStorage.getItem(API_KEY(source())) || "", query, items: [], next: null, loading: false, error: "", done: false }
  }

  async function loadMore() {
    const state = results
    if (state.loading || state.done || !state.key) return
    state.loading = true
    refreshAll()
    try {
      const page = await SOURCES[state.source].page(state.key, state.query, state.next)
      if (state !== results) return
      const known = new Set(state.items.map(item => item.id))
      state.items.push(...page.items.filter(item => !known.has(item.id)))
      state.next = page.next
      state.done = !page.next || !page.items.length
    } catch (error) {
      if (state !== results) return
      state.error = error instanceof BadKey ? "key" : "load"
      state.done = true
    } finally {
      state.loading = false
    }
    refreshAll()
  }


  // Rows of One Height

  // Each row is filled until it is wider than the list, then made exactly as wide (and so a little lower);
  // the last row keeps the height
  function rows(items, width) {
    const out = []
    let row = []
    let sum = 0
    for (const item of items) {
      row.push(item)
      sum += (item.w / item.h) * ROW_HEIGHT
      const room = width - GAP * (row.length - 1)
      if (sum >= room) {
        out.push({ items: row, height: Math.max(40, (ROW_HEIGHT * room) / sum) })
        row = []
        sum = 0
      }
    }
    if (row.length) out.push({ items: row, height: ROW_HEIGHT })
    return out
  }

  // A cell is made once per pane and moved between rows: its GIF does not start again on every redraw
  function cell(pane, item, height) {
    pane.nkCells ??= new Map()
    let box = pane.nkCells.get(item.id)
    if (!box) pane.nkCells.set(item.id, box = newCell(item))
    box.style.width = `${Math.floor((item.w / item.h) * height)}px`
    box.style.height = `${Math.floor(height)}px`
    const star = box.querySelector(".nk-gif-star")
    const on = isFavorite(item.id)
    star.classList.toggle("nk-on", on)
    star.title = say(on ? "Remove from favorites" : "Add to favorites")
    return box
  }

  // Every GIF of the list playing at once made the menu lag: each one gets a still copy (its frame on a canvas), the
  // GIF itself is shown, and so played, only under the cursor (Gif Picker.css), as the stickers (Emoji Pack.js).
  // Option "GIFs in Menu: Always Animated" (--nk-gif-motion: always) switches this off
  const gifsStill = () => getComputedStyle(document.documentElement).getPropertyValue("--nk-gif-motion").trim() !== "always"

  // Drawn a few per frame, at the size of the cell (a frame of a big GIF drawn whole, dozens of them loading while
  // scrolling, made the list stutter)
  const STILL_BUDGET = 4 // ms of drawing per frame
  const stillQueue = new Set()
  let stillFrame = null

  function drawStill(img) {
    if (!img.naturalWidth || !img.isConnected) return
    const box = img.parentElement
    const ratio = devicePixelRatio || 1
    const width = Math.min(img.naturalWidth, Math.ceil((box?.clientWidth || img.naturalWidth) * ratio))
    const height = Math.min(img.naturalHeight, Math.ceil((box?.clientHeight || img.naturalHeight) * ratio))
    const canvas = img.previousElementSibling?.classList.contains("nk-gif-still") ? img.previousElementSibling : document.createElement("canvas")
    canvas.className = "nk-gif-still"
    canvas.width = width
    canvas.height = height
    try {
      // as object-fit: cover does it
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      canvas.getContext("2d").drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
    } catch {
      return // nothing drawn: the GIF stays as it is
    }
    if (!canvas.isConnected) img.before(canvas)
    img.setAttribute("data-nk-still", "")
  }

  function queueStill(img) {
    stillQueue.add(img)
    stillFrame ??= requestAnimationFrame(drawQueued)
  }

  function drawQueued() {
    stillFrame = null
    const until = performance.now() + STILL_BUDGET
    for (const img of stillQueue) {
      stillQueue.delete(img)
      drawStill(img)
      if (performance.now() > until) break
    }
    if (stillQueue.size) stillFrame = requestAnimationFrame(drawQueued)
  }

  function newCell(item) {
    const box = document.createElement("div")
    box.className = "nk-gif"
    const img = document.createElement("img")
    img.alt = ""
    img.draggable = false
    img.loading = "lazy"
    img.decoding = "async"
    if (gifsStill()) {
      box.setAttribute("data-nk-still-mode", "")
      img.addEventListener("load", () => queueStill(img))
    }
    if (item.file) fileUrl(item.id).then(url => { if (url) img.src = url })
    else img.src = item.preview
    const star = document.createElement("div")
    star.className = "nk-gif-star"
    star.setAttribute("role", "button")
    box.append(img, star)
    box.addEventListener("click", event => {
      if (event.target.closest(".nk-gif-star")) {
        toggleFavorite(item)
        const now = isFavorite(item.id)
        star.classList.toggle("nk-on", now)
        star.title = say(now ? "Remove from favorites" : "Add to favorites")
        if (section === "favorites") refreshAll()
        return
      }
      send(item)
    })
    return box
  }


  // Pane

  function createPane() {
    const pane = document.createElement("div")
    pane.id = PANE_ID
    pane.innerHTML = '<div class="nk-gif-top"></div><div class="nk-gif-list"><div class="nk-gif-rows"></div><div class="nk-gif-note"></div></div><div class="nk-gif-sections"></div>'
    const list = pane.querySelector(".nk-gif-list")
    list.addEventListener("scroll", () => {
      if (section === "search" && list.scrollTop + list.clientHeight > list.scrollHeight - MORE_AT) loadMore()
    }, { passive: true })
    // Width changed (the panel dragged, the window resized): the rows anew
    let width = 0
    new ResizeObserver(() => {
      if (!list.clientWidth || list.clientWidth === width) return
      width = list.clientWidth
      render(pane)
    }).observe(list)
    pane.querySelector(".nk-gif-sections").addEventListener("click", event => {
      const button = event.target instanceof Element && event.target.closest("[data-nk-section]")
      if (!button || button.dataset.nkSection === section) return
      section = button.dataset.nkSection
      localStorage.setItem(SECTION_KEY, section)
      list.scrollTop = 0
      refreshAll()
    })
    return pane
  }

  function topOf(pane) {
    const top = pane.querySelector(".nk-gif-top")
    const name = SOURCES[source()].name
    const want = section === "search" ? "search" : section === "sent" ? "upload" : ""
    if (top.dataset.nkKind === want && top.dataset.nkSource === name) return
    top.dataset.nkKind = want
    top.dataset.nkSource = name
    top.textContent = ""
    if (want === "search") {
      const input = document.createElement("input")
      input.type = "text"
      input.className = "nk-gif-search"
      input.placeholder = say("Search %s", name)
      input.value = query
      let timer = null
      input.addEventListener("input", () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          query = input.value.trim()
          for (const other of document.querySelectorAll(`#${PANE_ID} .nk-gif-search`)) if (other !== input) other.value = input.value
          resetResults()
          pane.querySelector(".nk-gif-list").scrollTop = 0
          loadMore()
        }, SEARCH_DELAY)
      })
      top.append(input)
    } else if (want === "upload") {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "nk-gif-upload"
      button.textContent = say("Upload GIF")
      const picker = document.createElement("input")
      picker.type = "file"
      picker.accept = ".gif,image/gif"
      picker.hidden = true
      button.addEventListener("click", () => picker.click())
      picker.addEventListener("change", async () => {
        const file = picker.files?.[0]
        picker.value = ""
        if (!file || file.type !== "image/gif") return
        if (await sendFile(file)) rememberUpload(file)
      })
      top.append(button, picker)
    }
  }

  function keyForm(pane, wrong) {
    const rowsBox = pane.querySelector(".nk-gif-rows")
    const current = SOURCES[source()]
    rowsBox.textContent = ""
    const form = document.createElement("div")
    form.className = "nk-gif-key"
    form.innerHTML = '<div class="nk-gif-key-title"></div><input type="text" class="nk-gif-key-input" spellcheck="false"><button type="button" class="nk-gif-key-save"></button><div class="nk-gif-key-error"></div><a class="nk-gif-key-link" href="#"></a>'
    const [title, input, save, error, link] = form.children
    title.textContent = say("Enter your %s API key", current.name)
    input.placeholder = say("API key")
    input.value = localStorage.getItem(API_KEY(source())) || ""
    save.textContent = say("Save")
    error.textContent = wrong ? say("This key does not work") : ""
    link.textContent = say("How to get a key")
    link.addEventListener("click", event => {
      event.preventDefault()
      location.href = `steam://openurl_external/${current.keyUrl}`
    })
    const apply = () => {
      const value = input.value.trim()
      if (!value) return
      localStorage.setItem(API_KEY(source()), value)
      resetResults()
      loadMore()
    }
    save.addEventListener("click", apply)
    input.addEventListener("keydown", event => { if (event.key === "Enter") apply() })
    rowsBox.append(form)
  }

  function render(pane) {
    topOf(pane)
    const sections = pane.querySelector(".nk-gif-sections")
    const labels = [["search", SOURCES[source()].name], ["favorites", say("Favorites")], ["sent", say("History")]]
    if (sections.dataset.nkLabels !== labels.join()) {
      sections.dataset.nkLabels = labels.join()
      sections.textContent = ""
      for (const [id, label] of labels) {
        const button = document.createElement("button")
        button.type = "button"
        button.dataset.nkSection = id
        button.textContent = label
        sections.append(button)
      }
    }
    for (const button of sections.children) button.classList.toggle("nk-active", button.dataset.nkSection === section)

    const list = pane.querySelector(".nk-gif-list")
    const rowsBox = pane.querySelector(".nk-gif-rows")
    const note = pane.querySelector(".nk-gif-note")
    note.textContent = ""
    pane.toggleAttribute("data-nk-loading", section === "search" && results.loading)

    if (section === "search" && (!results.key || results.error === "key")) {
      note.textContent = ""
      return keyForm(pane, results.error === "key")
    }
    const items = section === "search" ? results.items : readList(section === "favorites" ? FAVORITES_KEY : SENT_KEY)
    // Read before anything goes: an empty list laid out drops its scroll to the top
    const width = list.clientWidth
    const scrolled = list.scrollTop
    const shown = new Set(items.map(item => item.id))
    for (const id of pane.nkCells?.keys() || []) if (!shown.has(id)) pane.nkCells.delete(id)
    // Only the rows that changed are made anew: more GIFs loaded change the last row and add new ones, the rows above
    // stay as they are (all of them made again, the list jerked while scrolling)
    for (const child of [...rowsBox.children]) if (!child.classList.contains("nk-gif-row")) child.remove() // the key form
    const built = width ? rows(items, width) : []
    const lines = [...rowsBox.children]
    const keyOf = row => `${row.height}|${row.items.map(item => item.id).join(",")}`
    let same = 0
    while (same < built.length && same < lines.length && lines[same].dataset.nkKey === keyOf(built[same])) same++
    for (const line of lines.slice(same)) line.remove()
    for (const row of built.slice(same)) {
      const line = document.createElement("div")
      line.className = "nk-gif-row"
      line.dataset.nkKey = keyOf(row)
      for (const item of row.items) line.append(cell(pane, item, row.height))
      rowsBox.append(line)
    }
    if (list.scrollTop !== scrolled) list.scrollTop = scrolled
    if (!items.length && !(section === "search" && results.loading)) {
      note.textContent = section === "favorites" ? say("No favorites yet")
        : section === "sent" ? say("History is empty")
        : results.error ? say("Could not load GIFs") : say("Nothing found")
    } else if (section === "search" && results.error === "load") {
      note.textContent = say("Could not load GIFs")
    }
  }

  // Every open pane (the docked panel and its copy, a popup): drawn anew. Not drawn while nothing changed
  let refreshQueued = false
  function refreshAll() {
    if (refreshQueued) return
    refreshQueued = true
    requestAnimationFrame(() => {
      refreshQueued = false
      for (const pane of document.querySelectorAll(`${PICKER} > #${PANE_ID}`)) {
        if (pane.closest(".Picker").hasAttribute(OPEN_ATTR)) render(pane)
      }
    })
  }


  // Tab

  // Right after the stickers: Steam's tabs are recent, emoticons, stickers and - not in every client - room effects
  const STICKERS_TAB = 2

  function placeTab(tabs, tab) {
    const stickers = [...tabs.children].filter(el => el !== tab)[STICKERS_TAB]
    if (!stickers) {
      if (tab.parentElement !== tabs) tabs.append(tab)
    } else if (stickers.nextElementSibling !== tab) stickers.after(tab)
  }

  function addTab(picker) {
    const tabs = picker.querySelector(":scope > .Tabs")
    if (!tabs) return
    const own = tabs.querySelector(`:scope > .${TAB_CLASS}`)
    if (own) return placeTab(tabs, own) // Steam may add a tab after it later
    const sample = [...tabs.children].find(tab => !tab.classList.contains("Active"))
    if (!sample) return
    // Classes of a tab that is not active (Steam's look of the tab comes with them)
    const clean = el => (el?.className || "").replace(/\bActive\b/g, "").trim()
    const tab = document.createElement("div")
    tab.className = `${clean(sample)} ${TAB_CLASS}`
    tab.innerHTML = `<div class="${clean(sample.firstElementChild)}"><span class="${clean(sample.querySelector(".PickerTab"))}">GIF</span></div>`
    tab.title = "GIF"
    tab.addEventListener("click", () => open(picker))
    placeTab(tabs, tab)
  }

  function open(picker) {
    localStorage.setItem(OPEN_KEY, "1")
    if (picker.hasAttribute(OPEN_ATTR)) return
    picker.setAttribute(OPEN_ATTR, "")
    if (!picker.querySelector(`:scope > #${PANE_ID}`)) picker.append(createPane())
    watchUploads(shownView())
    if (results.source !== source() || results.key !== (localStorage.getItem(API_KEY(source())) || "")) resetResults()
    if (section === "search" && !results.items.length && !results.done) loadMore()
    refreshAll()
  }

  function close(picker) {
    picker.removeAttribute(OPEN_ATTR)
  }


  // From the Chat

  // A picture in a message (a GIF sent by anybody) gets the same star under the cursor: into Favorites.
  // Steam tells no GIF from a still picture by its address, so every picture of a message has it. Its file is kept
  // on Steam's server: sent again as a file when the server gives it to this page, else as its address
  const CHAT_PICTURE = ".chatWindow .msg .chatImageContainer img"

  function chatItem(img) {
    const url = img.currentSrc || img.src
    return url ? { id: `chat:${url}`, preview: url, url, w: img.naturalWidth || 1, h: img.naturalHeight || 1 } : null
  }

  function onChatHover(event) {
    const img = event.target instanceof Element && event.target.closest(".chatWindow .msg .chatImageContainer")?.querySelector("img")
    if (!img?.matches(CHAT_PICTURE)) return
    const host = img.parentElement
    let star = host.querySelector(":scope > .nk-gif-star")
    if (!star) {
      star = document.createElement("div")
      star.className = "nk-gif-star nk-chat-star"
      star.setAttribute("role", "button")
      host.append(star)
    }
    const item = chatItem(img)
    const on = !!item && isFavorite(item.id)
    star.classList.toggle("nk-on", on)
    star.title = say(on ? "Remove from favorites" : "Add to favorites")
  }

  // Before Steam: a press on the picture opens it in a window of its own
  function onChatStar(event) {
    const star = event.target instanceof Element && event.target.closest(".nk-chat-star")
    if (!star) return
    event.preventDefault()
    event.stopPropagation()
    if (event.type !== "click") return
    const item = chatItem(star.parentElement.querySelector("img"))
    if (!item) return
    toggleFavorite(item)
    const on = isFavorite(item.id)
    star.classList.toggle("nk-on", on)
    star.title = say(on ? "Remove from favorites" : "Add to favorites")
    if (section === "favorites") refreshAll()
  }


  // Start

  function update() {
    for (const picker of document.querySelectorAll(PICKER)) {
      addTab(picker)
      if (localStorage.getItem(OPEN_KEY) === "1" && !picker.dataset.nkGifRestored) {
        picker.dataset.nkGifRestored = "1"
        open(picker)
      }
    }
  }

  let frame = null
  function schedule() {
    frame ??= requestAnimationFrame(() => {
      frame = null
      update()
    })
  }

  // A tab of Steam pressed: its list again
  document.addEventListener("click", event => {
    const tab = event.target instanceof Element && event.target.closest(".Picker > .Tabs > .Tab")
    if (!tab || tab.classList.contains(TAB_CLASS)) return
    const picker = tab.closest(".Picker")
    if (!picker?.hasAttribute(OPEN_ATTR)) return
    localStorage.setItem(OPEN_KEY, "0")
    close(picker)
  }, true)

  document.addEventListener("mouseover", onChatHover)
  for (const type of ["mousedown", "mouseup", "click"]) document.addEventListener(type, onChatStar, true)

  function init() {
    schedule()
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true })
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
