import { openSidebar } from './uiHelpers.js';

export async function fetchAndDisplayWeatherMarkers(weatherLayerGroup, map, seedDate, weatherConditions) {
    const dateSeed = seedDate || new Date().getTime(); // Use the provided date seed or the current timestamp if not provided
    const random = seedRandom(dateSeed);

    try {
        const response = await fetch('/api/weather-markers');
        if (!response.ok) throw new Error('Failed to fetch weather markers');
        const weatherMarkers = await response.json();

        weatherLayerGroup.clearLayers(); // Clear existing weather markers before adding new ones

        for (const marker of weatherMarkers) {
            const conditions = weatherConditions.filter(condition => condition.zoneid === marker.zoneid);

            if (!conditions || conditions.length === 0) {
                console.error('No conditions found for zone:', marker.zoneid);
                continue; // Skip this marker if conditions cannot be loaded
            }

            const randomIndex = Math.floor(random() * conditions.length);
            const randomCondition = conditions[randomIndex];

            if (randomCondition) {
                const temperatureRandom = seedRandom(dateSeed + randomCondition.conditionid);
                const randomTemp = generateRandomTemperature(temperatureRandom, randomCondition.mintemp, randomCondition.maxtemp);
                displayWeatherMarker(marker, randomCondition, randomTemp, weatherLayerGroup);
            } else {
                console.error('Failed to select a random condition:', { randomIndex, conditions });
            }
        }

        weatherLayerGroup.addTo(map);
    } catch (error) {
        console.error('Error fetching weather markers:', error.message);
    }
}

function displayWeatherMarker(marker, condition, temperature, weatherLayerGroup) {

    const weatherIcon = L.icon({
        iconUrl: determineIconUrl(condition.name), // Determine the icon URL based on condition name
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -28]
    });

    const weatherMarker = L.marker([marker.latitude, marker.longitude], { icon: weatherIcon }).addTo(weatherLayerGroup)
        .bindTooltip(condition.name, { permanent: false });

    weatherMarker.on('click', () => {
        let content = `<h2>Weather in ${marker.climatezones.name}</h2><p>${marker.locationdescription}</p>`;
        content += `<p><strong>Condition:</strong> ${condition.name}</p>`;
        content += `<p><strong>Temperature:</strong> ${temperature}°C</p>`;
        content += `<p><strong>Description:</strong> ${condition.description}</p>`;
        openSidebar(content);
    });
}

function seedRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return function() {
        x = (x * 9301 + 49297) % 233280;
        return (x / 233280 + 1) % 1; // Ensure the value is within the range [0, 1)
    };
}

function generateRandomTemperature(random, min, max) {
    const randomValue = random();
    const range = Math.abs(max - min);
    let generatedTemp = Math.floor(randomValue * (range + 1)) + Math.min(min, max);

    return generatedTemp;
}

function determineIconUrl(weatherCondition) {
    const iconMap = {
        'Tropical Storm': './assets/weather/tropical-storm.svg',
        'Sunny': './assets/weather/clear-day.svg',
        'Heavy Snow': './assets/weather/heavy-snow.svg',
        'Snowstorm': './assets/weather/blizzard.png',
        'Fog': './assets/weather/fog.svg',
        'Blizzard': './assets/weather/blizzard.png',
        'Thunderstorm': './assets/weather/thunder.svg',
        'Rain': './assets/weather/rain.svg',
        'Light Snow': './assets/weather/light-snow.svg',
        'Clear Skies': './assets/weather/clear-day.svg',
        'Cloudy': './assets/weather/cloudy.svg'
    };

    return iconMap[weatherCondition] || './assets/weather/clear-day.svg';
}
