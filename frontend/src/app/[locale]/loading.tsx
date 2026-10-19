import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function PageLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-page px-5 py-16" aria-busy="true">
      <LoadingOverlay />
    </div>
  );
}
