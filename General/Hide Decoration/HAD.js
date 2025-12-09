// Оптимизированный скрипт с debounce
const selectorsConfig = [
  { selector: '.X_mJE4BYV5StDPwZhSiAu.avatarFrame', classes: ['X_mJE4BYV5StDPwZhSiAu', 'avatarFrame'] },
  { selector: '._3fM0F85j3aWVzr4RJM9-eu', classes: ['_3fM0F85j3aWVzr4RJM9-eu'] },
  { selector: '._2nPONxDUmK4rQXzK4Y3vG2', classes: ['_2nPONxDUmK4rQXzK4Y3vG2'] }
];

let timeout;

function cleanUp() {
  // Отключаем observer на время очистки
  observer.disconnect();
  
  selectorsConfig.forEach(({ selector, classes }) => {
    document.querySelectorAll(selector).forEach(el => {
      // Удаляем ВСЕ img внутри
      el.querySelectorAll('img').forEach(img => img.remove());
      // Удаляем классы
      el.classList.remove(...classes);
    });
  });
  
  // Включаем observer обратно
  observer.observe(document.body, { childList: true, subtree: true });
}

function debouncedCleanUp() {
  clearTimeout(timeout);
  timeout = setTimeout(cleanUp, 10);
}

const observer = new MutationObserver(debouncedCleanUp);

// Первый запуск
cleanUp();