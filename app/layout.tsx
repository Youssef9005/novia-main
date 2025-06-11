import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { EnhancedFooter } from "@/components/enhanced-footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Novia AI - Expert Market Analysis",
  description:
    "Subscribe to receive professional trading insights on your selected assets. Choose your plan, select your assets, and start making informed trading decisions.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-white flex flex-col`}>
        <Navbar />
        <main className="flex-grow flex flex-col pt-16">{children}</main>
        <EnhancedFooter />
      </body>
    </html>
  )
}
