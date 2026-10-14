// Hide avatar frames everywhere

;(() => {
  "use strict"

  const FRAMES = [
    { selector: ".X_mJE4BYV5StDPwZhSiAu.avatarFrame", classes: ["X_mJE4BYV5StDPwZhSiAu", "avatarFrame"] },
    { selector: "._3fM0F85j3aWVzr4RJM9-eu",           classes: ["_3fM0F85j3aWVzr4RJM9-eu"] },
    { selector: "._2nPONxDUmK4rQXzK4Y3vG2",           classes: ["_2nPONxDUmK4rQXzK4Y3vG2"] },
  ]

  function removeFrames() {
    for (const { selector, classes } of FRAMES) {
      for (const frame of document.querySelectorAll(selector)) {
        frame.querySelectorAll("img").forEach(img => img.remove())
        frame.classList.remove(...classes)
      }
    }
  }

  // Once per frame
  let frame = null
  new MutationObserver(() => {
    frame ??= requestAnimationFrame(() => {
      frame = null
      removeFrames()
    })
  }).observe(document.body, { childList: true, subtree: true })

  removeFrames()
})()
