import { references } from "./references2.js";


const panels = document.querySelectorAll('.crop-panel');
let activePanel = null;


panels.forEach(panel => {
    const inner = panel.querySelector('.crop-inner');
    let leaveTimeout;

    panel.addEventListener('mouseenter', () => {
        clearTimeout(leaveTimeout);
        inner.classList.add('crop-flipped');
    });

    panel.addEventListener('mouseleave', () => {
        leaveTimeout = setTimeout(() => inner.classList.remove('crop-flipped'), 400);
    });

    panel.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePanel === panel) {
            resetPanels();
            return;
        }
        resetPanels();
        activePanel = panel;
        panel.classList.add('active');
        panels.forEach(p => p !== panel && p.classList.add('dimmed'));
        createSatellites(panel);
    });
});

document.body.addEventListener('click', resetPanels);

function resetPanels() {
    panels.forEach(p => {
        p.classList.remove('dimmed', 'active');
        p.querySelectorAll('.satellite').forEach(s => s.remove());
    });
    activePanel = null;
}

function createSatellites(panel) {
    const cropName = panel.dataset.crop?.toLowerCase();
    if (!cropName) return;

    // 🔎 Filter references that include this crop in their 'species' field
    const matchingRefs = references.filter(ref =>
        ref.species?.some(sp => sp.toLowerCase().includes(cropName))
    );

    // If no references found, stop
    if (matchingRefs.length === 0) {
        console.log("No references found for", cropName);
        return;
    }

    const numSatellites = matchingRefs.length;
    const radius = 160;
    const angleStep = (Math.PI * 2) / numSatellites;

    const back = panel.querySelector('.crop-back');
    const backRect = back.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const originX = backRect.left - panelRect.left + backRect.width / 2;
    const originY = backRect.top - panelRect.top + backRect.height / 2;

    // Create orbit container
    const orbitContainer = document.createElement('div');
    orbitContainer.className = 'orbit-container';
    orbitContainer.style.position = 'absolute';
    orbitContainer.style.left = `${originX}px`;
    orbitContainer.style.top = `${originY}px`;
    orbitContainer.style.width = '0';
    orbitContainer.style.height = '0';
    orbitContainer.style.transformOrigin = 'center center';
    panel.appendChild(orbitContainer);

    const satellites = [];

    // Create one satellite per matching reference
    matchingRefs.forEach((ref, i) => {
        const sat = document.createElement('a');
        sat.className = 'satellite';
        sat.href = ref.link;
        sat.target = '_blank';
        sat.rel = 'noopener noreferrer';
        sat.innerHTML = `
    <div class="title">${truncate(ref.title, 35)}</div>
    <div class="authors">${ref.authors}</div>
    <div class="journal">${ref.journal}</div>
  `;

        const angle = i * angleStep - Math.PI / 2;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        sat.style.position = 'absolute';
        sat.style.left = `${offsetX}px`;
        sat.style.top = `${offsetY}px`;
        sat.style.transform = 'translate(-50%, -50%)';
        orbitContainer.appendChild(sat);
        satellites.push(sat);

        // Animations (unchanged)
        gsap.fromTo(sat, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', delay: i * 0.03 });
        const hoverAmplitude = 5 + Math.random() * 4;
        const hoverDuration = 2.5 + Math.random() * 1.5;
        const direction = Math.random() < 0.5 ? "+=" : "-=";
        gsap.to(sat, { y: `${direction}${hoverAmplitude}`, duration: hoverDuration, ease: "sine.inOut", repeat: -1, yoyo: true });

        // 👇 Fix: unflip immediately, but delay reset so navigation can fire
        sat.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            const panelEl = sat.closest('.crop-panel');
            const inner = panelEl?.querySelector('.crop-inner');
            if (inner) inner.classList.remove('crop-flipped');  // visual feedback now
        });

        sat.addEventListener('click', (e) => {
            e.stopPropagation();                   // don't bubble to panel
            // DO NOT call preventDefault; let the link navigate
            // Delay reset to next frame so the browser captures the click navigation
            requestAnimationFrame(() => resetPanels());
        });

        // Optional: keyboard polish (don’t block default Enter navigation; prevent Space scroll)
        sat.addEventListener('keydown', (e) => {
            if (e.key === ' ') e.preventDefault();
        });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) resetPanels();
    });

    window.addEventListener('pageshow', (e) => {
        if (e.persisted) resetPanels();
    });

    // Also reset when the window regains focus (covers some edge cases)
    window.addEventListener('focus', resetPanels);

    // Shared rotation (same speed for all)
    const rotation = { angle: 0 };

    gsap.to(rotation, {
        angle: 360,
        duration: 600,
        repeat: -1,
        ease: 'none',
        onUpdate: () => {
            orbitContainer.style.transform = `rotate(${rotation.angle}deg)`;

            satellites.forEach((sat, i) => {
                // get current hover offset from GSAP (if any)
                const hoverY = gsap.getProperty(sat, "y");
                const baseAngleDeg = (i * 360) / numSatellites;
                const incrementalFix = i * (360 / numSatellites);
                const totalRotation = -rotation.angle - baseAngleDeg + incrementalFix;

                // ✅ combine rotation and hover translation
                sat.style.transform = `translate(-50%, calc(-50% + ${hoverY}px)) rotate(${totalRotation}deg)`;
            });
        }
    });

}



function truncate(text, max) {
    return text.length > max ? text.slice(0, max) + "…" : text;
}



document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('cropsGrid');
    const toggle = document.getElementById('cropsToggle');
    const mq = window.matchMedia('(max-width: 860px)');

    function applyMode() {
        if (mq.matches) {
            grid.classList.add('collapsed');
            toggle.hidden = false;
            toggle.setAttribute('aria-expanded', 'false');
            toggle.querySelector('.label').textContent = 'Show more';
        } else {
            grid.classList.remove('collapsed');
            toggle.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }
    }

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        grid.classList.toggle('collapsed', expanded);
        toggle.setAttribute('aria-expanded', String(!expanded));
        toggle.querySelector('.label').textContent = expanded ? 'Show more' : 'Show less';
        if (expanded) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    mq.addEventListener('change', applyMode);
    applyMode();
});
