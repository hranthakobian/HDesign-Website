"use client";

import React from "react";
import GlobalErrorPage from "@/app/error";

export default function Error500PreviewPage() {
  return (
    <GlobalErrorPage
      error={new Error("500 Server Simulation")}
      reset={() => window.location.reload()}
    />
  );
}
