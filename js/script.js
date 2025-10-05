// js/script.js

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  // -------------------------
  // ScrollSmoother initialization
  // -------------------------
  if (document.querySelector("#wrapper") && document.querySelector("#content")) {
    ScrollSmoother.create({
      wrapper: "#wrapper",
      content: "#content",
      smooth: 1.2,
      effects: true
    });
  }

  // -------------------------
  // Video playback
  // -------------------------
  const video = document.querySelector(".background-video");
  if (video) video.playbackRate = 0.5;

  // -------------------------
  // Header text hover
  // -------------------------
  const headerText = document.querySelector(".header-text");
  if (headerText) {
    headerText.addEventListener("mouseenter", () => {
      headerText.classList.add("sharp");
    });
  }

  // -------------------------
  // Panel tilt / hover
  // -------------------------
  document.querySelectorAll('.panel').forEach(panel => {
    panel.addEventListener('mousemove', e => {
      const rect = panel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const moveX = ((x / rect.width) - 0.5) * 10;
      const moveY = ((y / rect.height) - 0.5) * 10;

      gsap.to(panel, {
        x: moveX,
        y: moveY,
        rotationY: moveX * 0.8,
        rotationX: -moveY * 0.8,
        ease: "power1.out",
        duration: 0.3
      });
    });

    panel.addEventListener('mouseleave', () => {
      gsap.to(panel, {
        x: 0,
        y: 0,
        rotationY: 0,
        rotationX: 0,
        ease: "power2.out",
        duration: 0.5
      });
    });
  });

  // -------------------------
  // Header links bounce
  // -------------------------
  const links = document.querySelectorAll(".header-link");

  links.forEach(link => {
    gsap.to(link, {
      y: gsap.utils.random(-1, 1),
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    link.addEventListener("mouseenter", () => {
      gsap.to(link, {
        y: gsap.utils.random(-1, 1),
        duration: 0.2,
        repeat: 3,
        yoyo: true,
        ease: "power1.inOut"
      });
    });
  });

  // -------------------------
  // Arrow squiggle
  // -------------------------
  // --- Arrow squiggle on hover (GSAP) ---
(function initArrowSquiggle() {
  const arrows = document.querySelectorAll(".header-link .arrow");

  arrows.forEach(arrow => {
    const parentLink = arrow.closest(".header-link");

    // Hover → smooth shift to the right
    parentLink.addEventListener("mouseenter", () => {
      gsap.to(arrow, {
        x: 10,              // shift right a bit more
        duration: 0.3,
        ease: "sine.inOut"
      });
    });

    // Leave → shift back smoothly
    parentLink.addEventListener("mouseleave", () => {
      gsap.to(arrow, {
        x: 0,
        duration: 0.4,
        ease: "sine.inOut"
      });
    });
  });
})();


  // -------------------------
  // Section background color animation
  // -------------------------
  const colors = [
    ["#1f2a38", "#3b1a1f"],  // dark bluish gray → deep muted red
    ["#2c3542", "#4a1f1f"],  // slightly lighter blue-gray → dark red
    ["#1e2933", "#382224"],  // very dark gray-blue → muted dark red-brown
    ["#27303b", "#3a2327"]   // grayish blue → dark reddish gray
  ];

  gsap.to({}, {
    duration: 10,
    repeat: -1,
    onRepeat: () => {
      const [c1, c2] = colors[Math.floor(Math.random() * colors.length)];
      gsap.to(".section-box", { "--color1": c1, "--color2": c2, duration: 10, ease: "sine.inOut" });
    }
  });


});



document.querySelectorAll("#benefits .section-panel").forEach(panel => {
  const img = panel.querySelector("img");
  const content = panel.querySelector(".benefit-panel-content");
  const text = panel.querySelector(".benefit-panel-text");

  panel.addEventListener("mouseenter", () => {
    gsap.to(img, { filter: "blur(3px) brightness(0.6)", duration: 0.3 });
    gsap.to(content, { y: -20, duration: 0.7, ease: "power2.out" });
    gsap.to(text, {
      opacity: 1,
      maxHeight: 300,
      duration: 0.7,
      ease: "power2.out",
      textShadow: "0px 2px 8px rgba(0,0,0,0.6)"
    });
  });

  panel.addEventListener("mouseleave", () => {
    gsap.to(img, { filter: "blur(0px) brightness(1)", duration: 0.5 });
    gsap.to(content, { y: 0, duration: 0.7, ease: "power2.in" });
    gsap.to(text, {
      opacity: 0,
      maxHeight: 0,
      duration: 0.7,
      ease: "power2.in",
      textShadow: "0px 0px 0px rgba(0,0,0,0)"
    });
  });
});

function latLngToCartesian(lat, lng, radius = world.getGlobeRadius()) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ];
}

function getPolygonCentroid(feature) {
  const coords = feature.geometry.coordinates[0];
  let latSum = 0, lngSum = 0;
  coords.forEach(c => { lngSum += c[0]; latSum += c[1]; });
  return [latSum / coords.length, lngSum / coords.length];
}






const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

hamburger.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");
});


const grid = document.querySelector('.crops-grid');
const panels = Array.from(document.querySelectorAll('.crop-panel'));

grid.addEventListener('mousemove', (e) => {
    const rect = grid.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    panels.forEach((panel) => {
        const panelRect = panel.getBoundingClientRect();
        const panelX = panelRect.left - rect.left + panelRect.width / 2;
        const panelY = panelRect.top - rect.top + panelRect.height / 2;

        const distance = Math.hypot(mouseX - panelX, mouseY - panelY);

        // Map distance to delay: closer panels flip faster
        const delay = Math.min(distance * 1.5, 100);

        // Clear previous timeout if any
        clearTimeout(panel.dataset.timeoutId);

        // If very close, flip immediately
        if (distance < 50) {
            panel.querySelector('.crop-inner').classList.add('crop-flipped');
        } else {
            panel.dataset.timeoutId = setTimeout(() => {
                panel.querySelector('.crop-inner').classList.add('crop-flipped');
            }, delay);
        }
    });
});

// Reset all panels when mouse leaves
grid.addEventListener('mouseleave', () => {
    panels.forEach((panel) => {
        clearTimeout(panel.dataset.timeoutId);
        panel.querySelector('.crop-inner').classList.remove('crop-flipped');
    });
});

