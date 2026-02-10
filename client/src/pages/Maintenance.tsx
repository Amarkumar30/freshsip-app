import React from "react";

export default function Maintenance() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "radial-gradient(circle at 10% 10%, #1f2937, #0f172a)",
        color: "#fff",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 900 }}>
        <div
          style={{
            fontSize: 48,
            lineHeight: 1.05,
            fontWeight: 700,
            marginBottom: 20,
          }}
        >
          “The pause you take today is the power you bring tomorrow.”
        </div>
        <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 28 }}>
          We're taking a short break to regroup and improve. Thanks for your patience — we'll return when we're ready.
        </p>
        <div style={{ fontSize: 14, color: "#CBD5E1" }}>
          If you expect this page in error, please try again later.
        </div>
      </div>
    </div>
  );
}
