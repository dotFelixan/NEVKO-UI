function handleClick(event) {
    const clickedElement = event.target.closest('._7AlhCx3XGzBeIrQaCneUD');
    if (clickedElement) {
        const elementToActivate = clickedElement.querySelector('._19axKcqYRuaJ8vdYKYmtTQ');
        if (elementToActivate) {
            elementToActivate.click();
        }
    }
}

document.addEventListener('click', handleClick);

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('_7AlhCx3XGzBeIrQaCneUD')) {
                    }
                }
            });
        }
    });
});

