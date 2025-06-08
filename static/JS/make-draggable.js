// Generalized drag-and-drop utility
export function makeDraggable(selector, onDrop) {
  document.querySelectorAll(selector).forEach((el) => {
    let isDragging = false,
      offsetX = 0,
      offsetY = 0;
    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      const parentRect = el.parentElement.getBoundingClientRect();
      offsetX = e.clientX - parentRect.left - parseFloat(el.style.left || 0);
      offsetY = e.clientY - parentRect.top - parseFloat(el.style.top || 0);
      el.style.zIndex = 1000;
      el.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const parentRect = el.parentElement.getBoundingClientRect();
      let x = e.clientX - parentRect.left - offsetX;
      let y = e.clientY - parentRect.top - offsetY;
      x = Math.max(
        0,
        Math.min(x, el.parentElement.offsetWidth - el.offsetWidth)
      );
      y = Math.max(
        0,
        Math.min(y, el.parentElement.offsetHeight - el.offsetHeight)
      );
      el.style.left = x + "px";
      el.style.top = y + "px";
    });
    document.addEventListener("mouseup", (e) => {
      if (isDragging) {
        el.style.zIndex = "";
        el.style.cursor = "grab";
        document.body.style.userSelect = "";
        isDragging = false;
        if (onDrop) onDrop(el);
      }
    });
  });
}
