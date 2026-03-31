import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.username) redirect("/game");

  return (
    <div style={{
      height: "100vh",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      background: "radial-gradient(ellipse at 50% 30%, #2a1050 0%, #160830 50%, #0e0520 100%)",
      color: "#fff",
      position: "relative",
    }}>
      {/* Glow blobs */}
      <div style={{ position: "absolute", top: "8%", left: "10%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,195,255,0.16) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        width: "100%",
        maxWidth: 440,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 24,
        padding: "40px 36px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 80px rgba(123,47,247,0.2), 0 12px 40px rgba(0,0,0,0.5)",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 12, letterSpacing: 5, color: "rgba(200,150,255,0.8)", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>
            Last Stand Arena
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, background: "linear-gradient(135deg, #ffffff, #dd99ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 0.5, marginBottom: 8 }}>
            Bem-vindo de volta
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)" }}>
            Entra na tua conta para continuar
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
