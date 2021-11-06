import mapboxgl from 'mapbox-gl';
import { MapboxLayer } from '@deck.gl/mapbox';
import { ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { scaleLog } from 'd3-scale';

import { load } from '@loaders.gl/core';
import { CSVLoader } from '@loaders.gl/csv';

// Mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoicmFuZ2UtZXQiLCJhIjoiY2twMm82cDFwMDdtejJubWt4cG13OXlncCJ9.HBBODxL4-8y5G9mXCNwpdA";

const colours = [[105, 48, 195], [83, 144, 217], [72, 191, 227], [100, 223, 223], [128, 255, 219]]

// this is for colour interpolation
const colorScale = scaleLog()
    .domain([2673, 3633, 4403, 5452, 11339])
    .range(colours.reverse());


// add the rendered element to the dom
// the general flow of the code si as follows:
// Load all the data from the csv ->
// render all the data to the dom ->
// inside this method I call the mapbox method to start rendering the map
// here I reference a bunch of helper functions that I use to plot the bins and stuff

// the helper functions
function renderLayers(map, data) {
    if (!data) {
        return;
    }

    // create the layers that we shall be rendering to mapbox 

    // create the frst layer of  scatter plots 
    const earthquakeLayer = new MapboxLayer({
        id: 'earthquakes',
        type: ScatterplotLayer,
        data: data[0],
        opacity: 0.8,
        radiusMinPixels: 10,
        radiusMaxPixels: 20,
        getPosition: d => [d.coordinates[0], d.coordinates[1], 20],

        pickable: true,
        autoHighlight: true,
        onHover: ({ object, x, y }) => {
            const el = document.getElementById('tooltip');
            if (object) {
                const { type, magnitude, desc } = object;
                el.innerHTML = `<p>A ${type} of magnitude ${magnitude} <br> at ${desc}</p>`
                el.style.display = 'block';
                el.style.opacity = 0.9;
                el.style.left = x + 'px';
                el.style.top = y + 'px';
            } else {
                el.style.opacity = 0.0;
            }
        },
        getFillColor: d => [230, 57, 70],
        getLineColor: d => [0, 0, 0],
    });

    // add a heatmap layer for the earthquakes
    const eqheatmap = new MapboxLayer({
        id: 'heat',
        type: HeatmapLayer,
        data: data[0],
        getPosition: d => [d.coordinates[0], d.coordinates[1], 10],
        getWeight: d => d.magnitude * 10,
        radiusPixels: 100
    })

    // make a geojson layer for the population tracts
    const populationLayer = new MapboxLayer({
        id: 'population',
        type: GeoJsonLayer,
        data: data[1],
        opacity: 0.1,
        stroked: false,
        filled: true,
        extruded: false,
        wireframe: false,
        pickable: true,
        autoHighlight: true,
        getLineColor: [255, 255, 255],
        getFillColor: d => colorScale(d.properties.edited_total_pop_totalPop),
        onHover: ({ object, x, y }) => {
            const el = document.getElementById('tooltip');
            if (object) {
                let name = object.properties.edited_total_pop_CITYNAME;
                let pop = object.properties.edited_total_pop_totalPop;
                el.innerHTML = `<p>A ${name} <br> Population ${pop}</p>`
                el.style.display = 'block';
                el.style.opacity = 0.9;
                el.style.left = x + 'px';
                el.style.top = y + 'px';
            } else {
                el.style.opacity = 0.0;
            }
        },
    })

    // swapping these cause it looks wierd otherwise
    map.addLayer(populationLayer);
    map.addLayer(eqheatmap);
    map.addLayer(earthquakeLayer);
}


// this is the render to dom method
export function renderToDOM(container, data) {
    const map = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/dark-v10',
        antialias: true,
        center: [-118.197333, 34.016833],
        zoom: 14.5,
        bearing: 20,
        pitch: 60
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    map.on('load', () => {
        // a standard 3d building layer 
        map.addLayer({
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 12,
            'paint': {
                'fill-extrusion-color': '#aaa',

                // Use an 'interpolate' expression to
                // add a smooth transition effect to
                // the buildings as the user zooms in.
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10,
                    0,
                    13.05,
                    ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10,
                    0,
                    13.05,
                    ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.3
            }
        });

        // add a sky layer otherise it looks wierd 
        map.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
                // set up the sky layer to use a color gradient
                'sky-type': 'gradient',
                // the sky will be lightest in the center and get darker moving radially outward
                // this simulates the look of the sun just below the horizon
                'sky-gradient': [
                    'interpolate',
                    ['linear'],
                    ['sky-radial-progress'],
                    0.8,
                    'rgba(135, 206, 235, 1.0)',
                    1,
                    'rgba(0,0,0,0.1)'
                ],
                'sky-gradient-center': [0, 0],
                'sky-gradient-radius': 90,
                'sky-opacity': [
                    'interpolate',
                    ['exponential', 0.1],
                    ['zoom'],
                    5,
                    0,
                    22,
                    1
                ]
            }
        });

        // add functionality to locate the user 
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                // When active the map will receive updates to the device's location as it changes.
                trackUserLocation: true,
                // Draw an arrow next to the location dot to indicate which direction the device is heading.
                showUserHeading: true
            })
        );

        // this renders all the deck gl layers that I reference 
        renderLayers(map, data);
    });

    return {
        // the update method allows me to re-render new data without deleting everything
        // remove is to ofc remove everything
        update: newData => renderLayers(map, newData),
        remove: () => {
            map.remove();
        }
    };
}



// load up the data and draw stuff
export async function loadAndRender(container) {
    // there are two parts to this process - 
    // data 1 which loads up the earthquake data 
    // data 2 which loads up the population data
    // start off by making a blank array called "data"
    const data = []

    // load the earthquakedata
    const eqdata = await load(
        './query.csv',
        CSVLoader
    );
    // we have to remap this object to be used as a json object in the scatter plot process 
    const eqdata_remapped = []
    eqdata.forEach(datapoint => {
        // describe a new data point 
        // the format is as follows:
        // {name: 'Colma (COLM)', code:'CM', address: '365 D Street, Colma CA 94014', exits: 4214, coordinates: [-122.466233, 37.684638]} (taken form: https://deck.gl/docs/api-reference/layers/scatterplot-layer)
        const newDataPoint = {
            desc: datapoint.place,
            magnitude: datapoint.mag,
            coordinates: [datapoint.longitude, datapoint.latitude],
            type: datapoint.type
        }
        // append that to a new array (eqdata_remapped)
        eqdata_remapped.push(newDataPoint);
    });
    // this is the first array in the data array
    data.push(eqdata_remapped);

    // shapefile data - https://data.lacounty.gov/Geospatial/Census-Blocks-2010/92i6-h5v4
    // population data - https://data.lacounty.gov/Mental-Health/County-of-Los-Angeles-Estimated-Population-by-Cens/ai64-dnh8
    // custom dataset was made and joined in QGIS for plotting
    const populationData_raw = await fetch("./Processed_Geodata_final_2_forViz.geojson");
    const populationData_jsonParsed = await populationData_raw.json();

    data.push(populationData_jsonParsed);

    renderToDOM(container, data);
}


// start of the chain of events that we described above
let cont = document.getElementById('app');
loadAndRender(cont);