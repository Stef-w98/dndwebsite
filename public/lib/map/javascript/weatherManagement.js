function seedRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getSeededRandom(seed, min, max) {
    return Math.floor(seedRandom(seed) * (max - min + 1)) + min;
}

export async function fetchAndDisplayWeatherMarkers(weatherLayerGroup, map, seed) {
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

        // Use the seed to consistently select a weather condition for the marker
        const seededIndex = getSeededRandom(seed + marker.markerid, 0, conditions.length - 1);
        const randomCondition = conditions[seededIndex];

        if (randomCondition) {
            displayWeatherMarker(marker, randomCondition, weatherLayerGroup, seed);
        }
    }

    weatherLayerGroup.addTo(map);
}

function displayWeatherMarker(marker, condition, weatherLayerGroup, seed) {
    // Generate a pseudo-random temperature using the seed
    const randomTemp = getSeededRandom(seed + marker.markerid, condition.mintemp, condition.maxtemp);

    const weatherIcon = L.icon({
        iconUrl: determineIconUrl(condition.name),
        iconSize: [32, 37], // Size of the icon
        iconAnchor: [16, 37], // Point of the icon which will correspond to marker's location
        popupAnchor: [0, -28] // Point from which the popup should open relative to the iconAnchor
    });

    // Update tooltip to show the condition name
    const weatherMarker = L.marker([marker.latitude, marker.longitude], { icon: weatherIcon }).addTo(weatherLayerGroup)
        .bindTooltip(condition.name, { permanent: true });

    weatherMarker.on('click', () => {
        let content = `<h2>Weather in ${marker.climatezones.name}</h2><p>${marker.locationdescription}</p>`;
        content += `<p><strong>Condition:</strong> ${condition.name}</p>`;
        content += `<p><strong>Temperature:</strong> ${randomTemp}°C</p>`; // Display the pseudo-random temperature
        content += `<p><strong>Description:</strong> ${condition.description}</p>`;
        openSidebar(content);
    });
}
