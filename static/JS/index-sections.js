// Section caret toggling for index.html
export function initSectionToggles() {
  document.querySelectorAll("[data-toggle-section]").forEach((toggle) => {
    const sectionId = toggle.getAttribute("data-toggle-section");
    const section = document.getElementById(sectionId);
    const label = toggle.getAttribute("data-label");
    // Set initial caret and label, always overwriting any fallback text
    setCaret(toggle, section, label);
    toggle.addEventListener("click", function () {
      // Toggle only the inline style
      if (section.style.display === "none") {
        section.style.display = "";
      } else {
        section.style.display = "none";
      }
      setCaret(toggle, section, label);
    });
  });
  function setCaret(toggle, section, label) {
    if (toggle && section) {
      let caret = "";
      if (section.style.display === "none") {
        caret = ' <span class="caret">&#x25BC;</span>';
      } else {
        caret = ' <span class="caret">&#x25B2;</span>';
      }
      toggle.innerHTML = label + caret;
    }
  }
}
