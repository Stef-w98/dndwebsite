function openTab(event, tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

async function fetchCityDetails(name, id) {
    try {
        // Fetch the city data from localStorage
        const city = JSON.parse(localStorage.getItem('selectedCity'));
        if (!city) {
            throw new Error('City data not found in localStorage.');
        }

        // Check if the city data matches the requested city
        if (city.name !== name || String(city.id) !== id) {
            throw new Error('City data in localStorage does not match expected city.');
        }

        document.querySelector('.header').innerText = city.name;
        document.querySelector('.description').innerText = city.description || 'No description available.';

        // Set a random default image if none is provided
        const defaultImages = [
            './assets/general/default.jpg',
            './assets/general/default2.jpg',
            './assets/general/default3.jpg',
            './assets/general/default4.jpg'
        ];
        const randomDefaultImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
        const imageUrl = city.image || randomDefaultImage;
        document.querySelector('.image-container img').src = imageUrl;

        // Dynamically create tabs and content based on city data
        const keysToExclude = ['latitude', 'longitude', 'id', 'created_at', 'name', 'description', 'image'];
        const tabContainer = document.querySelector('.tabs');
        let tabContentHtml = '';

        Object.entries(city).forEach(([key, value], index) => {
            if (value && !keysToExclude.includes(key)) {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const tabId = `tab-${key}`;

                // Create tab
                const tab = document.createElement('div');
                tab.className = `tab ${index === 0 ? 'active' : ''}`;
                tab.textContent = formattedKey;
                tab.onclick = (event) => openTab(event, tabId);
                tabContainer.appendChild(tab);

                // Create tab content
                tabContentHtml += `<div id="${tabId}" class="tab-content ${index === 0 ? 'active' : ''}">
                                        ${value}
                                    </div>`;
            }
        });

        // Append tab contents
        tabContainer.insertAdjacentHTML('afterend', tabContentHtml);

    } catch (error) {
        console.error('Error fetching city details:', error);
        document.querySelector('.header').innerText = 'Error loading city details. ' + error.message;
    }
}

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const cityName = urlParams.get('name');
    const cityId = urlParams.get('id');
    if (cityName && cityId) {
        fetchCityDetails(cityName, cityId);
    } else {
        document.querySelector('.header').innerText = 'City details not found. Missing city name or ID.';
    }
};
