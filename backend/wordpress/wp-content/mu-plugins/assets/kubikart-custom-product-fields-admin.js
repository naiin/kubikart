(function () {
  "use strict";

  function syncFieldControls(row) {
    var typeSelect = row.querySelector("[data-field-type]");
    if (!typeSelect) return;

    if (["text", "textarea", "select", "checkbox"].includes(typeSelect.value)) {
      row.removeAttribute("data-requires-review");
    } else {
      row.setAttribute("data-requires-review", "true");
    }

    row.querySelectorAll("[data-field-control]").forEach(function (cell) {
      var appliesTo = cell.getAttribute("data-field-control");
      var hasSelectedType = ["text", "textarea", "select", "checkbox"].includes(typeSelect.value);
      var visible =
        !hasSelectedType ||
        appliesTo === typeSelect.value ||
        (appliesTo === "text" && (typeSelect.value === "text" || typeSelect.value === "textarea"));

      // Keep desktop table cells in the column flow so later controls do not
      // shift underneath the wrong headings. CSS hides inactive controls
      // while preserving column alignment.
      cell.hidden = false;
      cell.classList.toggle("is-inactive", !visible);
      cell.querySelectorAll("input, textarea, select").forEach(function (control) {
        control.disabled = !visible;
      });
    });
  }

  function initializeRow(row) {
    if (row.dataset.kubikartInitialized === "true") return;

    var typeSelect = row.querySelector("[data-field-type]");
    var removeButton = row.querySelector("[data-remove-field]");

    if (typeSelect) {
      typeSelect.addEventListener("change", function () {
        syncFieldControls(row);
      });
    }
    if (removeButton) {
      removeButton.addEventListener("click", function () {
        row.remove();
      });
    }

    syncFieldControls(row);
    row.dataset.kubikartInitialized = "true";
  }

  function addRow(table, template) {
    var index = Number.parseInt(table.dataset.nextIndex || "0", 10);
    var html = template.innerHTML.replaceAll("__INDEX__", String(index));
    var container = document.createElement("tbody");
    container.innerHTML = html.trim();
    var row = container.firstElementChild;
    if (!row) return null;

    table.tBodies[0].appendChild(row);
    table.dataset.nextIndex = String(index + 1);
    initializeRow(row);
    return row;
  }

  function init(root) {
    var table = root.querySelector("#kubikart-fields-table");
    var template = root.querySelector("#kubikart-field-row-template");
    var addButton = root.querySelector("#kubikart-add-field");
    if (!table || !template || !addButton || table.dataset.kubikartInitialized === "true") return;

    table.querySelectorAll("[data-field-row]").forEach(initializeRow);
    addButton.addEventListener("click", function () {
      addRow(table, template);
    });
    table.dataset.kubikartInitialized = "true";
  }

  window.KubikartCustomFieldsAdmin = {
    addRow: addRow,
    init: init,
    initializeRow: initializeRow,
    syncFieldControls: syncFieldControls,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init(document);
    });
  } else {
    init(document);
  }
})();
