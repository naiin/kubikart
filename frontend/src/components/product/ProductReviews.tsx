"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

interface Review {
  id: number;
  reviewer: string;
  rating: number;
  review: string;
  date_created: string;
  verified: boolean;
}

export function ProductReviews({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("productPage");

  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section aria-labelledby="reviews-heading">
      <div className="flex items-center gap-3 mb-6">
        <h2 id="reviews-heading" className="text-xl font-bold text-navy-900 sm:text-2xl">
          {t("reviewsTitle")}
        </h2>
        <span className="text-sm text-gray-500">({reviews.length})</span>
      </div>

      {/* Summary */}
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-gray-200 bg-cream-50 p-4">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-5 w-5 ${i < Math.round(avgRating) ? "fill-accent-600 text-accent-600" : "fill-gray-200 text-gray-200"}`} />
          ))}
        </div>
        <span className="text-sm font-semibold text-navy-900">{avgRating.toFixed(1)} / 5</span>
        <span className="text-sm text-gray-500">
          – {reviews.length} {reviews.length === 1 ? t("reviewSingular") : t("reviewPlural")}
        </span>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-accent-600 text-accent-600" : "fill-gray-200 text-gray-200"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-navy-900">{review.reviewer}</span>
                {review.verified && <span className="text-xs text-green-600 font-medium">✓ {t("reviewVerified")}</span>}
              </div>
              <time className="text-xs text-gray-400">
                {new Date(review.date_created).toLocaleDateString("de-DE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
            </div>
            <p className="text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: review.review }} />
          </article>
        ))}
      </div>
    </section>
  );
}
