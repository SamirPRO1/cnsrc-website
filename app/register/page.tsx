import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Backdrop } from "@/components/ui/backdrop";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Registro — CNSRC" };

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const pending = cookieStore.get("cnsrc_pending")?.value;

  // No pending GUID means the user didn't come from Steam auth — send them home
  if (!pending) redirect("/");

  return (
    <Backdrop orbs={[{ color: "red", x: -60, y: -40, w: 380, h: 380, opacity: 0.6 }]}>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <RegisterForm />
      </div>
    </Backdrop>
  );
}
