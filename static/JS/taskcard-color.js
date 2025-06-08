// Task card colorization by category
export function colorizeTaskCards() {
  const categoryColors = {
    hobby: "#ff9800",
    living: "#00bcd4",
    housekeeping: "#8bc34a",
    friends: "#e91e63",
    work: "#3f51b5",
    health: "#009688",
    other: "#9e9e9e",
    learning: "#2196f3",
  };
  document.querySelectorAll(".task-card").forEach((card) => {
    // Restore position from style or data attributes if present
    let left = card.getAttribute("data-x") || card.style.left;
    let top = card.getAttribute("data-y") || card.style.top;
    if (left && !isNaN(parseInt(left))) card.style.left = parseInt(left) + "px";
    if (top && !isNaN(parseInt(top))) card.style.top = parseInt(top) + "px";
    card.style.position = "absolute";

    const categoryLabel = card.querySelector(".task-card-category");
    if (!categoryLabel) return;
    let category =
      categoryLabel.dataset.category ||
      categoryLabel.textContent.trim().toLowerCase();
    category = category.replace(/\s+/g, "").toLowerCase();
    // Use sidebar color for 'learning'
    const color =
      category === "learning"
        ? "#2196f3" // Sidebar blue for learning
        : categoryColors[category] || "#b0bec5";
    card.style.borderLeft = `5px solid ${color}`;
    categoryLabel.style.background = color + "22";
    categoryLabel.style.color = color;
    categoryLabel.style.borderColor = color;
    categoryLabel.style.fontWeight = "bold";
  });
}
