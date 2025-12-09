		// Compact Buttons - Shadow code
new MutationObserver((mutations) => {
	mutations.forEach(function(mutation) {
		mutation.addedNodes.forEach(function(addedNode) {
			if (addedNode.classList && addedNode.classList.contains('_3mz8wQ6Q44B8P7pzPP4Iyw')) {
				const title_bar_controls = document.querySelector('._3cykd-VfN_xBxf3Qxriccm')
				const bottom_bar_controls = document.querySelector('._1_yS5UP7el0aN4vntx3dx')
				changeOffset(bottom_bar_controls, title_bar_controls.offsetWidth)
				new MutationObserver((mutationsList) => {
					for (const _ of mutationsList) {
						changeOffset(bottom_bar_controls, title_bar_controls.offsetWidth)
					}
				}).observe(title_bar_controls, { attributes: true, childList: true, subtree: true, characterData: true });
			}
		});
	});
}).observe(document.body, { childList: true, subtree: true });

function changeOffset(bottom, offsetWidth) {
	bottom.style.setProperty('right', `${offsetWidth + 121}px`, 'important')
};
