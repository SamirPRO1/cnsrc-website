import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Registro — CNSRC" };

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const pending = cookieStore.get("cnsrc_pending")?.value;

  // No pending GUID means the user didn't come from Steam auth — send them home
  if (!pending) redirect("/");

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "red",    x: -60, y: -40, w: 380, h: 380, opacity: 0.6, depth: 0.8 },
        { color: "purple", x: 720, y: 360, w: 320, h: 320, opacity: 0.45, depth: 0.5 },
      ]}
      bracketCorners
    >
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Reveal variant="scale">
          <RegisterForm />
        </Reveal>
      </div>
    </ParallaxBackdrop>
  );
}
