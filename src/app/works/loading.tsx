"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GalleryPageSkeleton, BrandingPageSkeleton } from "@/components/Skeleton";

function WorksLoadingContent() {
  const searchParams = useSearchParams();
  const category = searchParams ? searchParams.get("category")?.toLowerCase() : null;
  const isGallery = category === "design" || category === "gallery";

  return isGallery ? <GalleryPageSkeleton /> : <BrandingPageSkeleton />;
}

export default function WorksLoading() {
  return (
    <Suspense fallback={<BrandingPageSkeleton />}>
      <WorksLoadingContent />
    </Suspense>
  );
}
