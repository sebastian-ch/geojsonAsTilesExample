const map = L.map('map', {
    center: [40.655, -99.675],
    zoom: 5
});


map.spin(true);


L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    minZoom: 0
}).addTo(map);


fetch('congress.json')
    .then(response => {
        return response.json();
    })
    .then(data => {
        //console.log(data);
        const tileIndex = geojsonvt(data);
        createTileLayer(tileIndex);
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
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 0.5;

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
    //add layer
    map.addLayer(new CanvasLayer());
    map.spin(false);
    
}

function createPopups(data) {

    const gjn = L.geoJson(data);

    gjn.eachLayer(function(layer) {
        var props = layer.feature.properties;
        layer.bindTooltip(props.NAMELSAD);
        //console.log(props);
    })

    gjn.bringToFront();





}