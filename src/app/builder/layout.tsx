import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visual Builder | HDesign Studio",
  description: "HDesign Visual Site Builder & Theme Engine",
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
