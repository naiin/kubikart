import { getAllReviews } from "@/lib/woocommerce";
import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";

export async function CustomerReviews() {
  const t = await getTranslations("homepage");

  let reviews: Awaited<ReturnType<typeof getAllReviews>> = [];
  try {
    reviews = await getAllReviews(6);
  } catch {
    reviews = [];
  }

  if (reviews.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-600">{t("reviewsEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{t("reviewsTitle")}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <article key={review.id} className="flex flex-col rounded-2xl border border-gray-200 bg-cream-50 p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-accent-600 text-accent-600" : "fill-gray-200 text-gray-200"}`} />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: review.review }} />
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-navy-900">{review.reviewer}</p>
                <p className="text-xs text-gray-500">{review.product_name}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
