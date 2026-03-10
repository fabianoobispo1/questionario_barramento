import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Questionário de Onboarding | Barramento de Integração",
  description: "Formulário de onboarding para integração com o barramento Kafka da Energisa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans">
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { fontFamily: 'Arial, Helvetica, sans-serif' },
          }}
        />
      </body>
    </html>
  );
}
