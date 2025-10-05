// js/globe_main.js
import { 
    MeshPhongMaterial, Color, Mesh, CircleGeometry, RingGeometry, SphereGeometry, 
    Group, Vector3, Quaternion, Raycaster, Vector2 
} from './three.module.js';
import { references } from './references2.js';


console.log("Number of references:", references.length);


// --- DOM Elements ---
const container = document.getElementById('globeContainer');
const refList = document.getElementById('refList');

// --- Initialize globe ---
const globe = new Globe(container)
    .width(container.clientWidth)
    .height(container.clientHeight)
    .backgroundColor('rgba(255,255,255,0)')
    .showGlobe(true)
    .showAtmosphere(true)
    .globeMaterial(new MeshPhongMaterial({
        color: new Color('#ffffff'),
        transparent: true,
        opacity: 0.95,
        shininess: 30,
        specular: new Color('#aaaaaa')
    }));

const controls = globe.controls();
globe.pointOfView({ lat: 45, lng: 0, altitude: 1.65 }, 0);
controls.domElement = globe.renderer().domElement;
controls.enableZoom = false;
controls.enablePan = true;
controls.enableRotate = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 2;

// --- Dynamic globe label ---
// --- Dynamic globe label ---


// --- Responsive resize ---
function resizeGlobe() {
    const size = Math.min(container.clientWidth, window.innerHeight * 0.8);
    globe.width(size);
    globe.height(size);
}
resizeGlobe();
window.addEventListener('resize', resizeGlobe);


// --- Global references ---
const globalRefs = [
    {
        title: "Climate Change Affects Winter Chill for Temperate Fruit and Nut Trees",
        authors: "E. Luedeling, E. H. Girvetz, M.A. Semenov, P.H. Brown",
        journal: "PloS One, 6(5): e20155",
        link: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0020155"
    },
    {
        title: "A global analysis of the comparability of winter chill models for fruit and nut trees",
        authors: "E. Luedeling, P.H. Brown",
        journal: "International Journal of Biometeorology, 55(3): 411-421",
        link: "https://link.springer.com/article/10.1007/s00484-010-0352-y"
    }
];

// --- Fetch country geometries ---
fetch('./json/countries.json')
    .then(res => res.json())
    .then(data => {
        const allCountries = [...new Set(references.flatMap(r => r.countries))];

        const filteredFeatures = data.features.map(f => {
            if (f.properties.iso_a3 === "FRA" && f.geometry.type === "MultiPolygon") {
                f.geometry.coordinates = f.geometry.coordinates.filter(
                    polygon => !polygon.some(ring => ring.some(coord => coord[0] < -50 && coord[1] > 0))
                );
            }
            return f;
        });

        // Hex polygons
        globe.hexPolygonsData(filteredFeatures)
            .hexPolygonResolution(3)
            .hexPolygonMargin(0.3)
            .hexPolygonUseDots(true)
            .hexPolygonAltitude(0.015)
            .hexPolygonColor(f =>
                allCountries.includes(f.properties.iso_a3) ? '#260b0d' : '#c2abab'
            );

        // Transparent country polygons
        globe.polygonsData(data.features)
            .polygonCapColor(() => 'rgba(0,0,0,0)')
            .polygonSideColor(() => 'rgba(0,0,0,0)')
            .polygonStrokeColor(() => 'rgba(0,0,0,0)')
            .polygonAltitude(0.02);

        globe.onPolygonClick(d => {
            controls.autoRotate = false;
            const centroid = d3.geoCentroid(d);
            globe.pointOfView({ lat: centroid[1], lng: centroid[0], altitude: 1.65 }, 1000);

            const countryRefs = allCountries.includes(d.properties.iso_a3)
                ? references.filter(r => r.countries.includes(d.properties.iso_a3))
                : [];

            const combinedRefs = [...countryRefs, ...globalRefs];

            refList.innerHTML =
                `<h3>${d.properties.name}</h3>` +
                combinedRefs.map(r => {
                    const authors = r.authors
                        .replace(/E\. Luedeling/g, '<b>E. Luedeling</b>')
                        .replace(/J\. N\. Bauer/g, '<b>J. N. Bauer</b>');
                    return `
                        <div class="ref-entry">
                            <a href="${r.link}" target="_blank">${r.title}</a>
                            <div class="authors">${authors}</div>
                            <div class="journal">${r.journal}</div>
                        </div>`;
                }).join('');

            refList.scrollTop = 0;
            setTimeout(() => (controls.autoRotate = true), 15000);
        });
    });

// --- Reset panel function ---
function closePanel() {
    refList.innerHTML = 'Click a highlighted country to see its references.';
    controls.autoRotate = true;
}

// --- Markers ---
const customMarkersGroup = new Group();
globe.scene().add(customMarkersGroup);

function latLngToCartesian(lat, lng, radius) {
    const latRad = lat * (Math.PI / 180);
    const lngRad = lng * (Math.PI / 180);
    const x = radius * Math.cos(latRad) * Math.sin(lngRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.cos(lngRad);
    return { x, y, z };
}

// --- Popup ---
const popup = document.createElement('div');
popup.id = 'markerPopup';
popup.style.position = 'absolute';
popup.style.pointerEvents = 'none';
popup.style.background = 'rgba(255, 255, 255, 0.9)';
popup.style.color = 'black';
popup.style.padding = '0.5rem';
popup.style.borderRadius = '1rem';
popup.style.display = 'none';
popup.style.maxWidth = '250px';
popup.style.boxShadow = '0 1px 2px rgba(0,0,0,0.5)';
popup.style.fontFamily = 'sans-serif';
popup.style.fontSize = '0.875rem';
popup.style.overflowY = 'auto';
popup.style.maxHeight = '50vh';
document.body.appendChild(popup);

function showPopup(content, screenX, screenY) {
    popup.innerHTML = content;
    popup.style.left = `${screenX}px`;
    popup.style.top = `${screenY}px`;
    popup.style.display = 'block';
}

function hidePopup() {
    popup.style.display = 'none';
}

// --- Plot markers ---
references.forEach(ref => {
    if (!ref.coordinates) return;

    ref.coordinates.forEach(coord => {
        const globeRadius = globe.getGlobeRadius();
        const circleRadius = 0.01 * globeRadius;
        const altitudeOffset = 0.018 * globeRadius;

        // Circle
        const circleGeo = new CircleGeometry(circleRadius, 32);
        const circleMat = new MeshPhongMaterial({ color: new Color('#61231f'), side: 2 });
        const circleMesh = new Mesh(circleGeo, circleMat);

        // Ring
        const ringGeo = new RingGeometry(circleRadius * 1.2, circleRadius * 1.4, 32);
        const ringMat = new MeshPhongMaterial({ color: new Color('#61231f'), side: 2 });
        const ringMesh = new Mesh(ringGeo, ringMat);

        // Invisible interaction sphere
        const interactGeo = new SphereGeometry(circleRadius * 3, 8, 8);
        const interactMat = new MeshPhongMaterial({ visible: false });
        const interactMesh = new Mesh(interactGeo, interactMat);

        // Position
        const { x, y, z } = latLngToCartesian(coord.lat, coord.lng, globeRadius + altitudeOffset);
        circleMesh.position.set(x, y, z);
        ringMesh.position.set(x, y, z);
        interactMesh.position.set(x, y, z);

        // Rotate tangent to globe
        const radial = new Vector3(x, y, z).normalize();
        const circleNormal = new Vector3(0, 0, 1);
        const q = new Quaternion().setFromUnitVectors(circleNormal, radial);
        circleMesh.quaternion.copy(q);
        ringMesh.quaternion.copy(q);
        interactMesh.quaternion.copy(q);

        interactMesh.userData = { ref };

        customMarkersGroup.add(circleMesh);
        customMarkersGroup.add(ringMesh);
        customMarkersGroup.add(interactMesh);
    });
});

// --- Hover raycaster ---
const raycaster = new Raycaster();
const mouse = new Vector2();

globe.renderer().domElement.addEventListener('pointermove', (event) => {
    const rect = globe.renderer().domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, globe.camera());
    const intersects = raycaster.intersectObjects(customMarkersGroup.children.filter(c => c.userData.ref), true);

    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        const ref = mesh.userData.ref;
        if (!ref) return;

        const authors = ref.authors
            .replace(/E\. Luedeling/g, '<b>E. Luedeling</b>')
            .replace(/J\. N\. Bauer/g, '<b>J. N. Bauer</b>');

        const refHtml = `<b>${ref.title}</b><br>${authors}<br><i>${ref.journal}</i><br>`;
        showPopup(refHtml, event.clientX, event.clientY);
    } else {
        hidePopup();
    }
});
