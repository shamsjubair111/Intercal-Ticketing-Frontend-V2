import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "Internal Ticketing System",
  description: "Ticket Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
