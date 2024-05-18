import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

const supabaseUrl = 'https://nhgspooltizwismypzan.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZ3Nwb29sdGl6d2lzbXlwemFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA2MTI2MDQsImV4cCI6MjAyNjE4ODYwNH0.7uPvzyXlBh6EUShss-I2KkuAAPdyeMauKXdKwGl6YnA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

let map, isDrawing = false, polygonPoints = [], polygon;
let citiesLayerGroup = L.layerGroup();
let regionsLayerGroup = L.layerGroup();

window.addEventListener('load', async () => {
    map = L.map('fantasyMap', { crs: L.CRS.Simple, minZoom: 1, maxZoom: 4 });
    const bounds = [[0, 0], [562.5, 1000]];
    L.imageOverlay('./Dryle.png', bounds).addTo(map);
    map.fitBounds(bounds);

    fetchAndDisplayCities();
    fetchAndDisplayRegions();

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

let session = await supabase.auth.getUser();
let userEmail = session?.data.user?.email;
if (userEmail === 'stef.wouters18@gmail.com' || userEmail === 'alessandrosanen@gmail.com' || userEmail === 'ruben.kog@telenet.be') {
    // Updated map click event with boundary validation
    map.on('click', function(e) {
        if (isValidLocation(e.latlng.lat, e.latlng.lng)) {
            document.getElementById('cityFormModal').style.display = 'block';
            window.clickedLocation = e.latlng;
        } else {
            alert('The clicked location is outside of the map boundaries. Please select a location within the map.');
        }
    });
} else {
    console.log("You're viewing the map in read-only mode.");
}

// Boundary validation function
function isValidLocation(lat, lng) {
    const maxLat = 562;
    const minLat = 0;
    const maxLng = 1000;
    const minLng = 0;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

document.getElementById('addCityForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevent default form submission

    const formData = new FormData(e.target);
    const cityData = {};
    formData.forEach((value, key) => {
        cityData[key] = value; // Collects each form field into cityData object
    });

    cityData.latitude = window.clickedLocation.lat;
    cityData.longitude = window.clickedLocation.lng;

    // Include boundary check before adding the city
    if (!isValidLocation(cityData.latitude, cityData.longitude)) {
        alert('The selected location is outside of the map boundaries. Please select a location within the map.');
        document.getElementById('cityFormModal').style.display = 'none';
        return; // Exit if the location is invalid
    }

    // Confirm before adding the city
    const isConfirmed = confirm('Are you sure you want to add this city?');
    if (isConfirmed) {
        await addCity(cityData);
        document.getElementById('cityFormModal').style.display = 'none';
        e.target.reset(); // Optional: reset form for future use
    } else {
        // If not confirmed, just close the modal and do nothing
        document.getElementById('cityFormModal').style.display = 'none';
    }
});

async function addCity(cityData) {
    await fetch('/api/addCity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cityData)
    });
    citiesCache.push(cityData);
    // Immediately add the marker for the new city
    const marker = L.marker([cityData.latitude, cityData.longitude]).addTo(map);
    marker.bindTooltip(cityData.name, { permanent: false, direction: 'top', opacity: 0.7, offset: [-15, 0] });
    marker.on('click', () => {
        openSidebar(cityData); // Use the newly added city data to open the sidebar
    });
}

const cities = await fetchCities();
displayCities(); // Use the cached cities to populate the map initially

// Optional: Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('cityFormModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// Global variable to store city data
let cityData = [];

function setupDrawingTools() {
    // Button to toggle drawing mode
    const drawButton = document.createElement('button');
    drawButton.id = 'drawPolygon';
    drawButton.textContent = 'Start Drawing';
    document.body.appendChild(drawButton); // Add the button to the body or another suitable container

    drawButton.addEventListener('click', () => {
        isDrawing = !isDrawing;
        drawButton.textContent = isDrawing ? 'Stop Drawing' : 'Start Drawing';
        if (!isDrawing && polygonPoints.length > 2) {
            completePolygon();
        } else if (!isDrawing) {
            resetDrawing();
        }
    });

    map.on('click', function (e) {
        if (!isDrawing) return;
        polygonPoints.push([e.latlng.lat, e.latlng.lng]);
        if (polygon) {
            map.removeLayer(polygon);
        }
        polygon = L.polygon(polygonPoints).addTo(map);
    });
}

async function completePolygon() {
    const regionName = prompt("Enter the name of the region:");
    const regionInfo = prompt("Enter additional information about the region:");

    if (!regionName || !regionInfo || polygonPoints.length <= 2) {
        resetDrawing();
        return;
    }

    try {
        // Insert the new region
        const { error: insertError } = await supabase
            .from('regions')
            .insert({ regionname: regionName, regioninfo: regionInfo });

        if (insertError) throw insertError;

        // Fetch the latest region entry based on created_on
        const { data: latestRegion, error: fetchError } = await supabase
            .from('regions')
            .select('*')
            .order('created_on', { ascending: false })
            .limit(1)
            .single();

        if (fetchError) throw fetchError;

        const regionId = latestRegion.id;

        // Insert coordinates for the latest region
        for (const point of polygonPoints) {
            const { error: coordError } = await supabase
                .from('coordinates')
                .insert({
                    regionid: regionId,
                    latitude: point[0],
                    longitude: point[1]
                });

            if (coordError) throw coordError;
        }

        alert('Region saved successfully!');
    } catch (error) {
        alert(`Failed to save region: ${error.message}`);
    } finally {
        resetDrawing();
    }
}

function resetDrawing() {
    isDrawing = false;
    polygonPoints = [];
    if (polygon) {
        map.removeLayer(polygon);
        polygon = null;
    }
    document.getElementById('drawPolygon').textContent = 'Start Drawing';
}

async function fetchAndDisplayRegions() {
    try {
        const { data: regions, error: regionsError } = await supabase
            .from('regions')
            .select('id, regionname, regioninfo');

        if (regionsError) throw regionsError;

        regionsLayerGroup.clearLayers(); // Clear existing layers

        for (let region of regions) {
            const { data: coords, error: coordsError } = await supabase
                .from('coordinates')
                .select('latitude, longitude')
                .eq('regionid', region.id);

            if (coordsError) throw coordsError;

            const latlngs = coords.map(c => [c.latitude, c.longitude]);
            const polygon = L.polygon(latlngs, {
                color: 'rgba(122,58,204,0.5)', // Default style
                fillColor: 'rgba(122,58,204,0.5)',
                fillOpacity: 0.5,
                weight: 2,
            }).bindTooltip(`<strong>${region.regionname}</strong>`, {
                permanent: true,
                direction: 'center',
                className: 'region-label'
            }).on('mouseover', function(e) {
                this.setStyle({
                    weight: 3,
                    color: '#313131',
                    fillOpacity: 0.7
                });
            }).on('mouseout', function(e) {
                this.setStyle({
                    weight: 2,
                    color: 'rgba(122,58,204,0.92)',
                    fillOpacity: 0.5
                });
            });

            regionsLayerGroup.addLayer(polygon);
        }

        regionsLayerGroup.addTo(map);
    } catch (error) {
        console.error('Error fetching regions:', error.message);
    }
}



function openSidebar(city) {
    const sidebarContent = document.getElementById('sidebar-content');
    let content = `<h2>${city.name}</h2>`;
    // Generate the detailed content dynamically, skipping undesired keys
    Object.entries(city).forEach(([key, value]) => {
        if (value && !['id', 'created_at', 'latitude', 'longitude'].includes(key)) {
            // Format the key to make it more human-readable, if necessary
            const formattedKey = key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1);
            content += `<p><strong>${formattedKey}:</strong> ${value}</p>`;
        }
    });
    sidebarContent.innerHTML = content;
    document.getElementById('sidebar').classList.add('open');
}

async function handleCityFormSubmit(e) {
    e.preventDefault();
    // Implementation for handling city form submissions
}

function closeSidebar() {
    // Implementation for closing the sidebar
}
let selectedCities = []; // Array to keep track of selected cities

async function fetchAndDisplayCities() {
    let { data: cities, error } = await supabase
        .from('cities')
        .select('*');

    if (error) {
        console.error('Error loading cities:', error.message);
        return;
    }

    citiesLayerGroup.clearLayers(); // Clear existing city markers before adding new ones

    cities.forEach(city => {
        const marker = L.marker([city.latitude, city.longitude], {
            title: city.name, // Assuming your city objects have 'name', 'latitude', 'longitude'
        }).addTo(citiesLayerGroup)
            .bindTooltip(city.name); // Display city name on hover

        marker.on('click', () => selectCity({
            name: city.name,
            coords: [city.latitude, city.longitude]
        }));
    });

    citiesLayerGroup.addTo(map);
}