// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type AdminApi = {
  addRow: (table: HTMLTableElement, template: HTMLTemplateElement) => HTMLTableRowElement | null;
  init: (root: Document) => void;
  syncFieldControls: (row: HTMLTableRowElement) => void;
};

const adminScript = readFileSync(
  resolve(process.cwd(), "../backend/wordpress/wp-content/mu-plugins/assets/kubikart-custom-product-fields-admin.js"),
  "utf8",
);

function fieldRow(index: string) {
  return `
    <tr data-field-row>
      <td><input name="kubikart_cf[${index}][id]"></td>
      <td><input name="kubikart_cf[${index}][label]"></td>
      <td><select name="kubikart_cf[${index}][type]" data-field-type>
        <option value="text">Text</option>
        <option value="textarea">Textarea</option>
        <option value="select">Select</option>
        <option value="checkbox">Checkbox</option>
      </select></td>
      <td><input type="checkbox" name="kubikart_cf[${index}][required]"></td>
      <td data-field-control="text"><input name="kubikart_cf[${index}][placeholder]"></td>
      <td data-field-control="text"><input name="kubikart_cf[${index}][maxLength]" value="20"></td>
      <td data-field-control="select"><textarea name="kubikart_cf[${index}][options]">classic|Classic</textarea></td>
      <td data-field-control="select"><input name="kubikart_cf[${index}][defaultValue]"></td>
      <td data-field-control="checkbox"><input name="kubikart_cf[${index}][price]" value="2.50"></td>
      <td><input name="kubikart_cf[${index}][helperText]"></td>
      <td><button type="button" data-remove-field>Remove</button></td>
    </tr>`;
}

function setupEditor() {
  const templateRow = fieldRow("__INDEX__").replace(
    '<option value="text">',
    '<option value="" selected>Choose type</option><option value="text">',
  );
  document.body.innerHTML = `
    <table id="kubikart-fields-table" data-next-index="1"><tbody>${fieldRow("0")}</tbody></table>
    <button id="kubikart-add-field" type="button">Add</button>
    <template id="kubikart-field-row-template">${templateRow}</template>`;
  window.eval(adminScript);
  const api = (window as typeof window & { KubikartCustomFieldsAdmin: AdminApi }).KubikartCustomFieldsAdmin;
  api.init(document);
  return api;
}

describe("Kubikart product-field admin editor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    delete (window as typeof window & { KubikartCustomFieldsAdmin?: AdminApi }).KubikartCustomFieldsAdmin;
  });

  it("initializes existing rows and shows only controls for the selected type", () => {
    const api = setupEditor();
    const row = document.querySelector<HTMLTableRowElement>("[data-field-row]")!;
    const select = row.querySelector<HTMLSelectElement>("[data-field-type]")!;
    const textCell = row.querySelector<HTMLElement>('[data-field-control="text"]')!;
    const selectCell = row.querySelector<HTMLElement>('[data-field-control="select"]')!;
    const checkboxCell = row.querySelector<HTMLElement>('[data-field-control="checkbox"]')!;

    expect(row.dataset.kubikartInitialized).toBe("true");
    expect(textCell.classList.contains("is-inactive")).toBe(false);
    expect(selectCell.classList.contains("is-inactive")).toBe(true);
    expect(checkboxCell.classList.contains("is-inactive")).toBe(true);

    select.value = "select";
    select.dispatchEvent(new Event("change"));
    expect(textCell.classList.contains("is-inactive")).toBe(true);
    expect(selectCell.classList.contains("is-inactive")).toBe(false);
    expect(checkboxCell.classList.contains("is-inactive")).toBe(true);

    select.value = "checkbox";
    select.dispatchEvent(new Event("change"));
    expect(textCell.classList.contains("is-inactive")).toBe(true);
    expect(selectCell.classList.contains("is-inactive")).toBe(true);
    expect(checkboxCell.classList.contains("is-inactive")).toBe(false);
    expect(row.querySelector<HTMLInputElement>('[name$="[maxLength]"]')!.value).toBe("20");

    api.syncFieldControls(row);
  });

  it("adds a fully initialized editable row with a unique field index", () => {
    const api = setupEditor();
    const table = document.querySelector<HTMLTableElement>("#kubikart-fields-table")!;
    const template = document.querySelector<HTMLTemplateElement>("#kubikart-field-row-template")!;
    const row = api.addRow(table, template)!;

    expect(row).not.toBeNull();
    expect(row.dataset.kubikartInitialized).toBe("true");
    expect(row.querySelector('[name="kubikart_cf[1][type]"]')).not.toBeNull();
    expect(row.querySelector('[name="kubikart_cf[1][options]"]')).not.toBeNull();
    expect(row.querySelector('[name="kubikart_cf[1][price]"]')).not.toBeNull();
    expect(
      row.querySelector<HTMLInputElement>('[name="kubikart_cf[1][defaultValue]"]')!.disabled,
    ).toBe(false);
    expect(row.querySelector<HTMLInputElement>('[name="kubikart_cf[1][price]"]')!.disabled).toBe(
      false,
    );
    expect(
      row
        .querySelector<HTMLInputElement>('[name="kubikart_cf[1][defaultValue]"]')!
        .closest("[data-field-control]")!
        .classList.contains("is-inactive"),
    ).toBe(false);
    expect(table.dataset.nextIndex).toBe("2");
  });

  it("removes only the requested row", () => {
    setupEditor();
    const row = document.querySelector<HTMLTableRowElement>("[data-field-row]")!;
    row.querySelector<HTMLButtonElement>("[data-remove-field]")!.click();
    expect(document.querySelector("[data-field-row]")).toBeNull();
  });
});
