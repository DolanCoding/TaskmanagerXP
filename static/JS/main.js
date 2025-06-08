import { initWhiteboardRectangles } from "./whiteboard-rectangles.js";
import { initRectangleGroupDrag } from "./rectangle-group-drag.js";
import { colorizeTaskCards } from "./taskcard-color.js";
import { initSectionToggles } from "./index-sections.js";
import { makeDraggable } from "./make-draggable.js";

document.addEventListener("DOMContentLoaded", function () {
  const whiteboard = document.getElementById("pinboard-placeholder");
  if (whiteboard) {
    initWhiteboardRectangles(whiteboard);
    initRectangleGroupDrag(whiteboard);
  }
  colorizeTaskCards();
  initSectionToggles();

  // --- Responsive Task Card Positioning ---
  function updateCardPositionsFromPercent() {
    const container = document.getElementById("pinboard-placeholder");
    if (!container) return;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    document.querySelectorAll(".task-card").forEach((card) => {
      const xPercent = parseFloat(card.dataset.xPercent);
      const yPercent = parseFloat(card.dataset.yPercent);
      if (!isNaN(xPercent) && !isNaN(yPercent)) {
        const cardWidth = card.offsetWidth;
        const cardHeight = card.offsetHeight;
        let left = xPercent * width;
        let top = yPercent * height;
        // Clamp so card stays fully inside container
        left = Math.max(0, Math.min(left, width - cardWidth));
        top = Math.max(0, Math.min(top, height - cardHeight));
        card.style.left = left + "px";
        card.style.top = top + "px";
      }
    });
  }

  // On initial load, convert px to percent and store as data attributes
  function initializeCardPercentPositions() {
    const container = document.getElementById("pinboard-placeholder");
    if (!container) return;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    document.querySelectorAll(".task-card").forEach((card) => {
      const leftPx = parseInt(card.style.left, 10) || 0;
      const topPx = parseInt(card.style.top, 10) || 0;
      card.dataset.xPercent = (leftPx / width).toFixed(6);
      card.dataset.yPercent = (topPx / height).toFixed(6);
    });
  }

  // On window resize, reposition cards
  window.addEventListener("resize", updateCardPositionsFromPercent);

  // Generalized draggable initialization for task cards
  makeDraggable(".task-card", (card) => {
    const container = document.getElementById("pinboard-placeholder");
    if (!container) return;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const id = card.dataset.taskId;
    const x = parseInt(card.style.left, 10) || 0;
    const y = parseInt(card.style.top, 10) || 0;
    card.dataset.xPercent = (x / width).toFixed(6);
    card.dataset.yPercent = (y / height).toFixed(6);
    if (id) {
      fetch("/update_task_position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: id, x: x, y: y }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Optionally log or handle response
        });
    }
  });

  // Re-apply makeRectangleResizable to all rectangles after everything is loaded
  setTimeout(() => {
    document.querySelectorAll(".whiteboard-rectangle").forEach((rect) => {
      if (window.makeRectangleResizable) window.makeRectangleResizable(rect);
    });
  }, 0);

  // Initialize percent positions and set initial positions
  initializeCardPercentPositions();
  updateCardPositionsFromPercent();

  // Sidebar mobile toggle logic
  const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
  const sidebar = document.getElementById("sidebar");
  function handleSidebarToggle() {
    sidebar.classList.toggle("sidebar-open");
  }
  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener("click", handleSidebarToggle);
    // Hide sidebar by default on mobile
    function handleResize() {
      if (window.innerWidth <= 900) {
        sidebar.classList.remove("sidebar-open");
        sidebarToggleBtn.style.display = "block";
      } else {
        sidebar.classList.remove("sidebar-open");
        sidebarToggleBtn.style.display = "none";
      }
    }
    window.addEventListener("resize", handleResize);
    handleResize();
  }

  // Pinboard zoom logic
  let zoom = 1;
  const zoomWrapper = document.getElementById("pinboard-zoom-wrapper");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomResetBtn = document.getElementById("zoom-reset-btn");
  function setZoom(val) {
    zoom = Math.max(0.5, Math.min(2, val));
    if (zoomWrapper) zoomWrapper.style.transform = `scale(${zoom})`;
  }
  if (zoomInBtn) zoomInBtn.addEventListener("click", () => setZoom(zoom + 0.1));
  if (zoomOutBtn)
    zoomOutBtn.addEventListener("click", () => setZoom(zoom - 0.1));
  if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => setZoom(1));
  // Optional: Mouse wheel + Ctrl for zoom
  if (zoomWrapper) {
    zoomWrapper.addEventListener("wheel", (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom(zoom + (e.deltaY < 0 ? 0.05 : -0.05));
      }
    });
  }
});
