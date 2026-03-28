import { ReactNode } from "react";
import AppHeader from "@/components/app-header";

export default function PageShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
      }}
    >
      <AppHeader />

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: 24,
        }}
      >
        {children}
      </main>
    </div>
  );
}
