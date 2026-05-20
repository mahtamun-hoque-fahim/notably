import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}>
            Notably
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Voice-powered note taking
          </p>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorBackground: "#111111",
              colorInputBackground: "#1a1a1a",
              colorInputText: "#f0f0f0",
              colorText: "#f0f0f0",
              colorTextSecondary: "#888888",
              colorPrimary: "#00e676",
              colorDanger: "#ff4444",
              borderRadius: "8px",
              fontFamily: "var(--font-onest)",
            },
            elements: {
              card: { boxShadow: "none", border: "1px solid #1f1f1f" },
              formButtonPrimary: { color: "#000000", fontWeight: "600" },
            },
          }}
        />
      </div>
    </div>
  );
}
