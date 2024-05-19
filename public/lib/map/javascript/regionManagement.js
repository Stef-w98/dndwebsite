import { supabase } from './supabaseClient.js';
import { openSidebarWithRegionInfo } from './uiHelpers.js'; // Ensure this import

let isDrawing = false;
let polygonPoints = [];
let polygon = null;
let map = null; // This will be set when initializing drawing tools

export async function setupDrawingTools(leafletMap) {
    map = leafletMap; // Store the reference to the map

    const drawButton = document.getElementById('drawPolygon');
    drawButton.addEventListener('click', toggleDrawing);

    map.on('click', mapClick);
}

function toggleDrawing() {
    isDrawing = !isDrawing;
    document.getElementById('drawPolygon').textContent = isDrawing ? 'Stop Drawing' : 'Start Drawing';
    if (!isDrawing && polygonPoints.length > 2) {
        completePolygon();
    } else if (!isDrawing) {
        resetDrawing();
    }
}

function mapClick(e) {
    if (!isDrawing) return;
    polygonPoints.push([e.latlng.lat, e.latlng.lng]);
    if (polygon) {
        map.removeLayer(polygon);
    }
    polygon = L.polygon(polygonPoints).addTo(map);
}

async function completePolygon() {
    const regionName = prompt("Enter the name of the region:");
    const regionInfo = prompt("Enter additional information about the region:");

    if (!regionName || !regionInfo || polygonPoints.length <= 2) {
        resetDrawing();
        return;
    }

    try {
        const { error: insertError } = await supabase
            .from('regions')
            .insert({ regionname: regionName, regioninfo: regionInfo });

        if (insertError) throw insertError;

        const { data: latestRegion, error: fetchError } = await supabase
            .from('regions')
            .select('*')
            .order('created_on', { ascending: false })
            .limit(1)
            .single();

        if (fetchError) throw fetchError;

        const regionId = latestRegion.id;

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

export async function fetchAndDisplayRegions(regionsLayerGroup, map) {
    try {
        const { data: regions, error: regionsError } = await supabase
            .from('regions')
            .select('id, regionname, regioninfo');

        if (regionsError) throw regionsError;

        regionsLayerGroup.clearLayers();

        for (const region of regions) {
            const { data: coords, error: coordsError } = await supabase
                .from('coordinates')
                .select('latitude, longitude')
                .eq('regionid', region.id);

            if (coordsError) throw coordsError;

            const latlngs = coords.map(c => [c.latitude, c.longitude]);
            const randomColor = getRandomColor();
            const polygon = L.polygon(latlngs, {
                color: randomColor,
                fillColor: randomColor,
                fillOpacity: 0.7,
                weight: 2,
            })
                .bindTooltip(`<strong>${region.regionname}</strong>`, { permanent: true, direction: 'center', className: 'region-label' })
                .addTo(regionsLayerGroup);

            polygon.on('click', () => handleRegionClick(region.id));

            polygon.on('mouseover', function() {
                this.setStyle({
                    weight: 5,
                    color: '#666',
                    fillOpacity: 0.9
                });
            }).on('mouseout', function() {
                this.setStyle({
                    weight: 2,
                    color: randomColor,
                    fillOpacity: 0.7
                });
            });
        }

        regionsLayerGroup.addTo(map);
    } catch (error) {
        console.error('Error fetching regions:', error.message);
    }
}

function getRandomColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);

    if (g > 180) {
        g = g / 2;
        r = r + 50 < 255 ? r + 50 : 255;
        b = b + 50 < 255 ? b + 50 : 255;
    }

    let color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    return color;
}

export async function handleRegionClick(regionId) {
    try {
        const { data: regionDetails, error } = await supabase
            .from('regions')
            .select('regionname, regioninfo')
            .eq('id', regionId)
            .single();

        if (error) throw error;

        openSidebarWithRegionInfo(regionDetails);
    } catch (error) {
        console.error('Error fetching region details:', error.message);
    }
}
