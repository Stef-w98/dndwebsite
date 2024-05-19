import { openSidebar, closeSidebar } from './uiHelpers.js';
import { fetchAndDisplayCities, addCity } from './cityManagement.js';
import { setupDrawingTools, fetchAndDisplayRegions } from './regionManagement.js';
import { fetchAndDisplayWeatherMarkers } from './weatherManagement.js';

let map = L.map('fantasyMap', { crs: L.CRS.Simple, minZoom: 1, maxZoom: 4 });
const bounds = [[0, 0], [562.5, 1000]];
L.imageOverlay('./Dryle.png', bounds).addTo(map);
map.fitBounds(bounds);

let citiesLayerGroup = L.layerGroup().addTo(map);
let regionsLayerGroup = L.layerGroup().addTo(map);
let weatherLayerGroup = L.layerGroup().addTo(map);

let overlays = {
    "Cities": citiesLayerGroup,
    "Regions": regionsLayerGroup,
    "Weather": weatherLayerGroup
};

L.control.layers(null, overlays, { collapsed: false }).addTo(map);

window.addEventListener('load', async () => {
    const mapData = await fetchMapData();
    fetchAndDisplayCities(citiesLayerGroup, map, mapData.cities);
    fetchAndDisplayRegions(regionsLayerGroup, map, mapData.regions, mapData.coordinates);
    fetchAndDisplayWeatherMarkers(weatherLayerGroup, map, mapData.weatherMarkers);

    setupDrawingTools(map);
    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    document.getElementById('addCityForm').addEventListener('submit', handleCityFormSubmit);
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
        } catch (error) {
            alert(`Failed to add city: ${error.message}`);
        }
    } else {
        document.getElementById('cityFormModal').style.display = 'none';
    }
}

function isValidLocation(lat, lng) {
    const maxLat = 562;
    const minLat = 0;
    const maxLng = 1000;
    const minLng = 0;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
