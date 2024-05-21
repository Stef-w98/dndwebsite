let map, isDrawing = false, polygonPoints = [], polygon;
let citiesLayerGroup = L.layerGroup();
let regionsLayerGroup = L.layerGroup();

window.addEventListener('load', async () => {
    map = L.map('fantasyMap', { crs: L.CRS.Simple, minZoom: 1, maxZoom: 4 });
    const bounds = [[0, 0], [562.5, 1000]];
    L.imageOverlay('./Dryle.png', bounds).addTo(map);
    map.fitBounds(bounds);

    const mapData = await fetchMapData();
    fetchAndDisplayCities(citiesLayerGroup, map, mapData.cities);
    fetchAndDisplayRegions(regionsLayerGroup, map, mapData.regions, mapData.coordinates);

    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    setupDrawingTools();
    document.getElementById('addCityForm').addEventListener('submit', handleCityFormSubmit);

    let baseLayers = { "Base Map": L.imageOverlay('./Dryle.png', bounds).addTo(map) };
    let overlays = { "Cities": citiesLayerGroup, "Regions": regionsLayerGroup };

    L.control.layers(baseLayers, overlays, {collapsed: false}).addTo(map);

    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
    }
});

async function fetchMapData() {
    const response = await fetch('/api/map-data');
    if (response.ok) {
        return await response.json();
    } else {
        console.error('Failed to load map data.');
        return { cities: [], regions: [], coordinates: [], weatherMarkers: [] };
    }
}

function isValidLocation(lat, lng) {
    const maxLat = 562;
    const minLat = 0;
    const maxLng = 1000;
    const minLng = 0;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

document.getElementById('addCityForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const cityData = {};
    formData.forEach((value, key) => {
        cityData[key] = value;
    });

    cityData.latitude = window.clickedLocation.lat;
    cityData.longitude = window.clickedLocation.lng;

    if (!isValidLocation(cityData.latitude, cityData.longitude)) {
        alert('The selected location is outside of the map boundaries. Please select a location within the map.');
        document.getElementById('cityFormModal').style.display = 'none';
        return;
    }

    const isConfirmed = confirm('Are you sure you want to add this city?');
    if (isConfirmed) {
        await addCity(cityData);
        document.getElementById('cityFormModal').style.display = 'none';
        e.target.reset();
    } else {
        document.getElementById('cityFormModal').style.display = 'none';
    }
});

async function addCity(cityData) {
    const response = await fetch('/api/addCity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cityData)
    });

    if (response.ok) {
        const newCity = await response.json();
        citiesLayerGroup.clearLayers();
        const mapData = await fetchMapData();
        fetchAndDisplayCities(citiesLayerGroup, map, mapData.cities);
    } else {
        const errorData = await response.json();
        alert(`Failed to add city: ${errorData.error}`);
    }
}

// Define custom Leaflet icon for red marker
const redIcon = L.icon({
    iconUrl: './lib/map/assets/general/marker-icon-red.png',
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
        console.log(`City: ${city.name}, Capital: ${city.capital}, Using Icon: ${city.capital ? 'Red' : 'Default'}`);
        const marker = L.marker([city.latitude, city.longitude], { title: city.name, icon }).addTo(citiesLayerGroup)
            .bindTooltip(city.name); // Display city name on hover

        marker.on('click', () => {
            let content = `<h2>${city.name}</h2>`;
            Object.entries(city).forEach(([key, value]) => {
                if (value && key !== 'latitude' && key !== 'longitude' && key !== 'id' && key !== 'createdAt') { // Exclude coordinates, id, and createdAt from the sidebar
                    // Make key more readable
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Replace underscores with spaces and capitalize
                    content += `<p><strong>${formattedKey}:</strong> ${value}</p>`;
                }
            });
            openSidebar(content); // Assuming openSidebar function is defined in uiHelpers.js and correctly imports here
        });
    });
    citiesLayerGroup.addTo(map);
}

async function fetchAndDisplayRegions(regionsLayerGroup, map, regions, coordinates) {
    regionsLayerGroup.clearLayers();

    regions.forEach(region => {
        const regionCoords = coordinates.filter(coord => coord.regionid === region.id);
        const latlngs = regionCoords.map(c => [c.latitude, c.longitude]);
        const randomColor = getRandomColor();
        const polygon = L.polygon(latlngs, {
            color: randomColor,
            fillColor: randomColor,
            fillOpacity: 0.7,
            weight: 2,
        })
            .bindTooltip(`<strong>${region.regionname}</strong>`, { permanent: false, direction: 'center', className: 'region-label' })
            .addTo(regionsLayerGroup);

        polygon.on('click', () => {
            openSidebarWithRegionInfo(region);
        });

        polygon.on('mouseover', function() {
            this.setStyle({
                weight: 5,
                color: '#666',
                fillOpacity: 0.9
            });
        }).on('mouseout', function() {
            this.setStyle({
                weight: 2,
                color: randomColor,
                fillOpacity: 0.7
            });
        });
    });

    regionsLayerGroup.addTo(map);
}

function getRandomColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);

    if (g > 180) {
        g = g / 2;
        r = r + 50 < 255 ? r + 50 : 255;
        b = b + 50 < 255 ? b + 50 : 255;
    }

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
