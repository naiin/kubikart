"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { readCart, writeCart } from "@/lib/cart";
import { formatProductPrice, type ProductPageProduct, type ProductPersonalizationOption } from "@/lib/product-page";

function getOptionLabel(option: ProductPersonalizationOption, value: string) {
  return option.options?.find((entry) => entry.value === value)?.label || value;
}

function buildCustomizationData(formData: FormData, options: ProductPersonalizationOption[]) {
  const customizationSummary: string[] = [];
  const customizations: Record<string, string> = {};

  for (const option of options) {
    let value = "";

    if (option.type === "file") {
      const fileValue = formData.get(option.id);
      if (fileValue instanceof File && fileValue.name) {
        value = fileValue.name;
      }
    } else {
      value = String(formData.get(option.id) || "").trim();
    }

    if (!value) {
      continue;
    }

    const label = getOptionLabel(option, value);
    if (/^kein(?:e|er|en)?\b/i.test(label)) {
      continue;
    }

    customizationSummary.push(`${option.label}: ${label}`);
    customizations[option.id] = label;
  }

  return { customizationSummary, customizations };
}

function ColorOptionGroup({ option }: { option: ProductPersonalizationOption }) {
  if (!option.options?.length) {
    return null;
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-950">
        {option.label}
        {option.required ? <span className="ml-1 text-accent-600">*</span> : null}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {option.options.map((choice, index) => (
          <label
            key={choice.value}
            className="cursor-pointer rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors has-checked:border-navy-900 has-checked:bg-navy-900 has-checked:text-white hover:border-navy-900"
          >
            <input type="radio" name={option.id} value={choice.value} defaultChecked={index === 0} required={option.required} className="sr-only" />
            {choice.label}
          </label>
        ))}
      </div>
      {option.helperText ? <p className="mt-2 text-xs text-gray-500">{option.helperText}</p> : null}
    </fieldset>
  );
}

export function ProductPurchaseForm({
  product,
  formId,
  showHeaderPrice = true,
}: {
  product: ProductPageProduct;
  formId: string;
  showHeaderPrice?: boolean;
}) {
  const t = useTranslations("productPage");
  const canAddToCart = product.availability !== "out_of_stock";
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    if (!canAddToCart) {
      return;
    }

    const formData = new FormData(form);
    const { customizationSummary, customizations } = buildCustomizationData(formData, product.personalizationOptions);
    const cart = readCart();

    cart.push({
      lineId: crypto.randomUUID(),
      id: product.id,
      name: product.name,
      price: product.price.amount.toFixed(2),
      image: product.images[0]?.src || "",
      quantity,
      slug: product.slug,
      customizationSummary,
      customizations,
    });

    writeCart([...cart]);
    setNotice(t("addedToCart", { name: product.name }));
    setQuantity(1);
    form.reset();
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="rounded-[28px] border border-gray-200 bg-cream-50 p-6 shadow-[0_18px_50px_rgba(6,20,38,0.06)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-navy-900">{t("formTitle")}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">{t("formSubtitle")}</p>
        </div>
        {showHeaderPrice ? (
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{t("price")}</p>
            <p className="text-2xl font-extrabold tracking-[-0.03em] text-navy-900">{formatProductPrice(product.price)}</p>
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        {product.personalizationOptions.map((option) => {
          if (option.type === "color") {
            return <ColorOptionGroup key={option.id} option={option} />;
          }

          return (
            <div key={option.id}>
              <label htmlFor={option.id} className="text-sm font-semibold text-gray-950">
                {option.label}
                {option.required ? <span className="ml-1 text-accent-600">*</span> : null}
              </label>

              {option.type === "textarea" ? (
                <textarea
                  id={option.id}
                  name={option.id}
                  placeholder={option.placeholder}
                  required={option.required}
                  maxLength={option.maxLength}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10"
                />
              ) : option.type === "select" ? (
                <select
                  id={option.id}
                  name={option.id}
                  required={option.required}
                  defaultValue={option.options?.[0]?.value}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10"
                >
                  {option.options?.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              ) : option.type === "file" ? (
                <input
                  id={option.id}
                  name={option.id}
                  type="file"
                  required={option.required}
                  accept={option.accept}
                  className="mt-2 block w-full cursor-pointer rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-accent-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy-900"
                />
              ) : (
                <input
                  id={option.id}
                  name={option.id}
                  type="text"
                  placeholder={option.placeholder}
                  required={option.required}
                  maxLength={option.maxLength}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10"
                />
              )}

              {option.helperText || option.maxLength ? (
                <p className="mt-2 text-xs text-gray-500">
                  {option.helperText}
                  {option.helperText && option.maxLength ? " " : null}
                  {option.maxLength ? t("maxChars", { count: option.maxLength }) : null}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor={`${formId}-quantity`} className="text-sm font-semibold text-gray-950">
            {t("quantity")}
          </label>
          <div className="mt-2 inline-flex items-center rounded-full border border-gray-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
              className="h-10 w-10 rounded-full text-lg font-semibold text-navy-900 transition hover:bg-cream-50"
              aria-label={t("quantityDecrease")}
            >
              -
            </button>
            <input
              id={`${formId}-quantity`}
              name="quantity"
              readOnly
              value={quantity}
              className="w-12 bg-transparent text-center text-base font-semibold text-navy-900 outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((currentQuantity) => Math.min(99, currentQuantity + 1))}
              className="h-10 w-10 rounded-full text-lg font-semibold text-navy-900 transition hover:bg-cream-50"
              aria-label={t("quantityIncrease")}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:max-w-xs">
          <button
            type="submit"
            disabled={!canAddToCart}
            className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold transition ${
              canAddToCart ? "bg-navy-900 text-white hover:bg-navy-800" : "cursor-not-allowed bg-gray-300 text-white"
            }`}
          >
            {canAddToCart ? t("addToCart") : t("outOfStock")}
          </button>
          <a href={product.supportHref} className="text-center text-sm font-semibold text-navy-900 transition hover:text-accent-600">
            {t("askQuestion")}
          </a>
        </div>
      </div>

      {notice ? (
        <p role="status" className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-navy-900">
          {notice}
        </p>
      ) : null}
    </form>
  );
}
