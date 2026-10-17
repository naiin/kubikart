(() => {
  "use strict";

  const normalize = (value) => value.toLocaleLowerCase().trim();

  document.querySelectorAll(".kubikart-picker").forEach((picker) => {
    const selected = picker.querySelector(".kubikart-selected");
    const available = picker.querySelector(".kubikart-available");
    const empty = picker.querySelector(".kubikart-empty");
    const search = picker.querySelector(".kubikart-product-search");
    if (!selected || !available) return;

    const refresh = () => {
      if (empty) empty.hidden = selected.children.length > 0;
    };

    const applySearch = () => {
      const query = normalize(search?.value || "");
      available.querySelectorAll(".kubikart-product-row").forEach((row) => {
        row.hidden = query !== "" && !normalize(row.dataset.productSearch || row.textContent || "").includes(query);
      });
    };

    search?.addEventListener("input", applySearch);

    picker.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const row = button.closest(".kubikart-product-row");
      if (!row) return;
      const action = button.dataset.action;

      if (action === "add") {
        row.querySelector('input[type="hidden"]').disabled = false;
        row.hidden = false;
        selected.appendChild(row);
      } else if (action === "remove") {
        row.querySelector('input[type="hidden"]').disabled = true;
        available.insertBefore(row, available.firstChild);
        applySearch();
      } else if (action === "up" && row.previousElementSibling) {
        selected.insertBefore(row, row.previousElementSibling);
        button.focus();
      } else if (action === "down" && row.nextElementSibling) {
        selected.insertBefore(row.nextElementSibling, row);
        button.focus();
      }
      refresh();
    });
  });
})();
