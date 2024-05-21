import { openSidebar, closeSidebar } from './uiHelpers.js';
import { fetchAndDisplayCities, addCity } from './cityManagement.js';
import { setupDrawingTools, fetchAndDisplayRegions, handleRegionClick } from './regionManagement.js';
import { fetchAndDisplayWeatherMarkers } from './weatherManagement.js';

let map = L.map('fantasyMap', { crs: L.CRS.Simple, minZoom: 1, maxZoom: 4 });
const bounds = [[0, 0], [562.5, 1000]];
L.imageOverlay('./assets/general/Dryle.png', bounds).addTo(map);
map.fitBounds(bounds);

let citiesLayerGroup = L.layerGroup().remove(map); // .addTo(map);
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

    const dateInput = document.getElementById('dateInput');
    const initialDate = 'Aestas 53, 1043';
    dateInput.value = initialDate;
    const seed = generateSeedFromDate(initialDate);
    console.log(`Initial seed: ${seed} from date: ${initialDate}`);
    fetchAndDisplayWeatherMarkers(weatherLayerGroup, map, seed, mapData.weatherConditions);

    setupDrawingTools(map);
    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    document.getElementById('addCityForm').addEventListener('submit', handleCityFormSubmit);
    document.getElementById('addCityButton').addEventListener('click', () => toggleAddCityMode());
    document.getElementById('drawPolygon').addEventListener('click', () => toggleDrawPolygonMode());
    document.querySelector('.hamburger-icon').addEventListener('click', toggleLeftSidebar);

    document.getElementById('toggle-cities').checked = false;
    document.getElementById('toggle-regions').checked = false;
    document.getElementById('toggle-weather').checked = true;

    document.getElementById('toggle-cities').addEventListener('change', function() {
        console.log("Toggle Cities: " + this.checked);
        if (this.checked) {
            citiesLayerGroup.addTo(map);
        } else {
            map.removeLayer(citiesLayerGroup);
        }
    });

    document.getElementById('toggle-regions').addEventListener('change', function() {
        console.log("Toggle Regions: " + this.checked);
        if (this.checked) {
            regionsLayerGroup.addTo(map);
        } else {
            map.removeLayer(regionsLayerGroup);
        }
    });

    document.getElementById('toggle-weather').addEventListener('change', function() {
        console.log("Toggle Weather: " + this.checked);
        if (this.checked) {
            weatherLayerGroup.addTo(map);
        } else {
            map.removeLayer(weatherLayerGroup);
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

    populateRegionList(mapData.regions);

    // Re-fetch weather markers when the date changes
    dateInput.addEventListener('change', () => {
        const newDate = dateInput.value;
        const newSeed = generateSeedFromDate(newDate);
        console.log(`New seed: ${newSeed} from date: ${newDate}`);
        fetchAndDisplayWeatherMarkers(weatherLayerGroup, map, newSeed, mapData.weatherConditions);
    });
});

function generateSeedFromDate(dateString) {
    const [month, day, year] = dateString.split(' ');
    const monthIndex = {
        "Hiems": 0,
        "Vernalis": 1,
        "Aestas": 2,
        "Autumnus": 3,
        "Nix": 4
    }[month] || 0;
    const seedDate = new Date(year, monthIndex, parseInt(day)).getTime();
    console.log(`Generated seed date: ${seedDate} for date string: ${dateString}`);
    return seedDate;
}

async function fetchMapData() {
    const response = await fetch(`/api/map-data?ts=${Date.now()}`);
    if (response.ok) {
        return await response.json();
    } else {
        console.error('Failed to load map data.');
        return { cities: [], regions: [], coordinates: [], weatherMarkers: [], weatherConditions: [] };
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

function populateRegionList(regions) {
    const regionList = document.getElementById('regionList');
    regions.forEach(region => {
        const regionItem = document.createElement('div');
        regionItem.className = 'region-item';
        regionItem.textContent = region.regionname;
        regionItem.addEventListener('click', () => handleRegionClick(region.id));
        regionList.appendChild(regionItem);
    });
}
