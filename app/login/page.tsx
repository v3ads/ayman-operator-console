"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Terminal, Lock, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace(from);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Invalid password");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Connection error — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080b0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#131a22",
            border: "1px solid #1e2d3d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Terminal size={18} style={{ color: "#f59e0b" }} />
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#f59e0b",
              textTransform: "uppercase",
            }}
          >
            Ayman Operator
          </div>
          <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em" }}>
            SECURE ACCESS
          </div>
        </div>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#0a0f16",
          border: "1px solid #1e2d3d",
          borderRadius: 12,
          padding: "2rem",
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Lock size={14} style={{ color: "#64748b" }} />
          <span style={{ fontSize: 12, color: "#64748b", letterSpacing: "0.08em" }}>
            AUTHENTICATION REQUIRED
          </span>
        </div>

        <div className="mb-4">
          <label
            htmlFor="password"
            style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 8 }}
          >
            Access Password
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#080b0f",
              border: `1px solid ${error ? "#ef4444" : "#1e2d3d"}`,
              borderRadius: 8,
              padding: "10px 14px",
              transition: "border-color 0.15s",
            }}
          >
            <Lock size={13} style={{ color: "#334155", flexShrink: 0 }} />
            <input
              ref={inputRef}
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter password"
              disabled={loading}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#e2e8f0",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {error && (
          <div
            className="flex items-center gap-2 mb-4"
            style={{
              background: "#1a0a0a",
              border: "1px solid #3d1e1e",
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            <AlertCircle size={12} style={{ color: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#ef4444" }}>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password.trim()}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 8,
            background: loading || !password.trim() ? "#131a22" : "#f59e0b",
            color: loading || !password.trim() ? "#334155" : "#080b0f",
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: loading || !password.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.15s",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              VERIFYING…
            </>
          ) : (
            "ENTER"
          )}
        </button>
      </form>

      <p style={{ fontSize: 10, color: "#1e2d3d", marginTop: "2rem" }}>
        Ayman Operator Console · Restricted Access
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080b0f" }} />}>
      <LoginForm />
    </Suspense>
  );
}
