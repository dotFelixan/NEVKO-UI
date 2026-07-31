;(() => {
  "use strict"

  const SELECTORS = [
    { selector: '.X_mJE4BYV5StDPwZhSiAu.avatarFrame', classes: ['X_mJE4BYV5StDPwZhSiAu', 'avatarFrame'] },
    { selector: '._3fM0F85j3aWVzr4RJM9-eu',           classes: ['_3fM0F85j3aWVzr4RJM9-eu'] },
    { selector: '._2nPONxDUmK4rQXzK4Y3vG2',           classes: ['_2nPONxDUmK4rQXzK4Y3vG2'] },
  ]

  function cleanUp() {
    SELECTORS.forEach(({ selector, classes }) => {
      document.querySelectorAll(selector).forEach(el => {
        el.querySelectorAll('img').forEach(img => img.remove())
        el.classList.remove(...classes)
      })
    })
  }

  let scheduled = false

  const observer = new MutationObserver(() => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      cleanUp()
    })
  })

  cleanUp()
  observer.observe(document.body, { childList: true, subtree: true })
})()
