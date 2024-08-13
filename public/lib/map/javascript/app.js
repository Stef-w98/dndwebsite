import { openSidebar, closeSidebar } from './uiHelpers.js';
import { fetchAndDisplayCities, addCity } from './cityManagement.js';
import { setupDrawingTools, fetchAndDisplayRegions, handleRegionClick } from './regionManagement.js';
import { fetchAndDisplayWeatherMarkers } from './weatherManagement.js';

let currentMap;
let citiesLayerGroup = L.layerGroup();
let regionsLayerGroup = L.layerGroup();
let weatherLayerGroup = L.layerGroup();

const mapConfigurations = {
    Dryle: { bounds: [[0, 0], [562.5, 1000]], overlayUrl: './assets/maps/Dryle.png?v=1', hasData: true }, // Add a query string to the URL
    Untherlands: { bounds: [[0, 0], [562.5, 1000]], overlayUrl: './assets/maps/Untherlands.png', hasData: false }
};

// Function to switch maps
async function switchMap(mapConfig, mapName) {
    if (currentMap) {
        currentMap.remove();
    }
    document.getElementById('fantasyMap').innerHTML = ''; // Clear the container

    currentMap = L.map('fantasyMap', { crs: L.CRS.Simple, minZoom: 1, maxZoom: 4, fullscreenControl: true });
    L.imageOverlay(mapConfig.overlayUrl, mapConfig.bounds).addTo(currentMap);
    currentMap.fitBounds(mapConfig.bounds);

    // Clear existing layers
    citiesLayerGroup.clearLayers();
    regionsLayerGroup.clearLayers();
    weatherLayerGroup.clearLayers();

    if (mapConfig.hasData) {
        const mapData = await fetchMapData();
        fetchAndDisplayCities(citiesLayerGroup, currentMap, mapData.cities);
        fetchAndDisplayRegions(regionsLayerGroup, currentMap, mapData.regions, mapData.coordinates);
        const initialDate = document.getElementById('dateInput').value;
        const seed = generateSeedFromDate(initialDate);
        fetchAndDisplayWeatherMarkers(weatherLayerGroup, currentMap, seed, mapData.weatherConditions);

        // Set layer visibility according to the checkboxes
        if (document.getElementById('toggle-cities').checked) {
            citiesLayerGroup.addTo(currentMap);
        }
        if (document.getElementById('toggle-regions').checked) {
            regionsLayerGroup.addTo(currentMap);
        }
        if (document.getElementById('toggle-weather').checked) {
            weatherLayerGroup.addTo(currentMap);
        }
    }

    setupEventListeners();
}

document.getElementById('map1').addEventListener('change', function() {
    if (this.checked) {
        switchMap(mapConfigurations.Dryle, 'Dryle');
    }
});

document.getElementById('map2').addEventListener('change', function() {
    if (this.checked) {
        switchMap(mapConfigurations.Untherlands, 'Untherlands');
    }
});

function setupEventListeners() {
    currentMap.on('click', function(e) {
        if (addCityMode) {
            window.clickedLocation = e.latlng;
            document.getElementById('cityFormModal').style.display = 'block';
        } else if (drawPolygonMode) {
            // Add logic for drawing polygon here
        } else {
            // Handle clicking on existing regions to show sidebar with region info
        }
    });
}

let addCityMode = false;
let drawPolygonMode = false;

window.addEventListener('load', async () => {
    switchMap(mapConfigurations.Dryle, 'Dryle'); // Initial map load

    const dateInput = document.getElementById('dateInput');
    const initialDate = 'Aestas 53, 1043';
    dateInput.value = initialDate;

    setupDrawingTools(currentMap);
    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    document.getElementById('addCityForm').addEventListener('submit', handleCityFormSubmit);
    document.getElementById('addCityButton').addEventListener('click', () => toggleAddCityMode());
    document.getElementById('drawPolygon').addEventListener('click', () => toggleDrawPolygonMode());
    document.querySelector('.hamburger-icon').addEventListener('click', toggleLeftSidebar);

    document.getElementById('toggle-cities').checked = true;
    document.getElementById('toggle-regions').checked = false;
    document.getElementById('toggle-weather').checked = false;

    document.getElementById('toggle-cities').addEventListener('change', function() {
        if (this.checked) {
            citiesLayerGroup.addTo(currentMap);
        } else {
            currentMap.removeLayer(citiesLayerGroup);
        }
    });

    document.getElementById('toggle-regions').addEventListener('change', function() {
        if (this.checked) {
            regionsLayerGroup.addTo(currentMap);
        } else {
            currentMap.removeLayer(regionsLayerGroup);
        }
    });

    document.getElementById('toggle-weather').addEventListener('change', function() {
        if (this.checked) {
            weatherLayerGroup.addTo(currentMap);
        } else {
            currentMap.removeLayer(weatherLayerGroup);
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

    const mapData = await fetchMapData();
    populateRegionList(mapData.regions);

    // Re-fetch weather markers when the date changes
    dateInput.addEventListener('change', async () => {
        const newDate = dateInput.value;
        const newSeed = generateSeedFromDate(newDate);
        const mapData = await fetchMapData();
        fetchAndDisplayWeatherMarkers(weatherLayerGroup, currentMap, newSeed, mapData.weatherConditions);
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
        if (key !== 'files' && key !== 'capital') {
            cityData[key] = value;
        }
    });

    // Add the 'capital' field to the city data
    cityData.capital = document.getElementById('capitalSwitch').checked;

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
            const files = formData.getAll('files');
            const compressedFiles = await Promise.all(files.map(file => compressImage(file)));

            const newFormData = new FormData();
            for (const [key, value] of formData.entries()) {
                if (key !== 'files') {
                    newFormData.append(key, value);
                }
            }
            compressedFiles.forEach(file => {
                newFormData.append('files', file);
            });

            // Add the 'capital' field to the FormData
            newFormData.append('capital', cityData.capital);

            const response = await fetch('https://www.dungeonsandmuffins.be/api/upload', { // Corrected URL to match the route setup
                method: 'POST',
                body: newFormData,
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json().catch(err => {
                    throw new Error("Failed to parse JSON response: " + err.message);
                });
                cityData.images = result.paths; // Store the uploaded image paths in the city data

                // Add city to Supabase
                const newCity = await addCity(cityData);

                // Update the map with the new city
                citiesLayerGroup.clearLayers();
                const mapData = await fetchMapData();
                fetchAndDisplayCities(citiesLayerGroup, currentMap, mapData.cities);

                // Close the form and reset
                document.getElementById('cityFormModal').style.display = 'none';
                e.target.reset();
                toggleAddCityMode(false);
            } else {
                const errorText = await response.text();
                alert(`Failed to upload images: ${errorText}`);
                console.error('Failed to upload images:', errorText);
            }
        } catch (error) {
            alert(`Failed to add city: ${error.message}`);
            console.error('Failed to add city:', error);
        }
    } else {
        document.getElementById('cityFormModal').style.display = 'none';
    }
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        new Compressor(file, {
            quality: 0.6, // Adjust quality as needed
            success(result) {
                resolve(result);
            },
            error(err) {
                reject(err);
            },
        });
    });
}

function toggleAddCityMode(forceDisable = false) {
    addCityMode = forceDisable ? false : !addCityMode;
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
