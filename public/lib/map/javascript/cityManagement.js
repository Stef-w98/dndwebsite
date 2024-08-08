import { openSidebar } from './uiHelpers.js';

// Define custom Leaflet icon for red marker
const redIcon = L.icon({
    iconUrl: './assets/general/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export async function fetchAndDisplayCities(citiesLayerGroup, map, cities) {
    citiesLayerGroup.clearLayers(); // Clear existing city markers before adding new ones

    cities.forEach(city => {
        const icon = city.capital ? redIcon : new L.Icon.Default();
        const marker = L.marker([city.latitude, city.longitude], { title: city.name, icon }).addTo(citiesLayerGroup)
            .bindTooltip(city.name); // Display city name on hover

        marker.on('click', () => {
            let content = `<h2>${city.name}</h2><p>${city.description}</p>`;
            content += `<button id="details-button" onclick="openDetailsPage(\`${city.name}\`, '${city.id}')">View Details</button>`;
            openSidebar(content);

            // Store city data in localStorage
            localStorage.setItem('selectedCity', JSON.stringify(city));
        });
    });
    citiesLayerGroup.addTo(map);
}

window.openDetailsPage = function(name, id) {
    window.location.href = `cityDetails.html?name=${encodeURIComponent(name)}&id=${encodeURIComponent(id)}`;
};

export async function addCity(cityData) {
    // Assuming /api/addCity endpoint is correctly set up to receive POST requests and add cities
    const response = await fetch('/api/addCity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cityData)
    });

    if (response.ok) {
        const newCity = await response.json();
        return newCity;
    } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
    }
}
