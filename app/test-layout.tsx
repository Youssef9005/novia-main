import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { DebugFooter } from "@/components/debug-footer"

const inter = Inter({ subsets: ["latin"] })

export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-white flex flex-col`}>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <DebugFooter />
      </body>
    </html>
  )
}
