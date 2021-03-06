const map = L.map('map', {
    center: [40.655, -99.675],
    zoom: 5
});


map.spin(true);


const basemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 14,
    minZoom: 0
}).addTo(map);


fetch('congress.json')
    .then(response => {
        return response.json();
    })
    .then(data => {
        //console.log(data);
        const tileOptions = {
            maxZoom: 14,
            tolerance: 8,
            extent: 4096,
            buffer: 64,
            debug: 0,
            indexMaxZoom: 0,
            indexMaxPoints: 100000
        };
        const tileIndex = geojsonvt(data, tileOptions);
        createTileLayer(tileIndex);
        //if you want popups on click, uncomment
        //createPopups(data);
    })
    .catch(err => {
        console.log(err);
    })

//heavily borrowed from http://disciplinecode.com/2016/12/27/003-geojson-vt/
function createTileLayer(tileIndex) {

    const CanvasLayer = L.GridLayer.extend({
        createTile: function(coords) {

            let tile = L.DomUtil.create('canvas', 'leaflet-tile leaflet-geojson-vt');

            tile.width = 256;
            tile.height = 256;
            // Get context of our current canvas
            const ctx = tile.getContext('2d');
            // Based in the coords get the tile we want to render
            const tileToRender = tileIndex.getTile(coords.z, coords.x, coords.y);
            // Method of the Canvas 2D API sets all pixels in the rectangle defined
            // by starting point (x, y) and size (width, height) to transparent 
            // black, erasing any previously drawn content.
            ctx.clearRect(0, 0, tile.width, tile.height);
            // If tileToRender is null return just a clear canvas
            if (!tileToRender) {
                return tile;
            }
            // If tileToRender is not null find all the features
            const features = tileToRender.features;

            //stroke color and width
            //ctx.strokeStyle = 'red';
            //ctx.lineWidth = 0.5;

            // Iterate features
            features.forEach(feature => {
                // Find all geometries for the feature
                const geometries = feature.geometry;
                // Set a color based on the TIPO attribute
                let featureColor;
                if (feature.tags.TIPO) {
                    // Use our mapping
                    featureColor = colorMappings[feature.tags.TIPO];
                }
                // If TIPO couldn't be mapped return alpha 0 rgba
                ctx.fillStyle = featureColor || 'rgba(0,0,0,0)';
                // ctx.globalAlpha = 0.5; (optional)
                // Start path
                ctx.beginPath();
                // Iterate geometries
                geometries.forEach(geometry => {
                    //const type = geometry.type;
                    // Iterate points 
                    geometry.forEach(ctxDrawPolygon.bind(null, ctx));
                });
                // Strokes the current or given path
                ctx.stroke();
            });
            // Return the canvas
            return tile;
        }
    });

    //function to draw polygons
    const ctxDrawPolygon = (ctx, point, index) => {
        const pad = 0;
        const extent = 4096;
        const x = point[0] / extent * 256;
        const y = point[1] / extent * 256;
        if (index) ctx.lineTo(x + pad, y + pad)
        else ctx.moveTo(x + pad, y + pad)
    };
    

    map.addLayer(new CanvasLayer());
    map.spin(false);

}

//uses leaflet-pip to get geojson data without adding it to map
 function createPopups(data) {

    const gjn = L.geoJson(data);

    map.on('click', function(e) {
        const x = e.latlng.lng;
        const y = e.latlng.lat;

        const layerData = leafletPip.pointInLayer([x, y], gjn, true);
        const popup = layerData[0].feature.properties.NAMELSAD;
        map.openPopup(popup, e.latlng);
    })

}