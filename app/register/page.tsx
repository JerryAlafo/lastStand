import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.username) redirect("/game");

  return (
    <div style={{
      minHeight: "100vh",
      overflowY: "auto",
      overflowX: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(12px, 4vw, 20px)",
      background: "radial-gradient(ellipse at 50% 30%, #2a1050 0%, #160830 50%, #0e0520 100%)",
      color: "#fff",
      position: "relative",
    }}>
      {/* Glow blobs */}
      <div style={{ position: "absolute", top: "8%", right: "10%", width: "clamp(220px, 42vw, 360px)", height: "clamp(220px, 42vw, 360px)", borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        width: "100%",
        maxWidth: 440,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 24,
        padding: "clamp(20px, 4.8vw, 40px) clamp(16px, 4.2vw, 36px)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 80px rgba(123,47,247,0.2), 0 12px 40px rgba(0,0,0,0.5)",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(18px, 4vw, 32px)" }}>
          <div style={{ fontSize: 12, letterSpacing: 5, color: "rgba(200,150,255,0.8)", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>
            Last Stand Arena
          </div>
          <div style={{ fontSize: "clamp(24px, 5.5vw, 30px)", fontWeight: 800, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 0.5, marginBottom: 8 }}>
            Criar conta
          </div>
          <div style={{ fontSize: "clamp(13px, 3.2vw, 15px)", color: "rgba(255,255,255,0.55)" }}>
            Junta-te à arena e enfrenta os teus inimigos
          </div>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
