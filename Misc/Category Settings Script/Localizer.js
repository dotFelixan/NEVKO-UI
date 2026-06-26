// ==============================================================================
// LOCALIZER SCRIPT
// Dynamically localizes Steam theme settings based on the client language
// ==============================================================================

(() => {
  const TRANSLATIONS = {
    ja: {
      // Tabs
      "General": "全般",
      "UI Personalization": "UIのカスタマイズ",
      "Privacy": "プライバシー",
      "Refresh Presets": "デザインのプリセット",

      // Categories (from TitleCategory.js)
      "Users": "ユーザー",
      "Misc": "その他",
      "Main": "メイン",
      "Library": "ライブラリ",
      "Chats": "チャット",

      // Option Titles
      "Rounding Avatars": "アバターの角丸設定",
      "Alternative Online Indicator": "インジケーターの変更",
      "Avatar Decoration": "アバターのデコレーション",
      "Badges for Contributors": "コントリビューターバッジ",
      "Fonts [WIP]": "フォント[開発中]",
      "Reorder Main Buttons": "ヘッダーボタンの入れ替え",
      "Hide Profile Button": "プロフィールボタンを非表示",
      "Remove Window Buttons": "ウィンドウ操作ボタンの削除",
      "Move Bottom Buttons to Top Bar": "下部ボタンを上部に移動",
      "Move URL Bar to Bottom": "URLバーを下部に移動",
      "Library Side": "ライブラリの配置サイド",
      "Gamepage Side": "ゲーム詳細ページの配置サイド",
      "Resize Library List": "ライブラリリストの幅",
      "Game Page Content Location": "ゲームページのコンテンツの配置",
      "Hiding Library Items": "ライブラリ要素の非表示",
      "Refresh Friends & Chat": "フレンドとチャットのデザインを更新",
      "Style Menu": "メニューのスタイル",
      "Refresh Settings": "設定画面のデザイン更新",
      "Blur Account Name": "アカウント名のぼかし",
      "Blur Balance": "残高のぼかし",
      "Hide Balance": "残高を非表示",

      // Descriptions
      "Choose the shape style for all user avatars throughout Steam": "Steam全体のユーザーアバターの形状スタイルを選択します",
      "Replaces default indicator with a modern dot-style badge (like Discord)": "デフォルトのインジケーターをDiscordのようなモダンなドットスタイルに変更します",
      "Toggle visibility of avatar frames | BIG WIP, UNSTABLE": "アバターフレームの表示/非表示を切り替えます | 開発中・不安定",
      "Display special badges for theme contributors on their profiles | Can't be disabled, WIP": "プロフィールページにテーマ貢献者の特別なバッジを表示します | 無効化不可・開発中",
      "Override the default Steam font with a custom typeface | BIG WIP, NOT WORK": "Steamのデフォルトフォントをカスタムフォントで上書きします | 開発中・未動作",
      "Swap the positions of 'Store' and 'Library' buttons in the header": "ヘッダー内の「ストア」と「ライブラリ」のボタン位置を入れ替えます",
      "Remove the profile button from the left side | Useful buttons are moved to Account Menu": "左側のプロフィールボタンを削除します（便利なボタンはアカウントメニューに移動します）",
      "Hide specific window control buttons": "特定のウィンドウ操作ボタンを非表示にします",
      "Position the URL/address bar at the bottom of the window": "URL/アドレスバーをウィンドウの下部に配置します",
      "Choose which side of the screen to display the game library list": "ゲームライブラリリストを表示する画面の左右を選択します",
      "Choose which side to display game details and information panel": "ゲームの詳細と情報パネルを表示する画面の左右を選択します",
      "Adjust the width of the game library sidebar": "ゲームライブラリサイドバーの幅を調整します",
      "Hide specific elements from the library home screen": "ライブラリのホーム画面から特定の要素を非表示にします",
      "Apply a refreshed modern design to the Friends & Chat panel | BIG WIP": "フレンドとチャットパネルにモダンなデザインを適用します | 開発中",
      "Choose the visual density style for dropdown menus": "ドロップダウンメニューの表示密度スタイルを選択します",
      "Enable experimental redesigned settings interface | BIG WIP": "実験的な再設計された設定インターフェースを有効にします | 開発中",
      "Apply blur effect to your account/login name in the Account Menu": "アカウントメニューのアカウント名/ログイン名にぼかし効果を適用します",
      "Apply blur effect to your wallet balance in the Account Menu": "アカウントメニューのウォレット残高にぼかし効果を適用します",
      "Completely hide your wallet balance from the account button": "アカウントボタンからウォレット残高を完全に非表示にします",

      // Values
      "Sharp": "四角",
      "Rounded Square": "角丸四角",
      "Circle": "円",
      "no": "無効",
      "yes": "有効",
      "Steam Default": "Steamのデフォルト",
      "None": "なし",
      "[Collapse] Only": "「最小化」のみ",
      "[Expand] Only": "「最大化」のみ",
      "[Close] Only": "「閉じる」のみ",
      "[Collapse + Expand]": "「最小化 + 最大化」",
      "[Collapse + Close]": "「最小化 + 閉じる」",
      "[Expand + Close]": "「最大化 + 閉じる」",
      "All": "すべて",
      "Left Side": "左側",
      "Right Side": "右側",
      "Small": "小",
      "Default": "デフォルト",
      "Medium": "中",
      "Big": "大",
      "[All] Center": "［すべて］中央",
      "[All] Left Side": "［すべて］左側",
      "[All] Right Side": "［すべて］右側",
      "[Game Links] Right Side Only": "［ゲームリンク］右側のみ",
      "[Game Links] Left Side Only": "［ゲームリンク］左側のみ",
      "[Compact] Left Side": "［コンパクト］左側",
      "[Compact] Right Side": "［コンパクト］右側",
      "[What's New] Only": "「アップデート情報」のみ",
      "[Add Shelf] Only": "「シェルフを追加」のみ",
      "Both": "両方",
      "Disabled": "無効",
      "Enabled": "有効",
      "Legacy": "レガシー",
      "Spacious": "ゆったり",
      "Compact": "コンパクト"
    },
    ru: {
      // Tabs
      "General": "Общие",
      "UI Personalization": "Персонализация UI",
      "Privacy": "Конфиденциальность",
      "Refresh Presets": "Предустановки дизайна",

      // Categories (from TitleCategory.js)
      "Users": "Пользователи",
      "Misc": "Разное",
      "Main": "Главное",
      "Library": "Библиотека",
      "Chats": "Чаты",

      // Option Titles
      "Rounding Avatars": "Округление аватаров",
      "Alternative Online Indicator": "Альтернативный индикатор сети",
      "Avatar Decoration": "Украшение аватара",
      "Badges for Contributors": "Значки для контрибьюторов",
      "Fonts [WIP]": "Шрифты [В разработке]",
      "Reorder Main Buttons": "Переупорядочить кнопки",
      "Hide Profile Button": "Скрыть кнопку профиля",
      "Remove Window Buttons": "Удалить кнопки окна",
      "Move Bottom Buttons to Top Bar": "Переместить нижние кнопки вверх",
      "Move URL Bar to Bottom": "Переместить URL-бар вниз",
      "Library Side": "Сторона библиотеки",
      "Gamepage Side": "Сторона страницы игры",
      "Resize Library List": "Размер списка библиотеки",
      "Game Page Content Location": "Расположение контента страницы",
      "Hiding Library Items": "Скрытие элементов библиотеки",
      "Refresh Friends & Chat": "Обновить дизайн друзей и чата",
      "Style Menu": "Стиль меню",
      "Refresh Settings": "Обновить настройки",
      "Blur Account Name": "Размыть имя аккаунта",
      "Blur Balance": "Размыть баланс",
      "Hide Balance": "Скрыть баланс",

      // Descriptions
      "Choose the shape style for all user avatars throughout Steam": "Выберите форму для всех аватаров пользователей в Steam",
      "Replaces default indicator with a modern dot-style badge (like Discord)": "Заменяет стандартный индикатор на современную точку (как в Discord)",
      "Toggle visibility of avatar frames | BIG WIP, UNSTABLE": "Переключить видимость рамок аватара | В разработке, нестабильно",
      "Display special badges for theme contributors on their profiles | Can't be disabled, WIP": "Отображать специальные значки для создателей темы в их профилях | Нельзя отключить, в разработке",
      "Override the default Steam font with a custom typeface | BIG WIP, NOT WORK": "Заменить стандартный шрифт Steam на кастомный | В разработке, не работает",
      "Swap the positions of 'Store' and 'Library' buttons in the header": "Поменять местами кнопки 'Магазин' и 'Библиотека' в шапке",
      "Remove the profile button from the left side | Useful buttons are moved to Account Menu": "Удалить кнопку профиля слева | Полезные кнопки перемещены в меню аккаунта",
      "Hide specific window control buttons": "Скрыть определенные кнопки управления окном",
      "Position the URL/address bar at the bottom of the window": "Разместить адресную строку (URL) внизу окна",
      "Choose which side of the screen to display the game library list": "Выберите, с какой стороны экрана отображать список библиотеки игр",
      "Choose which side to display game details and information panel": "Выберите, с какой стороны отображать сведения об игре",
      "Adjust the width of the game library sidebar": "Настроить ширину боковой панели библиотеки игр",
      "Hide specific elements from the library home screen": "Скрыть определенные элементы с домашней страницы библиотеки",
      "Apply a refreshed modern design to the Friends & Chat panel | BIG WIP": "Применить обновленный дизайн к панели друзей и чата | В разработке",
      "Choose the visual density style for dropdown menus": "Выберите стиль плотности для выпадающих меню",
      "Enable experimental redesigned settings interface | BIG WIP": "Включить экспериментальный обновленный интерфейс настроек | В разработке",
      "Apply blur effect to your account/login name in the Account Menu": "Применить эффект размытия к имени вашего аккаунта в меню",
      "Apply blur effect to your wallet balance in the Account Menu": "Применить эффект размытия к балансу кошелька в меню",
      "Completely hide your wallet balance from the account button": "Полностью скрыть баланс кошелька с кнопки аккаунта",

      // Values
      "Sharp": "Острый",
      "Rounded Square": "Закругленный квадрат",
      "Circle": "Круг",
      "no": "Нет",
      "yes": "Да",
      "Steam Default": "По умолчанию Steam",
      "None": "Нет",
      "[Collapse] Only": "Только [Свернуть]",
      "[Expand] Only": "Только [Развернуть]",
      "[Close] Only": "Только [Закрыть]",
      "[Collapse + Expand]": "[Свернуть + Развернуть]",
      "[Collapse + Close]": "[Свернуть + Закрыть]",
      "[Expand + Close]": "[Развернуть + Закрыть]",
      "All": "Все",
      "Left Side": "Слева",
      "Right Side": "Справа",
      "Small": "Маленький",
      "Default": "По умолчанию",
      "Medium": "Средний",
      "Big": "Большой",
      "[All] Center": "[Все] По центру",
      "[All] Left Side": "[Все] Слева",
      "[All] Right Side": "[Все] Справа",
      "[Game Links] Right Side Only": "[Ссылки игры] Только справа",
      "[Game Links] Left Side Only": "[Ссылки игры] Только слева",
      "[Compact] Left Side": "[Компактно] Слева",
      "[Compact] Right Side": "[Компактно] Справа",
      "[What's New] Only": "Только [Что нового]",
      "[Add Shelf] Only": "Только [Добавить полку]",
      "Both": "Оба",
      "Disabled": "Отключено",
      "Enabled": "Включено",
      "Legacy": "Устаревший",
      "Spacious": "Просторный",
      "Compact": "Компактный"
    }
  };

  // Helper to get active language
  function getSteamLanguage() {
    if (typeof window !== 'undefined') {
      if (window.g_Language) return window.g_Language.toLowerCase();
    }
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang) return htmlLang.toLowerCase();
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language.toLowerCase();
    }
    return 'english';
  }

  const lang = getSteamLanguage();
  // Map standard ISO codes and Steam language names to keys
  let activeLang = 'en';
  if (lang.startsWith('ja') || lang === 'japanese') {
    activeLang = 'ja';
  } else if (lang.startsWith('ru') || lang === 'russian') {
    activeLang = 'ru';
  }

  // If active language is English or not supported, do nothing
  if (activeLang === 'en') return;

  const dict = TRANSLATIONS[activeLang];
  let isTranslating = false;

  // Helper to translate a single text node
  function translateNode(node) {
    if (isTranslating) return;
    const text = node.nodeValue.trim();
    if (dict[text]) {
      isTranslating = true;
      node.nodeValue = dict[text];
      isTranslating = false;
    }
  }

  // Walk element and translate all child text nodes
  function translateElement(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      translateNode(node);
    }
  }

  // Observe and translate
  function init() {
    translateElement(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          translateNode(mutation.target);
        } else if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              translateElement(node);
            } else if (node.nodeType === Node.TEXT_NODE) {
              translateNode(node);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
