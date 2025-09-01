// js/globe-init.js

// Make sure references.js is loaded before this script
const highlightedCountries = ['CHL', 'USA', 'JPN', 'ESP', 'MAR', 'TUN', 'CHN', 'GBR', 'DEU', 'AFG'];

window.addEventListener('load', () => {
    const container = document.getElementById('globeContainer');
    const refPanel = document.getElementById('refPanel');
    const refList = document.getElementById('refList');
    const minHeight = 400;

    // Set initial height
    container.style.height = Math.max(refPanel.offsetHeight, minHeight) + 'px';

    // Initialize globe
    const globe = new Globe(container)
        .width(container.clientWidth)
        .height(container.clientHeight)
        .showGlobe(true)
        .showAtmosphere(false)
        .globeMaterial(new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 30,
            specular: 0xaaaaaa
        }));

    const controls = globe.controls();
    globe.pointOfView({ lat: 45, lng: 0, altitude: 1.65 }, 0);
    controls.enableZoom = false;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;

    // Resize handler
    window.addEventListener('resize', () => {
        container.style.height = Math.max(refPanel.offsetHeight, minHeight) + 'px';
        globe.width(container.clientWidth).height(container.clientHeight);
    });

    // Load country data
    fetch('./geojson/countries.json')
        .then(res => res.json())
        .then(data => {
            globe.hexPolygonsData(data.features)
                .hexPolygonResolution(3)
                .hexPolygonMargin(0.3)
                .hexPolygonUseDots(true)
                .hexPolygonAltitude(0.015)
                .hexPolygonColor(f => highlightedCountries.includes(f.properties.iso_a3) ? '#260b0d' : 'darkgrey');

            globe.polygonsData(data.features)
                .polygonCapColor(() => 'rgba(0,0,0,0)')
                .polygonSideColor(() => 'rgba(0,0,0,0)')
                .polygonStrokeColor(() => 'rgba(0,0,0,0)')
                .polygonAltitude(0.02);

            globe.onPolygonClick(d => {
                if (!highlightedCountries.includes(d.properties.iso_a3)) return;

                controls.autoRotate = false;
                const centroid = d3.geoCentroid(d);
                globe.pointOfView({ lat: centroid[1], lng: centroid[0], altitude: 1.65 }, 1000);

                refList.innerHTML = `<h3>${d.properties.name}</h3>` +
                    references[d.properties.iso_a3].map(r => {
                        const authors = r.authors
                            .replace(/E\. Luedeling/g, '<b>E. Luedeling</b>')
                            .replace(/J\. N\. Bauer/g, '<b>J. N. Bauer</b>');

                        return `
                        <div class="ref-entry">
                            <a href="${r.link}" target="_blank">${r.title}</a>
                            <div class="authors">${authors}</div>
                            <div class="journal">${r.journal}</div>
                        </div>
                        `;
                    }).join('');
                refList.scrollTop = 0;

                setTimeout(() => controls.autoRotate = true, 15000);
            });
        });

    // Optional: reset panel
    window.closePanel = function () {
        refList.innerHTML = 'Click a highlighted country to see its references.';
        controls.autoRotate = true;
    };
});
