import { openSidebar, closeSidebar } from './uiHelpers.js';
import { fetchAndDisplayCities, addCity } from './cityManagement.js';
import { setupDrawingTools, fetchAndDisplayRegions } from './regionManagement.js';
import { fetchAndDisplayWeatherMarkers } from './weatherManagement.js';

let map = L.map('fantasyMap', { crs: L.CRS.Simple, minZoom: 1, maxZoom: 4 });
const bounds = [[0, 0], [562.5, 1000]];
L.imageOverlay('./assets/general/Dryle.png', bounds).addTo(map);
map.fitBounds(bounds);

let citiesLayerGroup = L.layerGroup().addTo(map);
let regionsLayerGroup = L.layerGroup().addTo(map);
let weatherLayerGroup = L.layerGroup().addTo(map);

let overlays = {
    "Cities": citiesLayerGroup,
    "Regions": regionsLayerGroup,
    "Weather": weatherLayerGroup
};

let addCityMode = false;
let drawPolygonMode = false;

window.addEventListener('load', async () => {
    const mapData = await fetchMapData();
    fetchAndDisplayCities(citiesLayerGroup, map, mapData.cities);
    fetchAndDisplayRegions(regionsLayerGroup, map, mapData.regions, mapData.coordinates);
    fetchAndDisplayWeatherMarkers(weatherLayerGroup, map, mapData.weatherMarkers);

    setupDrawingTools(map);
    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    document.getElementById('addCityForm').addEventListener('submit', handleCityFormSubmit);
    document.getElementById('addCityButton').addEventListener('click', () => toggleAddCityMode());
    document.getElementById('drawPolygon').addEventListener('click', () => toggleDrawPolygonMode());
    document.querySelector('.hamburger-icon').addEventListener('click', toggleLeftSidebar);

    document.getElementById('toggle-cities').addEventListener('change', function() {
        if (this.checked) {
            citiesLayerGroup.addTo(map);
        } else {
            citiesLayerGroup.remove();
        }
    });

    document.getElementById('toggle-regions').addEventListener('change', function() {
        if (this.checked) {
            regionsLayerGroup.addTo(map);
        } else {
            regionsLayerGroup.remove();
        }
    });

    document.getElementById('toggle-weather').addEventListener('change', function() {
        if (this.checked) {
            weatherLayerGroup.addTo(map);
        } else {
            weatherLayerGroup.remove();
        }
    });

    map.on('click', function(e) {
        console.log("Map clicked");
        if (addCityMode) {
            console.log("Add city mode enabled. Clicking on map should show form.");
            window.clickedLocation = e.latlng;
            document.getElementById('cityFormModal').style.display = 'block';
        } else if (drawPolygonMode) {
            // Add logic for drawing polygon here
        } else {
            // Handle clicking on existing regions to show sidebar with region info
        }
    });

    window.onclick = function(event) {
        const modal = document.getElementById('cityFormModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    document.querySelector('.close').onclick = function() {
        document.getElementById('cityFormModal').style.display = 'none';
    };
});

async function fetchMapData() {
    const response = await fetch(`/api/map-data?ts=${Date.now()}`);
    if (response.ok) {
        return await response.json();
    } else {
        console.error('Failed to load map data.');
        return { cities: [], regions: [], coordinates: [], weatherMarkers: [] };
    }
}

async function handleCityFormSubmit(e) {
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
        try {
            const newCity = await addCity(cityData);
            citiesLayerGroup.clearLayers();
            const mapData = await fetchMapData();
            fetchAndDisplayCities(citiesLayerGroup, map, mapData.cities);
            document.getElementById('cityFormModal').style.display = 'none';
            e.target.reset();
            toggleAddCityMode(false);
        } catch (error) {
            alert(`Failed to add city: ${error.message}`);
        }
    } else {
        document.getElementById('cityFormModal').style.display = 'none';
    }
}

function toggleAddCityMode(forceDisable = false) {
    addCityMode = forceDisable ? false : !addCityMode;
    console.log("Toggle Add City Mode called. New value: " + addCityMode);
    const addCityButton = document.getElementById('addCityButton');
    const drawPolygonButton = document.getElementById('drawPolygon');
    addCityButton.textContent = addCityMode ? 'Cancel Add City' : 'Add City';
    drawPolygonButton.disabled = addCityMode;
    if (addCityMode) {
        alert('Click on the map to add a city.');
    }
}

function toggleDrawPolygonMode() {
    drawPolygonMode = !drawPolygonMode;
    console.log("Toggle Draw Polygon Mode called. New value: " + drawPolygonMode);
    const drawPolygonButton = document.getElementById('drawPolygon');
    const addCityButton = document.getElementById('addCityButton');
    drawPolygonButton.textContent = drawPolygonMode ? 'Stop Drawing' : 'Add Region';
    addCityButton.disabled = drawPolygonMode;
    if (drawPolygonMode) {
        alert('Click on the map to start drawing a region.');
    }
}

function toggleLeftSidebar() {
    const leftSidebar = document.getElementById('left-sidebar');
    leftSidebar.classList.toggle('open');
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    hamburgerIcon.style.left = leftSidebar.classList.contains('open') ? '250px' : '10px';
}

function isValidLocation(lat, lng) {
    const maxLat = 562;
    const minLat = 0;
    const maxLng = 1000;
    const minLng = 0;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
