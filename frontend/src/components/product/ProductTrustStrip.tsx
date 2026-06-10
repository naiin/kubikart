export function ProductTrustStrip({ items }: { items: string[] }) {
  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl bg-cream-50 px-4 py-3 text-sm font-semibold text-navy-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-600" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
