import { supabase } from '../../lib/map/supabaseClient.js';
import { openSidebar } from './uiHelpers.js';

export async function fetchAndDisplayWeatherMarkers(weatherLayerGroup, map) {
    let { data: weatherMarkers, error } = await supabase.from('weathermarkers').select(`
        markerid,
        zoneid,
        latitude,
        longitude,
        locationdescription,
        climatezones:climatezones(name)
    `);

    if (error) {
        console.error('Error loading weather markers:', error.message);
        return;
    }

    weatherLayerGroup.clearLayers(); // Clear existing weather markers before adding new ones

    for (const marker of weatherMarkers) {
        // Fetch weather conditions for the marker's climate zone
        let { data: conditions, error: conditionsError } = await supabase.from('weatherconditions')
            .select('name, mintemp, maxtemp, description')
            .eq('zoneid', marker.zoneid);

        if (conditionsError) {
            console.error('Error loading conditions:', conditionsError.message);
            continue; // Skip this marker if conditions cannot be loaded
        }

        // Randomly select a weather condition for the marker
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

        if (randomCondition) {
            displayWeatherMarker(marker, randomCondition, weatherLayerGroup);
        }
    }

    weatherLayerGroup.addTo(map);
}

function displayWeatherMarker(marker, condition, weatherLayerGroup) {
    // Generate a random temperature between minTemp and maxTemp
    const randomTemp = Math.floor(Math.random() * (condition.maxtemp - condition.mintemp + 1)) + condition.mintemp;

    const weatherIcon = L.icon({
        iconUrl: determineIconUrl(condition.name),
        iconSize: [32, 37], // Size of the icon
        iconAnchor: [16, 37], // Point of the icon which will correspond to marker's location
        popupAnchor: [0, -28] // Point from which the popup should open relative to the iconAnchor
    });

    // Update tooltip to show the condition name
    const weatherMarker = L.marker([marker.latitude, marker.longitude], { icon: weatherIcon }).addTo(weatherLayerGroup)
        .bindTooltip(condition.name, { permanent: false });

    weatherMarker.on('click', () => {
        let content = `<h2>Weather in ${marker.climatezones.name}</h2><p>${marker.locationdescription}</p>`;
        content += `<p><strong>Condition:</strong> ${condition.name}</p>`;
        content += `<p><strong>Temperature:</strong> ${randomTemp}°C</p>`; // Display the randomly generated temperature
        content += `<p><strong>Description:</strong> ${condition.description}</p>`;
        openSidebar(content);
    });
}

function determineIconUrl(weatherCondition) {
    const iconMap = {
        'Sunny': './clear-day.svg',
        'Cloudy': './cloudy.svg',
        'Rain': './rain.svg',
        'Thunderstorm': './thunder.svg',
        'Fog': './fog.svg',
        // Add other conditions as necessary
    };

    return iconMap[weatherCondition] || './clear-day.svg';
}
