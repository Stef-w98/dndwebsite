document.addEventListener('DOMContentLoaded', () => {
    const easyMDE = new EasyMDE({ element: document.getElementById('markdown-input') });
    const markdownOutput = document.getElementById('markdown-output');
    const inventoryForm = document.getElementById('inventory-form');
    const inventoryList = document.getElementById('inventory-list');

    easyMDE.codemirror.on('change', () => {
        const markdown = easyMDE.value();
        const html = easyMDE.options.previewRender(markdown);
        markdownOutput.innerHTML = html;
    });

    inventoryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const itemQuantity = document.getElementById('item-quantity').value;
        const itemName = document.getElementById('item-name').value;

        const newItem = {
            quantity: itemQuantity,
            name: itemName,
        };

        const response = await fetch('/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newItem),
        });

        if (response.ok) {
            addItemToList(newItem);
            inventoryForm.reset();
        } else {
            console.error('Failed to add item to inventory');
        }
    });

    async function fetchInventory() {
        const response = await fetch('/inventory');
        const items = await response.json();
        items.forEach(addItemToList);
    }

    function addItemToList(item) {
        const li = document.createElement('li');
        li.textContent = `${item.quantity} | ${item.name}`;
        inventoryList.appendChild(li);
    }

    fetchInventory();
});

function applyMarkdown(type) {
    const markdownInput = document.getElementById('markdown-input');
    let selectedText = markdownInput.value.substring(markdownInput.selectionStart, markdownInput.selectionEnd);
    let beforeText = markdownInput.value.substring(0, markdownInput.selectionStart);
    let afterText = markdownInput.value.substring(markdownInput.selectionEnd);

    if (type === 'bold') {
        selectedText = `**${selectedText}**`;
    } else if (type === 'italic') {
        selectedText = `*${selectedText}*`;
    } else if (type === 'underline') {
        selectedText = `<u>${selectedText}</u>`;
    } else if (type === 'heading') {
        selectedText = `# ${selectedText}`;
    }

    markdownInput.value = beforeText + selectedText + afterText;
    markdownInput.dispatchEvent(new Event('input')); // Trigger input event to update preview
}
