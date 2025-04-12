// Function to run the text replacement
function replaceDriverText() {
  // Try different selector approaches
  const selectors = [
    '._3jMlJm4PQCA8SfNlUR99Fo',
    '*[class*="_3jMlJm4PQCA8SfNlUR99Fo"]', // Partial class match
    '*[class^="_3jMlJm4PQCA8SfNlUR99Fo"]'  // Class starts with
  ];
  
  let foundElements = false;
  
  // Try each selector
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    
    if (elements.length > 0) {
      foundElements = true;
      
      elements.forEach((element) => {
        // Check the element itself and all its child text nodes
        const processNode = (node) => {
          let textChanged = false;
          
          // Process text nodes
          if (node.nodeType === Node.TEXT_NODE) {
            const originalText = node.textContent;
            let newText = originalText;
            
            if (originalText.includes('DRIVER = 1')) {
              newText = newText.replace(/DRIVER\s*=\s*1/g, 'Main');
              textChanged = true;
            }
            if (originalText.includes('DRIVER = 2')) {
              newText = newText.replace(/DRIVER\s*=\s*2/g, 'Library');
              textChanged = true;
            }
            if (originalText.includes('DRIVER = 3')) {
              newText = newText.replace(/DRIVER\s*=\s*3/g, 'Misc');
              textChanged = true;
            }
            
            if (textChanged) {
              node.textContent = newText;
              
              // Apply styling to parent element
              if (node.parentElement) {
                node.parentElement.style.color = "#8b929a";
                node.parentElement.style.fontWeight = "bold";
                node.parentElement.style.textAlign = "center";
                node.parentElement.style.display = "block"; 
                node.parentElement.style.width = "100%";
                node.parentElement.style.fontSize = "1.1em";
                node.parentElement.style.marginBottom = "-8px"; // Use negative bottom margin instead
              }
              
              // Look for parent to remove element
              let currentElement = node.parentElement;
              while (currentElement) {
                if (currentElement.classList.contains('_2VcTlXFC64Jtg9gvtT6cmY')) {
                  const elementToRemove = currentElement.querySelector('._1aw7cA3mAZfWt8idAlVJWi');
                  if (elementToRemove) {
                    elementToRemove.remove();
                  }
                  break;
                }
                currentElement = currentElement.parentElement;
              }
            }
          } 
          // Process element nodes (recursively)
          else if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this element has only text (no child elements)
            if (node.childNodes.length === 1 && node.firstChild.nodeType === Node.TEXT_NODE) {
              const originalText = node.textContent;
              let newText = originalText;
              let textChanged = false;
              
              if (originalText.includes('DRIVER = 1')) {
                newText = 'Main';
                textChanged = true;
              } else if (originalText.includes('DRIVER = 2')) {
                newText = 'Library';
                textChanged = true;
              } else if (originalText.includes('DRIVER = 3')) {
                newText = 'Misc';
                textChanged = true;
              }
              
              if (textChanged) {
                node.textContent = newText;
                
                // Apply enhanced styling
                node.style.color = "#8b929a";
                node.style.fontWeight = "bold";
                node.style.textAlign = "center";
                node.style.display = "block";
                node.style.width = "100%";
                node.style.fontSize = "1.1em";
                node.style.marginBottom = "-8px"; // Use negative bottom margin instead
                
                // Check for parent with class to remove element
                const parentElement = node.closest('._2VcTlXFC64Jtg9gvtT6cmY');
                if (parentElement) {
                  const elementToRemove = parentElement.querySelector('._1aw7cA3mAZfWt8idAlVJWi');
                  if (elementToRemove) {
                    elementToRemove.remove();
                  }
                }
              }
            } else {
              // Process all child nodes
              node.childNodes.forEach(processNode);
            }
          }
        };
        
        // Start processing from the element
        processNode(element);
      });
    }
  }
  
  if (!foundElements) {
    // Try again after a delay to catch dynamically added elements
    setTimeout(replaceDriverText, 1000);
  }
}

// Run immediately and also set up to run when DOM changes
replaceDriverText();

// Set up a MutationObserver to detect when new elements are added
const observer = new MutationObserver((mutations) => {
  let shouldRun = false;
  
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length > 0) {
      shouldRun = true;
    }
  });
  
  if (shouldRun) {
    replaceDriverText();
  }
});

// Start observing the document with the configured parameters
observer.observe(document.body, { childList: true, subtree: true });

// Also run periodically to catch any missed changes
setInterval(replaceDriverText, 2000);