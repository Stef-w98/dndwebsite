import { openSidebar } from './uiHelpers.js';

export async function fetchAndDisplayWeatherMarkers(weatherLayerGroup, map, seedDate, weatherConditions) {
    const dateSeed = seedDate || new Date().getTime(); // Use the provided date seed or the current timestamp if not provided
    const random = seedRandom(dateSeed);
    console.log(`Using seed: ${dateSeed} for weather generation`);

    try {
        console.log('Fetching weather markers from API...');
        const response = await fetch('/api/weather-markers');
        if (!response.ok) throw new Error('Failed to fetch weather markers');
        const weatherMarkers = await response.json();

        console.log('Weather markers fetched:', weatherMarkers);
        weatherLayerGroup.clearLayers(); // Clear existing weather markers before adding new ones

        for (const marker of weatherMarkers) {
            console.log('Fetching weather conditions for zone:', marker.zoneid);
            const conditions = weatherConditions.filter(condition => condition.zoneid === marker.zoneid);

            if (!conditions || conditions.length === 0) {
                console.error('No conditions found for zone:', marker.zoneid);
                continue; // Skip this marker if conditions cannot be loaded
            }

            const randomCondition = conditions[Math.floor(random() * conditions.length)];
            console.log('Random condition selected:', randomCondition);

            if (randomCondition) {
                displayWeatherMarker(marker, randomCondition, weatherLayerGroup, random);
            }
        }

        weatherLayerGroup.addTo(map);
    } catch (error) {
        console.error('Error fetching weather markers:', error.message);
    }
}

function displayWeatherMarker(marker, condition, weatherLayerGroup, random) {
    console.log('Displaying weather marker:', marker, condition);
    const randomTemp = Math.floor(random() * (condition.maxtemp - condition.mintemp + 1)) + condition.mintemp;
    console.log(`Generated temperature: ${randomTemp}°C for condition: ${condition.name}`);

    const weatherIcon = L.icon({
        iconUrl: condition.icon || './assets/weather/clear-day.svg', // Use a default icon if none is provided
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -28]
    });

    const weatherMarker = L.marker([marker.latitude, marker.longitude], { icon: weatherIcon }).addTo(weatherLayerGroup)
        .bindTooltip(condition.name, { permanent: true });

    weatherMarker.on('click', () => {
        let content = `<h2>Weather in ${marker.climatezones.name}</h2><p>${marker.locationdescription}</p>`;
        content += `<p><strong>Condition:</strong> ${condition.name}</p>`;
        content += `<p><strong>Temperature:</strong> ${randomTemp}°C</p>`;
        content += `<p><strong>Description:</strong> ${condition.description}</p>`;
        openSidebar(content);
    });
}

function seedRandom(seed) {
    console.log(`Generating random number with seed: ${seed}`);
    let x = Math.sin(seed) * 10000;
    return function() {
        x = (x * 9301 + 49297) % 233280;
        return x / 233280;
    };
}
