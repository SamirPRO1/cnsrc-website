import { cookies } from "next/headers";
import { COOKIE_NAME, decodeSession, type SessionPayload } from "@/lib/auth/session";
import { readDriversFile } from "@/lib/admin/data-io";
import AdminSidebar from "@/components/admin/admin-sidebar";

export const metadata = {
  title: "Admin — CNSRC",
};

async function getSessionInfo(): Promise<{ session: SessionPayload; driverName: string | null } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await decodeSession(token);
  if (!session) return null;

  let driverName: string | null = null;
  if (session.driverId) {
    try {
      const { drivers } = readDriversFile();
      driverName = drivers.find((d) => d.id === session.driverId)?.name ?? null;
    } catch {
      // ignore
    }
  }

  return { session, driverName };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const info = await getSessionInfo();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar
        isAdmin={info?.session.isAdmin ?? false}
        driverId={info?.session.driverId ?? null}
        driverName={info?.driverName ?? null}
      />
      <main
        style={{
          flex: 1,
          marginLeft: 220,
          padding: "32px 40px",
          maxWidth: 1200,
        }}
      >
        {children}
      </main>
    </div>
  );
}
