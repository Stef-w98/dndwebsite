
// Place this code at the end of your 'load' event listener
const generateRouteBtn = document.createElement('button');
generateRouteBtn.textContent = 'Generate Trade Route';
generateRouteBtn.style.position = 'absolute';
generateRouteBtn.style.left = '10px';
generateRouteBtn.style.top = '10px';
generateRouteBtn.style.zIndex = '1000';
generateRouteBtn.onclick = () => {
    if (selectedCities.length >= 2) { // Ensure at least two cities are selected
        createRandomTradeRoute(selectedCities);
        selectedCities = []; // Optionally clear the selection after generating the route
    } else {
        alert('Please select at least 2 cities.');
    }
};
document.body.appendChild(generateRouteBtn);

function selectCity(city) {
    // Convert string coordinates to numbers without geographic validation
    const latitude = parseFloat(city.coords[0]);
    const longitude = parseFloat(city.coords[1]);

    // Check if the city is already selected to avoid duplicates
    if (selectedCities.some(selectedCity => selectedCity.name === city.name)) {
        console.log(`${city.name} is already selected.`);
        return; // Stop further execution if city is already selected
    }

    // Assuming latitude and longitude are within your custom map's bounds,
    // directly add the city to the selectedCities array
    selectedCities.push({ name: city.name, coords: [latitude, longitude] });
    console.log(`Selected ${city.name}`);

    // Here, you might check if you've selected enough cities to generate a route and call createRandomTradeRoute(selectedCities);
    // if (selectedCities.length === 3) { // Adjust the number as needed
    //     createRandomTradeRoute(selectedCities);
    //     selectedCities = []; // Optionally reset the selection after generating the route
    // }
}

function createRandomTradeRoute(selectedCities) {
    if (!selectedCities || selectedCities.length < 2) {
        console.error('Invalid or insufficient selected cities.');
        return;
    }

    const generateWaypoints = (start, end, numberOfWaypoints = 10) => {
        const waypoints = [];
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        const direction = Math.atan2(dy, dx);

        let deviationRange = distance * 0.3; // Allow for large deviations

        for (let i = 1; i <= numberOfWaypoints; i++) {
            const segmentFraction = i / (numberOfWaypoints + 1);
            const deviation = (Math.random() - 0.5) * 2 * deviationRange;
            const deviationDirection = direction + Math.PI / 2; // Perpendicular to path

            // Calculate deviation point
            const pointX = start[0] + dx * segmentFraction + Math.cos(deviationDirection) * deviation;
            const pointY = start[1] + dy * segmentFraction + Math.sin(deviationDirection) * deviation;

            waypoints.push([pointX, pointY]);
        }

        return waypoints;
    };

    let routeCoords = [];

    for (let i = 0; i < selectedCities.length - 1; i++) {
        const startCity = selectedCities[i];
        const endCity = selectedCities[i + 1];

        // Add start city coordinates
        routeCoords.push(startCity.coords);

        // Generate waypoints with significant deviations
        const waypoints = generateWaypoints(startCity.coords, endCity.coords);
        routeCoords = routeCoords.concat(waypoints);
    }

    // Ensure the last city is included in the route
    routeCoords.push(selectedCities[selectedCities.length - 1].coords);

    // Create and display the polyline with random route
    const polyline = L.polyline(routeCoords, {
        color: 'blue', // Consider changing the color for better visibility
        weight: 4,
        opacity: 0.75,
    }).addTo(map);

    // Adjust map view to include the entire route
    map.fitBounds(polyline.getBounds());
}