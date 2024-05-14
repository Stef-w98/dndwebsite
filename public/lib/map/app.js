// app.js
import { supabase } from './supabaseClient.js';
import { openSidebar, closeSidebar } from './uiHelpers.js';
import { fetchAndDisplayCities, addCity } from './cityManagement.js';
import { setupDrawingTools, fetchAndDisplayRegions } from './regionManagement.js';
import {fetchAndDisplayWeatherMarkers} from "./weatherManagement.js";

let map = L.map('fantasyMap', { crs: L.CRS.Simple, minZoom: 1, maxZoom: 4 });
const bounds = [[0, 0], [562.5, 1000]];
// This stays as your static base map. Not toggled.
L.imageOverlay('./Dryle.png', bounds).addTo(map);
map.fitBounds(bounds);

let citiesLayerGroup = L.layerGroup().addTo(map);
let regionsLayerGroup = L.layerGroup().addTo(map);
let weatherLayerGroup = L.layerGroup().addTo(map);

// Only cities and regions are toggled, no "Base Map" here as it's not a layer that gets toggled
let overlays = {
    "Cities": citiesLayerGroup,
    "Regions": regionsLayerGroup,
    "Weather": weatherLayerGroup
};

// Add the layer control with only overlays
L.control.layers(null, overlays, {collapsed: false}).addTo(map);

window.addEventListener('load', async () => {
    setupDrawingTools(map);
    fetchAndDisplayCities(citiesLayerGroup, map);
    fetchAndDisplayRegions(regionsLayerGroup, map);
    fetchAndDisplayWeatherMarkers(weatherLayerGroup, map);

    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    // Add other event listeners and initialization code here
});
