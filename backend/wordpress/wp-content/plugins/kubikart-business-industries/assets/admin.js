(() => {
  "use strict";

  const normalize = (value) => value.toLocaleLowerCase().trim();

  document.querySelectorAll(".kubikart-product-search").forEach((input) => {
    const list = document.getElementById(input.dataset.target);
    if (!list) return;

    input.addEventListener("input", () => {
      const query = normalize(input.value);
      list.querySelectorAll(".kubikart-product-row").forEach((row) => {
        const searchValue = normalize(row.dataset.productSearch || row.textContent || "");
        row.hidden = query !== "" && !searchValue.includes(query);
      });
    });
  });

  document.querySelectorAll(".kubikart-sortable-products").forEach((list) => {
    let draggedRow = null;

    list.addEventListener("change", (event) => {
      const row = event.target.closest(".kubikart-product-row");
      if (row) row.classList.toggle("is-selected", event.target.checked);
    });

    list.addEventListener("dragstart", (event) => {
      const row = event.target.closest(".kubikart-product-row");
      if (!row || !row.querySelector('input[type="checkbox"]:checked')) {
        event.preventDefault();
        return;
      }
      draggedRow = row;
      row.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
    });

    list.addEventListener("dragover", (event) => {
      if (!draggedRow) return;
      const target = event.target.closest(".kubikart-product-row");
      if (!target || target === draggedRow) return;
      event.preventDefault();
      const bounds = target.getBoundingClientRect();
      list.insertBefore(draggedRow, event.clientY < bounds.top + bounds.height / 2 ? target : target.nextSibling);
    });

    list.addEventListener("dragend", () => {
      draggedRow?.classList.remove("is-dragging");
      draggedRow = null;
    });
  });
})();

