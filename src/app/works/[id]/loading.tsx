"use client";

import LoadingAnimation from "@/components/LoadingAnimation";

export default function CaseLoading() {
  return (
    <main
      className="shell"
      style={{
        paddingTop: "200px",
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoadingAnimation fullPage={false} message="Բեռնվում է..." />
    </main>
  );
}
