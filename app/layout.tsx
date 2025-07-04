import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { MessageCircle } from "lucide-react"

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
        {/* Floating WhatsApp Chatbot Button */}
        <a
          href="https://wa.me/905344869220"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          title="Chat with us on WhatsApp"
          aria-label="Chat with us on WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
        </a>
        <EnhancedFooter />
      </body>
    </html>
  )
}
