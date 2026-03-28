import Link from "next/link";
import { APP_INFO } from "@/lib/app-info";

function badgeStyle(background: string, color = "white") {
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600 as const,
    background,
    color,
  };
}

export default function AppHeader() {
  const isProd = APP_INFO.environment === "Production";

  return (
    <header
      style={{
        background: "linear-gradient(90deg, #17324d 0%, #254f7a 100%)",
        color: "white",
        padding: "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            <Link
              href="/applications"
              style={{ color: "white", textDecoration: "none" }}
            >
              {APP_INFO.name}
            </Link>
          </div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            Merger application rationalization workbench
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/applications"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Applications
          </Link>

  <Link
    href="/dashboard"
    style={{
      color: "white",
      textDecoration: "none",
      fontSize: 14,
      fontWeight: 500,
    }}
  >
    Dashboard
  </Link>



          <span style={badgeStyle("rgba(255,255,255,0.18)")}>
            {APP_INFO.version}
          </span>

          <span
            style={
              isProd
                ? badgeStyle("#2e7d32")
                : badgeStyle("#f5c542", "#2d2400")
            }
          >
            {APP_INFO.environment}
          </span>
        </div>
      </div>
    </header>
  );
}
