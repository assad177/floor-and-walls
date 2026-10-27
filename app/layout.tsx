import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";
import ProductMegaMenu from "@/components/ProductMegaMenu";

export const metadata: Metadata = {
  title: "Floors & Walls | Interactive Space Designer",
  description: "Design your room from floor to ceiling, see the price live, and book your fitting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {/* <ProductMegaMenu visualizerHref="#workspace" /> */}
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
