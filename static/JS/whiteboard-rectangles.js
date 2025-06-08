// Drawing, resizing, color pickers, rectangle storage
export function initWhiteboardRectangles(whiteboard) {
  const drawRectBtn = document.getElementById("draw-rect-btn");
  let drawingMode = false;
  let isDrawing = false;
  let currentRect = null;
  let startX = 0;
  let startY = 0;

  // Initialize color pickers
  let fillColor = "#ffff00";
  let outlineColor = "#000000";
  const colorPicker = document.getElementById("rect-color-picker");
  const outlinePicker = document.getElementById("rect-outline-picker");
  if (colorPicker) {
    colorPicker.addEventListener("input", function () {
      fillColor = colorPicker.value;
    });
  }
  if (outlinePicker) {
    outlinePicker.addEventListener("input", function () {
      outlineColor = outlinePicker.value;
    });
  }

  if (drawRectBtn && whiteboard) {
    drawRectBtn.addEventListener("click", function () {
      drawingMode = true;
      drawRectBtn.disabled = true;
      whiteboard.style.cursor = "crosshair";
    });

    whiteboard.addEventListener("mousedown", function (e) {
      if (!drawingMode) return;
      if (e.target !== whiteboard) return; // Only start drawing on the whiteboard background
      if (e.button !== 0) return;
      const rect = whiteboard.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      isDrawing = true;
      currentRect = document.createElement("div");
      currentRect.className = "whiteboard-rectangle resizeable-rectangle";
      currentRect.style.position = "absolute";
      currentRect.style.left = startX + "px";
      currentRect.style.top = startY + "px";
      currentRect.style.width = "0px";
      currentRect.style.height = "0px";
      currentRect.style.backgroundColor = fillColor + "55";
      currentRect.style.borderColor = outlineColor;
      whiteboard.appendChild(currentRect);
    });

    whiteboard.addEventListener("mousemove", function (e) {
      if (!drawingMode || !isDrawing || !currentRect) return;
      const rect = whiteboard.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const moveY = e.clientY - rect.top;
      const width = Math.abs(moveX - startX);
      const height = Math.abs(moveY - startY);
      currentRect.style.width = width + "px";
      currentRect.style.height = height + "px";
      currentRect.style.left = Math.min(moveX, startX) + "px";
      currentRect.style.top = Math.min(moveY, startY) + "px";
    });

    whiteboard.addEventListener("mouseup", function (e) {
      if (!drawingMode || !isDrawing || !currentRect) return;
      isDrawing = false;
      drawingMode = false;
      drawRectBtn.disabled = false;
      whiteboard.style.cursor = "default";
      // Make the rectangle resizable after creation
      if (window.makeRectangleResizable) {
        window.makeRectangleResizable(currentRect);
      }
      currentRect = null;
      saveRectanglesToStorage(); // Save after drawing
    });
  }

  // --- Responsive Rectangle Positioning ---
  function updateRectanglesFromPercent() {
    const width = whiteboard.offsetWidth;
    const height = whiteboard.offsetHeight;
    document.querySelectorAll(".whiteboard-rectangle").forEach((rect) => {
      const xPercent = parseFloat(rect.dataset.xPercent);
      const yPercent = parseFloat(rect.dataset.yPercent);
      const wPercent = parseFloat(rect.dataset.wPercent);
      const hPercent = parseFloat(rect.dataset.hPercent);
      if (
        !isNaN(xPercent) &&
        !isNaN(yPercent) &&
        !isNaN(wPercent) &&
        !isNaN(hPercent)
      ) {
        rect.style.left = xPercent * width + "px";
        rect.style.top = yPercent * height + "px";
        rect.style.width = wPercent * width + "px";
        rect.style.height = hPercent * height + "px";
      }
    });
  }

  // On initial load, convert px to percent and store as data attributes
  function initializeRectPercentPositions() {
    const width = whiteboard.offsetWidth;
    const height = whiteboard.offsetHeight;
    document.querySelectorAll(".whiteboard-rectangle").forEach((rect) => {
      const leftPx = parseFloat(rect.style.left) || 0;
      const topPx = parseFloat(rect.style.top) || 0;
      const wPx = parseFloat(rect.style.width) || 0;
      const hPx = parseFloat(rect.style.height) || 0;
      rect.dataset.xPercent = (leftPx / width).toFixed(6);
      rect.dataset.yPercent = (topPx / height).toFixed(6);
      rect.dataset.wPercent = (wPx / width).toFixed(6);
      rect.dataset.hPercent = (hPx / height).toFixed(6);
    });
  }

  // On window resize, reposition and resize rectangles
  window.addEventListener("resize", updateRectanglesFromPercent);

  // Patch saveRectanglesToStorage to save percent values
  function saveRectanglesToStorage() {
    const width = whiteboard.offsetWidth;
    const height = whiteboard.offsetHeight;
    const rectangles = Array.from(
      whiteboard.querySelectorAll(".whiteboard-rectangle")
    ).map((rect) => {
      // Always update percent attributes before saving
      const leftPx = parseFloat(rect.style.left) || 0;
      const topPx = parseFloat(rect.style.top) || 0;
      const wPx = parseFloat(rect.style.width) || 0;
      const hPx = parseFloat(rect.style.height) || 0;
      rect.dataset.xPercent = (leftPx / width).toFixed(6);
      rect.dataset.yPercent = (topPx / height).toFixed(6);
      rect.dataset.wPercent = (wPx / width).toFixed(6);
      rect.dataset.hPercent = (hPx / height).toFixed(6);
      return {
        xPercent: rect.dataset.xPercent,
        yPercent: rect.dataset.yPercent,
        wPercent: rect.dataset.wPercent,
        hPercent: rect.dataset.hPercent,
        backgroundColor: rect.style.backgroundColor,
        borderColor: rect.style.borderColor,
      };
    });
    localStorage.setItem("whiteboard_rectangles", JSON.stringify(rectangles));
  }

  // Patch loadRectanglesFromStorage to use percent values
  function loadRectanglesFromStorage() {
    const data = localStorage.getItem("whiteboard_rectangles");
    if (!data) return;
    const rectangles = JSON.parse(data);
    const width = whiteboard.offsetWidth;
    const height = whiteboard.offsetHeight;
    rectangles.forEach((props) => {
      const rect = document.createElement("div");
      rect.className = "whiteboard-rectangle resizeable-rectangle";
      rect.style.position = "absolute";
      rect.dataset.xPercent = props.xPercent;
      rect.dataset.yPercent = props.yPercent;
      rect.dataset.wPercent = props.wPercent;
      rect.dataset.hPercent = props.hPercent;
      rect.style.left = parseFloat(props.xPercent) * width + "px";
      rect.style.top = parseFloat(props.yPercent) * height + "px";
      rect.style.width = parseFloat(props.wPercent) * width + "px";
      rect.style.height = parseFloat(props.hPercent) * height + "px";
      rect.style.backgroundColor = props.backgroundColor;
      rect.style.borderColor = props.borderColor;
      whiteboard.appendChild(rect);
      if (window.makeRectangleResizable) {
        window.makeRectangleResizable(rect);
      }
    });
  }

  // After drawing, also set percent attributes
  whiteboard.addEventListener("mouseup", function (e) {
    if (currentRect) {
      initializeRectPercentPositions();
      saveRectanglesToStorage();
    }
  });

  // After resize or drag, update percent attributes and save
  document.addEventListener("mouseup", function () {
    initializeRectPercentPositions();
    saveRectanglesToStorage();
  });

  // On initial load
  loadRectanglesFromStorage();
  initializeRectPercentPositions();
  updateRectanglesFromPercent();
}
