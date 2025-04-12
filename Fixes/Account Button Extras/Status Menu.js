// Direct DOM manipulation approach with toggle behavior
(function() {
  // Target class for right-click
  const TARGET_CLASS = "_3yD46y5pd3zOGR7CzKs0mC";
  
  // Global variable to track selected status
  let currentSelectedStatus = 'online'; // Default to online
  
  // Accent color for highlighting (fallback if CSS variable doesn't work)
  const ACCENT_COLOR = '#1a9fff'; // Bright blue as fallback
  
  // Variable to track if menu is visible
  let isMenuVisible = false;
  
  // Variable to track the current target element
  let currentTargetElement = null;
  
  // Base translations (English)
  const baseTranslation = {
    online: "Online",
    away: "Away",
    invisible: {
      text: "Invisible",
      desc: "Hides your online status"
    },
    offline: {
      text: "Offline",
      desc: "Sign out of friends and chats"
    }
  };
  
  // Optimized translations - only include what differs from English
  const translationOverrides = {
    bulgarian: {
      online: "На линия", away: "Отсъстващ", 
      invisible: { text: "Невидим", desc: "Скрива онлайн статуса ви" },
      offline: { text: "Извън линия", desc: "Излизане от приятели и чатове" }
    },
    czech: {
      away: "Pryč", 
      invisible: { text: "Neviditelný", desc: "Skryje váš online stav" },
      offline: { text: "Offline", desc: "Odhlásit se z přátel a chatů" }
    },
    danish: {
      away: "Ikke til stede", 
      invisible: { text: "Usynlig", desc: "Skjuler din online status" },
      offline: { text: "Log ud af venner og chats" }
    },
    dutch: {
      away: "Afwezig", 
      invisible: { text: "Onzichtbaar", desc: "Verbergt je online status" },
      offline: { text: "Afmelden bij vrienden en chats" }
    },
    finnish: {
      online: "Paikalla", away: "Poissa", 
      invisible: { text: "Näkymätön", desc: "Piilottaa online-tilasi" },
      offline: { text: "Kirjaudu ulos ystävistä ja chateista" }
    },
    french: {
      online: "En ligne", away: "Absent", 
      invisible: { text: "Invisible", desc: "Masque votre statut en ligne" },
      offline: { text: "Hors ligne", desc: "Se déconnecter des amis et des chats" }
    },
    german: {
      away: "Abwesend", 
      invisible: { text: "Unsichtbar", desc: "Verbirgt deinen Online-Status" },
      offline: { text: "Von Freunden und Chats abmelden" }
    },
    greek: {
      online: "Συνδεδεμένος", away: "Απών", 
      invisible: { text: "Αόρατος", desc: "Κρύβει την κατάσταση σύνδεσής σας" },
      offline: { text: "Αποσυνδεδεμένος", desc: "Αποσύνδεση από φίλους και συνομιλίες" }
    },
    hungarian: {
      online: "Elérhető", away: "Távol", 
      invisible: { text: "Láthatatlan", desc: "Elrejti az online állapotát" },
      offline: { text: "Nem elérhető", desc: "Kijelentkezés a barátok és csevegések közül" }
    },
    italian: {
      away: "Assente", 
      invisible: { text: "Invisibile", desc: "Nasconde il tuo stato online" },
      offline: { text: "Offline", desc: "Disconnettiti da amici e chat" }
    },
    japanese: {
      online: "オンライン", away: "離席中", 
      invisible: { text: "オフライン表示", desc: "オンラインステータスを隠す" },
      offline: { text: "オフライン", desc: "フレンドとチャットからサインアウト" }
    },
    korean: {
      online: "온라인", away: "자리 비움", 
      invisible: { text: "오프라인으로 표시", desc: "온라인 상태 숨기기" },
      offline: { text: "오프라인", desc: "친구 및 채팅에서 로그아웃" }
    },
    norwegian: {
      online: "Pålogget", away: "Borte", 
      invisible: { text: "Usynlig", desc: "Skjuler din påloggingsstatus" },
      offline: { text: "Avlogget", desc: "Logg av venner og chat" }
    },
    polish: {
      away: "Zaraz wracam", 
      invisible: { text: "Niewidoczny", desc: "Ukrywa twój status online" },
      offline: { text: "Offline", desc: "Wyloguj się z listy znajomych i czatów" }
    },
    portuguese: {
      away: "Ausente", 
      invisible: { text: "Invisível", desc: "Oculta o seu estado online" },
      offline: { text: "Sair de amigos e chats" }
    },
    romanian: {
      away: "Plecat", 
      invisible: { text: "Invizibil", desc: "Ascunde starea ta online" },
      offline: { text: "Offline", desc: "Deconectare de la prieteni și chat-uri" }
    },
    russian: {
      online: "В сети", away: "Нет на месте", 
      invisible: { text: "Невидимка", desc: "Скрывает статус того что вы в сети" },
      offline: { text: "Не в сети", desc: "Выйти из системы друзей и чатов" }
    },
    spanish: {
      online: "Conectado", away: "Ausente", 
      invisible: { text: "Invisible", desc: "Oculta tu estado en línea" },
      offline: { text: "Desconectado", desc: "Cerrar sesión de amigos y chats" }
    },
    swedish: {
      away: "Borta", 
      invisible: { text: "Osynlig", desc: "Döljer din onlinestatus" },
      offline: { text: "Offline", desc: "Logga ut från vänner och chattar" }
    },
    thai: {
      online: "ออนไลน์", away: "ไม่อยู่", 
      invisible: { text: "ไม่แสดงตัว", desc: "ซ่อนสถานะออนไลน์ของคุณ" },
      offline: { text: "ออฟไลน์", desc: "ออกจากระบบเพื่อนและแชท" }
    },
    turkish: {
      online: "Çevrimiçi", away: "Uzakta", 
      invisible: { text: "Görünmez", desc: "Çevrimiçi durumunuzu gizler" },
      offline: { text: "Çevrimdışı", desc: "Arkadaşlar ve sohbetlerden çıkış yap" }
    },
    ukrainian: {
      online: "У мережі", away: "Відійшов", 
      invisible: { text: "Невидимий", desc: "Приховує ваш онлайн-статус" },
      offline: { text: "Не в мережі", desc: "Вийти з друзів та чатів" }
    },
    vietnamese: {
      online: "Trực tuyến", away: "Vắng mặt", 
      invisible: { text: "Ẩn", desc: "Ẩn trạng thái trực tuyến của bạn" },
      offline: { text: "Ngoại tuyến", desc: "Đăng xuất khỏi bạn bè và trò chuyện" }
    },
    schinese: {
      online: "在线", away: "离开", 
      invisible: { text: "隐身", desc: "隐藏您的在线状态" },
      offline: { text: "离线", desc: "退出好友和聊天" }
    },
    tchinese: {
      online: "在線", away: "離開", 
      invisible: { text: "隱身", desc: "隱藏您的在線狀態" },
      offline: { text: "離線", desc: "退出好友和聊天" }
    }
  };
  
  // Function to get complete translation for a language
  function getTranslation(lang) {
    // Start with the base translation (English)
    const translation = JSON.parse(JSON.stringify(baseTranslation));
    
    // Apply overrides if they exist
    if (translationOverrides[lang]) {
      Object.keys(translationOverrides[lang]).forEach(key => {
        translation[key] = translationOverrides[lang][key];
      });
    }
    
    return translation;
  }
  
  // Function to detect page language
  function detectLanguage() {
    // Try to detect from HTML lang attribute
    const htmlLang = document.documentElement.lang.toLowerCase();
    
    // Try to detect from URL
    const urlLang = window.location.pathname.split('/').filter(Boolean)[0];
    
    // Map detected language to our translation keys
    const langMap = {
      'bg': 'bulgarian', 'cs': 'czech', 'da': 'danish', 'nl': 'dutch',
      'fi': 'finnish', 'fr': 'french', 'de': 'german', 'el': 'greek',
      'hu': 'hungarian', 'it': 'italian', 'ja': 'japanese', 'ko': 'korean',
      'no': 'norwegian', 'pl': 'polish', 'pt': 'portuguese', 'pt-br': 'portuguese',
      'ro': 'romanian', 'ru': 'russian', 'es': 'spanish', 'es-419': 'spanish',
      'sv': 'swedish', 'th': 'thai', 'tr': 'turkish', 'uk': 'ukrainian',
      'vi': 'vietnamese', 'zh-cn': 'schinese', 'zh-tw': 'tchinese'
    };
    
    // Check for language in various sources
    let detectedLang = 'english'; // Default
    
    if (htmlLang && langMap[htmlLang]) {
      detectedLang = langMap[htmlLang];
    } else if (urlLang && langMap[urlLang]) {
      detectedLang = langMap[urlLang];
    } else {
      // Try to detect from browser language
      const browserLang = navigator.language.toLowerCase();
      if (langMap[browserLang]) {
        detectedLang = langMap[browserLang];
      } else if (browserLang.includes('-') && langMap[browserLang.split('-')[0]]) {
        detectedLang = langMap[browserLang.split('-')[0]];
      }
    }
    
    return detectedLang;
  }
  
  // Detect language and get translations
  const currentLang = detectLanguage();
  const texts = getTranslation(currentLang);
  
  // Function to get the accent color
  function getAccentColor() {
    // Try to get the CSS variable
    const computedStyle = getComputedStyle(document.documentElement);
    const cssVar = computedStyle.getPropertyValue('--custom-accent').trim();
    
    // If the CSS variable exists and is not empty, use it
    if (cssVar && cssVar !== '') {
      return cssVar;
    }
    
    // Otherwise, use the fallback color
    return ACCENT_COLOR;
  }
  
  // Get the accent color
  const accentColor = getAccentColor();
  
  // Function to create the menu
  function createMenu() {
    // Remove any existing menu
    const existingMenu = document.getElementById('steam-status-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // Create menu container
    const menu = document.createElement('div');
    menu.id = 'steam-status-menu';
    
    // Apply the exact classes
    menu.className = "_2EstNjFIIZm_WUSKm5Wt7n _3pofGqV0buiKAfMPEs3_82 HoGkIKTQnkTEFGjqO-GMl";
    
    // Set positioning
    menu.style.position = 'absolute';
    menu.style.display = 'none';
    menu.style.zIndex = '9999';
    
    // Status options with localized text
    const options = [
      { 
        status: 'online',
        text: texts.online, 
        url: 'steam://friends/status/online' 
      },
      { 
        status: 'away',
        text: texts.away, 
        url: 'steam://friends/status/away' 
      },
      { 
        status: 'invisible',
        text: texts.invisible.text, 
        desc: texts.invisible.desc,
        url: 'steam://friends/status/invisible' 
      },
      { 
        status: 'offline',
        text: texts.offline.text, 
        desc: texts.offline.desc,
        url: 'steam://friends/status/offline' 
      }
    ];
    
    // Create buttons
    options.forEach(option => {
      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = "_2jXHP0742MyApMUVUM8IFn _2uiDecKkKjAq7nimy3uLhG _1n7Wloe5jZ6fSuvV18NNWI contextMenuItem";
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column';
      buttonContainer.style.textAlign = 'left'; // Ensure left alignment
      buttonContainer.style.alignItems = 'flex-start'; // Align items to the start (left)
      
      // Create main text
      const mainText = document.createElement('div');
      mainText.textContent = option.text;
      mainText.style.textAlign = 'left'; // Ensure left alignment
      mainText.style.width = '100%'; // Take full width to ensure alignment works
      
      // Highlight if this is the selected status
      if (option.status === currentSelectedStatus) {
        mainText.style.color = accentColor;
      }
      
      buttonContainer.appendChild(mainText);
      
      // Add description if available
      if (option.desc) {
        const descText = document.createElement('div');
        descText.textContent = option.desc;
        descText.style.fontSize = '11px';
        descText.style.color = '#8f98a0';
        descText.style.textAlign = 'left'; // Ensure left alignment
        descText.style.width = '100%'; // Take full width to ensure alignment works
        buttonContainer.appendChild(descText);
      }
      
      // Add click handler
      buttonContainer.addEventListener('click', function(e) {
        // Update the selected status
        currentSelectedStatus = option.status;
        
        // Hide menu
        hideMenu();
        
        // Navigate to the status URL
        window.location.href = option.url;
        
        // Prevent event propagation
        e.stopPropagation();
      });
      
      // Add to menu
      menu.appendChild(buttonContainer);
    });
    
    // Prevent right-click on the menu itself
    menu.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    
    // Add to document
    document.body.appendChild(menu);
    
    return menu;
  }
  
  // Create the initial menu
  let menu = createMenu();
  
  // Function to toggle menu visibility
  function toggleMenu(e, targetElement) {
    // Check if menu is already visible and if the click is on the same target
    if (isMenuVisible && targetElement === currentTargetElement) {
      // If so, hide the menu
      hideMenu();
      return;
    }
    
    // Otherwise, show the menu
    showMenu(e, targetElement);
  }
  
  // Function to show menu below the clicked element
  function showMenu(e, targetElement) {
    // Store the current target element
    currentTargetElement = targetElement;
    
    // Recreate the menu to ensure it reflects the current selection
    menu = createMenu();
    
    // Get the position and dimensions of the clicked element
    const rect = targetElement.getBoundingClientRect();
    
    // Calculate position below the element
    const left = rect.left;
    const top = rect.bottom; // Position right below the element
    
    // Position the menu
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.style.display = 'block';
    
    // Update visibility state
    isMenuVisible = true;
  }
  
  // Function to hide menu
  function hideMenu() {
    if (menu) {
      menu.style.display = 'none';
      isMenuVisible = false;
      currentTargetElement = null; // Clear the current target
    }
  }
  
  // Improved document click handler for hiding the menu
  function setupDocumentClickHandler() {
    // Remove any existing handler
    document.removeEventListener('click', documentClickHandler);
    
    // Add the handler
    document.addEventListener('click', documentClickHandler);
  }
  
  // Document click handler function
  function documentClickHandler(e) {
    // Only process if menu is visible
    if (!isMenuVisible) return;
    
    // Check if the click was inside the menu
    if (menu && !menu.contains(e.target)) {
      hideMenu();
    }
  }
  
  // Attach right-click handler
  function attachRightClickHandler() {
    // Try to find target elements
    const targetElements = document.querySelectorAll('.' + TARGET_CLASS);
    
    // If no targets found, attach to document
    if (targetElements.length === 0) {
      document.addEventListener('contextmenu', function(e) {
        // Check if Shift key is pressed - if so, don't show our menu
        if (e.shiftKey) {
          return true; // Allow default behavior
        }
        
        // Check if click was on the menu itself
        if (menu && menu.contains(e.target)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        e.preventDefault();
        
        // Toggle menu visibility
        toggleMenu(e, document.body);
        
        return false;
      });
      return;
    }
    
    // Attach to each target
    targetElements.forEach(element => {
      element.addEventListener('contextmenu', function(e) {
        // Check if Shift key is pressed - if so, don't show our menu
        if (e.shiftKey) {
          return true; // Allow default behavior
        }
        
        e.preventDefault();
        toggleMenu(e, this); // Toggle menu visibility
        return false;
      });
    });
  }
  
  // Setup document click handler for hiding the menu
  setupDocumentClickHandler();
  
  // Also hide on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isMenuVisible) {
      hideMenu();
    }
  });
  
  // Attach handler
  attachRightClickHandler();
  
  // Try again after delay
  setTimeout(attachRightClickHandler, 1000);
  
  // Add a mousedown handler to ensure menu closes on any click
  document.addEventListener('mousedown', function(e) {
    if (isMenuVisible && menu && !menu.contains(e.target)) {
      hideMenu();
    }
  });
  
  // Add a global function to change the status directly (for testing)
  window.changeStatusHighlight = function(status) {
    if (['online', 'away', 'invisible', 'offline'].includes(status)) {
      currentSelectedStatus = status;
      console.log(`Status highlight changed to: ${status}`);
    } else {
      console.error(`Invalid status: ${status}`);
    }
  };
})();