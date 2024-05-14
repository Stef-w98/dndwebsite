document.addEventListener('DOMContentLoaded', function() {
    fetchCharacters();

    var modal = document.getElementById("addCharacterModal");
    var btn = document.querySelector(".add-card");
    var span = document.getElementsByClassName("close")[0];

    // Function to show the modal
    function showModal() {
        modal.style.display = "block";
    }

    // Function to hide the modal
    function hideModal() {
        modal.style.display = "none";
    }

    // Adjusted to directly call showModal instead of inline function
    btn.addEventListener('click', showModal);

    span.onclick = hideModal;

    window.onclick = function(event) {
        if (event.target == modal) {
            hideModal();
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            // Confirm before hiding the modal
            if (confirm("Are you sure you want to close this form? Unsaved changes will be lost.")) {
                hideModal();
            }
        }
    };

    document.getElementById('addCharacterForm').onsubmit = async function(event) {
        event.preventDefault();

        // Confirm before submitting the form
        if (!confirm("Are you sure you want to submit this form?")) {
            return; // Stop the form submission if the user cancels
        }

        const formData = new FormData(event.target);
        const character = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/addCharacters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(character),
            });

            if (!response.ok) throw new Error('Failed to add character');

            hideModal();
            event.target.reset(); // Reset form fields
            // Invalidate the cache because the list of characters has changed
            localStorage.removeItem('charactersCache');
            fetchCharacters();
        } catch (error) {
            console.error('Error adding character:', error);
        }
    };
});

async function fetchCharacters() {
    const container = document.getElementById('cards-container');
    container.innerHTML = ''; // Clear existing cards before repopulating

    let characters;
    // Try to load characters from cache first
    const cachedCharacters = localStorage.getItem('charactersCache');
    if (cachedCharacters) {
        characters = JSON.parse(cachedCharacters);
    } else {
        try {
            const response = await fetch('/api/characters');
            if (!response.ok) throw new Error('Failed to fetch characters');
            characters = await response.json();

            // Cache the fetched characters data
            localStorage.setItem('charactersCache', JSON.stringify(characters));
        } catch (error) {
            console.error('Error fetching characters:', error);
            characters = []; // Ensure characters is an array for the forEach loop below
        }
    }

    characters.forEach(char => {
        const card = createCharacterCard(char);
        container.appendChild(card);
    });

    // Ensure the "Add Character" button is displayed after characters
    addAddCharacterCard();
}

function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.src = `assets/${character.name.replace(/\s+/g, '').toLowerCase()}.png`; // Assuming this path is correct
    img.alt = character.name;
    img.className = 'card-img-top'; // For styling purposes

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const name = document.createElement('h3');
    name.textContent = character.name;
    name.className = 'card-title';

    const details = document.createElement('p');
    details.textContent = `${character.race} ${character.class}, Level ${character.level}`;
    details.className = 'card-text';

    const armourclass = document.createElement('p');
    armourclass.textContent = `AC: ${character.armourclass}`;
    armourclass.className = 'card-text';

    const backstory = document.createElement('p');
    backstory.textContent = character.backstory; // Assuming `description` is a summary of the character
    backstory.className = 'card-text';

    card.appendChild(img);
    cardBody.appendChild(name);
    cardBody.appendChild(details);
    cardBody.appendChild(armourclass);
    cardBody.appendChild(backstory);
    card.appendChild(cardBody);

    return card;
}

function addAddCharacterCard() {
    const container = document.getElementById('cards-container');
    // Create the "Add Character" card/button
    const addButtonCard = document.createElement('div');
    addButtonCard.className = 'card add-card';
    addButtonCard.innerHTML = '<span>+ Add Character</span>'; // Customize as needed
    addButtonCard.onclick = function() {
        document.getElementById("addCharacterModal").style.display = "block";
    };
    container.appendChild(addButtonCard);
}
