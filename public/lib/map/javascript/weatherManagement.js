import { openSidebar } from './uiHelpers.js';

export async function fetchAndDisplayWeatherMarkers(weatherLayerGroup, map, seedDate, weatherConditions) {
    const dateSeed = seedDate || new Date().getTime(); // Use the provided date seed or the current timestamp if not provided
    const random = seedRandom(dateSeed);

    try {
        console.log('Using seed:', dateSeed, 'for weather generation');
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

            const randomIndex = Math.floor(random() * conditions.length);
            const randomCondition = conditions[randomIndex];
            console.log('Random condition selected:', randomCondition);

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
    console.log('Displaying weather marker:', marker, condition);
    console.log(`Generated temperature: ${temperature}°C for condition: ${condition.name}`);

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
        return x / 233280;
    };
}

function generateRandomTemperature(random, min, max) {
    const adjustedMin = Math.abs(min);
    const adjustedMax = Math.abs(max);
    const randomValue = random();
    const range = adjustedMax - adjustedMin;
    let generatedTemp = Math.floor(randomValue * (range + 1)) + adjustedMin;

    if (min < 0 && max < 0) {
        generatedTemp = -generatedTemp;
    } else if (min < 0 || max < 0) {
        generatedTemp = random() >= 0.5 ? generatedTemp : -generatedTemp;
    }
    generatedTemp = Math.max(Math.min(generatedTemp, max), min); // Ensure the temperature is within the min and max range

    console.log(`Random value: ${randomValue}, Temp range: ${range}, Adjusted Min: ${adjustedMin}, Adjusted Max: ${adjustedMax}, Generated temp: ${generatedTemp}`);
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
