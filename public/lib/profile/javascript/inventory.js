document.addEventListener('DOMContentLoaded', () => {
    const inventoryForm = document.getElementById('inventory-form');
    const inventoryList = document.getElementById('inventory-list');
    const currencyDisplay = document.getElementById('currency-display');

    let inventory = {
        items: [],
        currency: {
            cp: 0,
            sp: 0,
            gp: 0,
            pp: 0
        }
    };

    inventoryForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const itemName = document.getElementById('item-name').value;
        const itemQuantity = document.getElementById('item-quantity').value;

        const newItem = {
            name: itemName,
            quantity: parseInt(itemQuantity)
        };

        addItemToInventory(newItem);
        inventoryForm.reset();
    });

    function addItemToInventory(item) {
        inventory.items.push(item);
        updateInventoryDisplay();
    }

    function updateInventoryDisplay() {
        inventoryList.innerHTML = '';
        inventory.items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.quantity} x ${item.name}`;
            inventoryList.appendChild(li);
        });
    }

    function updateGold(action) {
        const copper = parseInt(document.getElementById('copper').value) || 0;
        const silver = parseInt(document.getElementById('silver').value) || 0;
        const gold = parseInt(document.getElementById('gold').value) || 0;
        const platinum = parseInt(document.getElementById('platinum').value) || 0;

        if (action === 'add') {
            inventory.currency.cp += copper;
            inventory.currency.sp += silver;
            inventory.currency.gp += gold;
            inventory.currency.pp += platinum;
        } else if (action === 'subtract') {
            inventory.currency.cp -= copper;
            inventory.currency.sp -= silver;
            inventory.currency.gp -= gold;
            inventory.currency.pp -= platinum;
        }

        convertCurrency();
        updateCurrencyDisplay();
        clearCurrencyFields();
    }

    function convertCurrency() {
        // Convert upwards
        while (inventory.currency.cp >= 10) {
            inventory.currency.cp -= 10;
            inventory.currency.sp += 1;
        }
        while (inventory.currency.sp >= 10) {
            inventory.currency.sp -= 10;
            inventory.currency.gp += 1;
        }
        while (inventory.currency.gp >= 10) {
            inventory.currency.gp -= 10;
            inventory.currency.pp += 1;
        }

        // Convert downwards
        while (inventory.currency.pp > 0 && inventory.currency.gp < 0) {
            inventory.currency.pp -= 1;
            inventory.currency.gp += 10;
        }
        while (inventory.currency.gp > 0 && inventory.currency.sp < 0) {
            inventory.currency.gp -= 1;
            inventory.currency.sp += 10;
        }
        while (inventory.currency.sp > 0 && inventory.currency.cp < 0) {
            inventory.currency.sp -= 1;
            inventory.currency.cp += 10;
        }
    }

    function updateCurrencyDisplay() {
        document.getElementById('cp').textContent = inventory.currency.cp;
        document.getElementById('sp').textContent = inventory.currency.sp;
        document.getElementById('gp').textContent = inventory.currency.gp;
        document.getElementById('pp').textContent = inventory.currency.pp;
    }

    function clearCurrencyFields() {
        document.getElementById('copper').value = 0;
        document.getElementById('silver').value = 0;
        document.getElementById('gold').value = 0;
        document.getElementById('platinum').value = 0;
    }
});
