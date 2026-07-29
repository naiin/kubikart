export default function IndustryDetailLoading() {
  return (
    <main className="bg-page">
      <div className="kk-container-full py-12 lg:py-16" aria-busy="true" aria-live="polite">
        <div className="h-4 w-56 rounded bg-border" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="h-4 w-40 rounded bg-border" />
            <div className="mt-4 h-28 rounded bg-border" />
            <div className="mt-5 h-20 rounded bg-border" />
          </div>
          <div className="aspect-[4/3] rounded-kubikart-lg border border-border bg-surface" />
        </div>
      </div>
    </main>
  );
}

