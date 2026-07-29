export default function BusinessIndustriesLoading() {
  return (
    <main className="bg-page">
      <div className="kk-container-full py-12 lg:py-16" aria-busy="true" aria-live="polite">
        <div className="h-4 w-40 rounded bg-border" />
        <div className="mt-8 h-4 w-52 rounded bg-border" />
        <div className="mt-4 h-14 max-w-2xl rounded bg-border" />
        <div className="mt-5 h-20 max-w-3xl rounded bg-border" />
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="aspect-[4/3] rounded-kubikart-lg border border-border bg-surface" />
          ))}
        </div>
      </div>
    </main>
  );
}

