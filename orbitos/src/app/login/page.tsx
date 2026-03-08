"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const rolesByDomain: Record<string, string[]> = {
  Designing: ["Design Lead", "Product Designer", "UI Designer", "UX Researcher"],
  "IT Project": ["Project Manager", "Developer", "QA Engineer", "DevOps Engineer"],
  Content: ["Content Manager", "Copywriter", "SEO Specialist", "Editor"],
};

const defaultRoles = ["Project Manager", "Developer", "Designer", "Content Manager"];

const roleDashboardMap: Record<string, string> = {
  "Design Lead": "/dashboard/designer",
  "Product Designer": "/dashboard/product-designer",
  "UI Designer": "/dashboard/product-designer",
  "Project Manager": "/dashboard/project-manager",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const domain = searchParams.get("domain");
  const roles = domain && rolesByDomain[domain] ? rolesByDomain[domain] : defaultRoles;

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [directLink, setDirectLink] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative min-h-screen overflow-y-auto bg-[#040812] flex items-center justify-center px-4 py-24">

      {/* Animated gradient blobs */}
      <div
        className="fixed top-[-25%] left-[-10%] w-[60vw] h-[60vw] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 55%)",
          filter: "blur(70px)",
          animation: "blobA 12s ease-in-out infinite",
        }}
      />
      <div
        className="fixed bottom-[-20%] right-[-10%] w-[55vw] h-[55vw] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,160,255,0.3) 0%, transparent 55%)",
          filter: "blur(70px)",
          animation: "blobB 14s ease-in-out infinite",
        }}
      />
      <div
        className="fixed top-[25%] right-[5%] w-[45vw] h-[45vw] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 55%)",
          filter: "blur(70px)",
          animation: "blobC 16s ease-in-out infinite",
        }}
      />
      <div
        className="fixed bottom-[5%] left-[10%] w-[40vw] h-[40vw] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 55%)",
          filter: "blur(70px)",
          animation: "blobA 18s ease-in-out 2s infinite",
        }}
      />

      {/* Login content — consistent 76px (~2cm) gap between each block */}
      <div className="relative z-10 w-full max-w-[380px] flex flex-col items-center" style={{ gap: "76px" }}>

        {/* Header group */}
        <div className="flex flex-col items-center">
          <h1
            className="text-[36px] font-bold tracking-[-0.02em] mb-3"
            style={{ color: "#ffffff" }}
          >
            Let&apos;s get you in
          </h1>
          <p className="text-[16px] font-medium" style={{ color: "rgba(210,225,245,0.7)" }}>
            Your workspace is waiting
          </p>
        </div>

        {/* Form fields group */}
        <div className="w-full flex flex-col" style={{ gap: "28px" }}>

          {/* Email field */}
          <div className="w-full">
            <label
              className="block text-[16px] font-semibold tracking-[0.04em] mb-3 ml-1"
              style={{ color: "#ffffff" }}
            >
              Email or Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full h-[52px] rounded-[14px] pl-24 pr-7 text-[15px] outline-none transition-all duration-300"
              style={{
                background: "rgba(80,140,230,0.08)",
                border: "1px solid rgba(100,160,240,0.14)",
                color: "#ffffff",
                backdropFilter: "blur(16px)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(100,170,255,0.35)";
                e.target.style.boxShadow = "0 0 24px rgba(59,130,246,0.12)";
                e.target.style.background = "rgba(80,140,230,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(100,160,240,0.14)";
                e.target.style.boxShadow = "none";
                e.target.style.background = "rgba(80,140,230,0.08)";
              }}
            />
          </div>

          {/* Role dropdown */}
          <div className="w-full" ref={dropdownRef}>
          <label
            className="block text-[14px] font-semibold tracking-[0.06em] mb-3 ml-1"
            style={{ color: "#ffffff" }}
          >
            YOUR ROLE
          </label>
          <button
            type="button"
            onClick={() => setRoleOpen(!roleOpen)}
            className="w-full h-[52px] rounded-[14px] pl-24 pr-7 text-[15px] text-left cursor-pointer outline-none transition-all duration-300 flex items-center justify-between"
            style={{
              background: "rgba(80,140,230,0.08)",
              border: `1px solid rgba(100,160,240,${roleOpen ? "0.35" : "0.14"})`,
              color: role ? "#f0f4ff" : "rgba(210,225,245,0.5)",
              backdropFilter: "blur(16px)",
              boxShadow: roleOpen ? "0 0 24px rgba(59,130,246,0.12)" : "none",
            }}
          >
            <span>{role || "Select your role"}</span>
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              className="transition-transform duration-300"
              style={{ transform: roleOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M4 6L8 10L12 6" stroke="rgba(220,230,245,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Dropdown menu */}
          <div
            className="mt-3 rounded-[16px] overflow-hidden transition-all duration-400"
            style={{
              background: "linear-gradient(180deg, rgba(20,35,70,0.92), rgba(12,24,55,0.95))",
              border: roleOpen ? "1px solid rgba(100,170,255,0.18)" : "1px solid transparent",
              backdropFilter: "blur(32px)",
              boxShadow: roleOpen
                ? "0 24px 64px rgba(0,0,0,0.5), 0 0 32px rgba(59,130,246,0.1), inset 0 1px 0 rgba(120,180,255,0.06)"
                : "none",
              maxHeight: roleOpen ? `${roles.length * 60 + 24}px` : "0px",
              opacity: roleOpen ? 1 : 0,
              pointerEvents: roleOpen ? "auto" : "none",
            }}
          >
            <div className="p-2">
              {roles.map((r, i) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setRoleOpen(false); }}
                  className="w-full px-5 py-[14px] text-[14px] text-left cursor-pointer border-none rounded-[10px] transition-all duration-200 flex items-center gap-3"
                  style={{
                    color: role === r ? "#ffffff" : "rgba(210,225,245,0.6)",
                    background: role === r
                      ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(56,189,248,0.1))"
                      : "transparent",
                    boxShadow: role === r ? "0 0 16px rgba(59,130,246,0.08)" : "none",
                    marginTop: i > 0 ? "4px" : "0",
                  }}
                  onMouseEnter={(e) => {
                    if (role !== r) {
                      e.currentTarget.style.color = "#f0f4ff";
                      e.currentTarget.style.background = "rgba(80,140,240,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (role !== r) {
                      e.currentTarget.style.color = "rgba(210,225,245,0.6)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span
                    className="w-[6px] h-[6px] rounded-full flex-shrink-0 transition-all duration-200"
                    style={{
                      background: role === r
                        ? "rgba(100,180,255,0.8)"
                        : "rgba(100,160,240,0.2)",
                      boxShadow: role === r ? "0 0 8px rgba(100,180,255,0.4)" : "none",
                    }}
                  />
                  {r}
                </button>
              ))}
            </div>
          </div>
          </div>

          {/* Direct link */}
          <div className="w-full">
            <label
              className="block text-[16px] font-semibold tracking-[0.04em] mb-3 ml-1"
              style={{ color: "#ffffff" }}
            >
              Direct Link
            </label>
            <input
              type="url"
              value={directLink}
              onChange={(e) => setDirectLink(e.target.value)}
              placeholder="https://your-workspace.orbitos.app"
              className="w-full h-[52px] rounded-[14px] pl-24 pr-7 text-[15px] outline-none transition-all duration-300"
              style={{
                background: "rgba(80,140,230,0.08)",
                border: "1px solid rgba(100,160,240,0.14)",
                color: "#f0f4ff",
                backdropFilter: "blur(16px)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(100,170,255,0.35)";
                e.target.style.boxShadow = "0 0 24px rgba(59,130,246,0.12)";
                e.target.style.background = "rgba(80,140,230,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(100,160,240,0.14)";
                e.target.style.boxShadow = "none";
                e.target.style.background = "rgba(80,140,230,0.08)";
              }}
            />
          </div>

        </div>

        {/* Continue button */}
        <button
          type="button"
          className="w-full h-[52px] rounded-[14px] text-[16px] font-semibold tracking-[0.02em] cursor-pointer border-none transition-all duration-300 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(56,189,248,0.22))",
            color: "#f0f4ff",
            boxShadow: "0 0 30px rgba(59,130,246,0.1), 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(160,200,255,0.08)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(56,189,248,0.25))";
            e.currentTarget.style.boxShadow = "0 0 40px rgba(59,130,246,0.18), 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(160,200,255,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(56,189,248,0.18))";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(59,130,246,0.1), 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(160,200,255,0.08)";
          }}
          onClick={() => {
            const dest = roleDashboardMap[role];
            if (dest) {
              router.push(dest);
            }
          }}
        >
          Continue
        </button>

        {/* Footer */}
        <p className="text-[14px]" style={{ color: "rgba(220,230,245,0.5)" }}>
          Don&apos;t have an account?{" "}
          <a
            href="#"
            className="no-underline font-medium transition-colors duration-200"
            style={{ color: "rgba(200,220,255,0.8)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(200,220,255,0.8)"}
          >
            Sign up
          </a>
        </p>
      </div>

      <style jsx>{`
        @keyframes blobA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5%, 8%) scale(1.05); }
          66% { transform: translate(-3%, -5%) scale(0.97); }
        }
        @keyframes blobB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-6%, -4%) scale(1.03); }
          66% { transform: translate(4%, 6%) scale(0.98); }
        }
        @keyframes blobC {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(4%, -6%) scale(0.96); }
          66% { transform: translate(-5%, 3%) scale(1.04); }
        }
        input::placeholder {
          color: rgba(220,230,245,0.4);
        }
      `}</style>
    </div>
  );
}
