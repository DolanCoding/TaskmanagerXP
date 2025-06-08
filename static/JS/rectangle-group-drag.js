// Rectangle drag & grouped task-card movement & backend sync
export function initRectangleGroupDrag(whiteboard) {
  // This function will replace window.makeRectangleResizable
  window.makeRectangleResizable = function (rect) {
    if (!rect) return;
    // Add a resize handle (bottom right corner)
    const handle = document.createElement("div");
    handle.className = "resize-handle";
    rect.appendChild(handle);
    handle.addEventListener("mousedown", function (e) {
      e.stopPropagation();
      e.preventDefault();
      const startRect = rect.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      function onMove(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        rect.style.width = Math.max(20, startRect.width + dx) + "px";
        rect.style.height = Math.max(20, startRect.height + dy) + "px";
        if (window.saveRectanglesToStorage) window.saveRectanglesToStorage();
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    // Add a drag handle (top left corner)
    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.title = "Drag Rectangle";
    rect.appendChild(dragHandle);
    dragHandle.addEventListener("mousedown", function (e) {
      e.stopPropagation();
      e.preventDefault();
      let offsetX = e.clientX - rect.getBoundingClientRect().left;
      let offsetY = e.clientY - rect.getBoundingClientRect().top;
      // Find all task-cards fully inside this rectangle
      const rectBox = rect.getBoundingClientRect();
      const whiteboardRect = whiteboard.getBoundingClientRect();
      const groupedCards = Array.from(
        whiteboard.querySelectorAll(".task-card")
      ).filter((card) => {
        const cardBox = card.getBoundingClientRect();
        return (
          cardBox.left >= rectBox.left &&
          cardBox.right <= rectBox.right &&
          cardBox.top >= rectBox.top &&
          cardBox.bottom <= rectBox.bottom
        );
      });
      // Store initial positions
      const initialRectLeft = parseFloat(rect.style.left || 0);
      const initialRectTop = parseFloat(rect.style.top || 0);
      const initialCardPositions = groupedCards.map((card) => ({
        card,
        id: card.dataset.taskId,
        left: parseFloat(card.style.left || 0),
        top: parseFloat(card.style.top || 0),
      }));
      function onMove(ev) {
        let x = ev.clientX - whiteboardRect.left - offsetX;
        let y = ev.clientY - whiteboardRect.top - offsetY;
        x = Math.max(0, Math.min(x, whiteboard.offsetWidth - rect.offsetWidth));
        y = Math.max(
          0,
          Math.min(y, whiteboard.offsetHeight - rect.offsetHeight)
        );
        // Calculate offset
        const dx = x - initialRectLeft;
        const dy = y - initialRectTop;
        rect.style.left = x + "px";
        rect.style.top = y + "px";
        // Move grouped cards by the same offset
        initialCardPositions.forEach(({ card, left, top }) => {
          card.style.left = left + dx + "px";
          card.style.top = top + dy + "px";
          // Update percent-based position for responsive layout
          const container = whiteboard;
          const width = container.offsetWidth;
          const height = container.offsetHeight;
          card.dataset.xPercent = ((left + dx) / width).toFixed(6);
          card.dataset.yPercent = ((top + dy) / height).toFixed(6);
        });
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        // After drag ends, send all grouped card positions to backend
        if (initialCardPositions.length > 0) {
          const updates = initialCardPositions.map(({ card, id }) => ({
            task_id: id,
            x: parseInt(card.style.left, 10) || 0,
            y: parseInt(card.style.top, 10) || 0,
          }));
          fetch("/update_multiple_task_positions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates }),
          })
            .then((response) => {
              if (!response.ok) {
                response.text().then((text) => {
                  console.error(
                    "Network response was not ok (multiple update):",
                    response.status,
                    text
                  );
                });
                throw new Error("Network response was not ok");
              }
              return response.json();
            })
            .then((data) => {
              console.log("Server response (multiple update):", data);
            })
            .catch((error) => {
              console.error("Error updating multiple task positions:", error);
            });
        }
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    // Add a delete (X) button (top right corner)
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "rect-delete-btn";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.title = "Delete Rectangle";
    rect.appendChild(deleteBtn);
    deleteBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      rect.remove();
      if (window.saveRectanglesToStorage) window.saveRectanglesToStorage();
    });
  };
}
