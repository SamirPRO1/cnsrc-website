import AdminSidebar from "@/components/admin/admin-sidebar";

export const metadata = {
  title: "Admin — CNSRC",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar />
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
