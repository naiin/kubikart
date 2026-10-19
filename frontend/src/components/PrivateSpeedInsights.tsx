"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { filterMeasurementUrl } from "@/lib/analytics-privacy";

export function PrivateSpeedInsights() {
  return <SpeedInsights beforeSend={filterMeasurementUrl} />;
}
