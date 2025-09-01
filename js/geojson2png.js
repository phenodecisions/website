const width = 2048;
const height = 1024;
const canvas = document.getElementById('maskCanvas');
const ctx = canvas.getContext('2d');

// Fill black background
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, width, height);

// List of ISO codes to highlight
const selectedCountries = ['USA','FRA','JPN'];

// Load GeoJSON
fetch('geojson/countries.json')
  .then(res => res.json())
  .then(geojson => {
    geojson.features.forEach(f => {
      if(selectedCountries.includes(f.properties.ISO_A3)){
        f.geometry.coordinates.forEach(poly => {
          ctx.beginPath();
          // Handle MultiPolygon
          if(f.geometry.type === "MultiPolygon") poly = poly[0];

          // <-- Replace this loop with the debug version
          poly.forEach(([lon, lat], i) => {
            const x = ((lon + 180) / 360) * width;
            const y = ((90 - lat) / 180) * height;

            // Debug: draw a tiny red point for every coordinate
            ctx.fillStyle = 'red';
            ctx.fillRect(x, y, 2, 2);

            if(i===0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });

          ctx.closePath();
          ctx.fillStyle = 'white';
          ctx.fill();
        });
      }
    });

    // Trigger PNG download
    const link = document.createElement('a');
    link.download = 'countryMask.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
