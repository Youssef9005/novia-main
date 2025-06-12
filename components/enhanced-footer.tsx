import Link from "next/link"
import { Github, Linkedin, Twitter, ArrowRight, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

export function EnhancedFooter() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 relative z-20 mt-auto">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gray-900/80 backdrop-blur-sm border border-gray-800 p-8 lg:p-12">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <h3 className="text-3xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Get market insights first
                  </span>
                </h3>
                <p className="mt-4 text-lg text-gray-400 max-w-md">
                  Subscribe to our newsletter for the latest market analysis, trading tips, and exclusive offers.
                </p>
              </div>
              <div className="bg-gray-950/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email address
                    </label>
                    <Input
                      type="email"
                      id="email"
                      placeholder="name@example.com"
                      className="bg-gray-900 border-gray-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="consent"
                      className="rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="consent" className="text-xs text-gray-400">
                      I agree to receive marketing emails and can unsubscribe anytime
                    </label>
                  </div>
                  <Button className="w-full">
                    Subscribe <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <Image src={"./logo.jpeg"} alt="Website Logo" width={100} height={100} className="rounded-full border border-gray-800 p-2"/>
              <span className="text-2xl font-bold tracking-tight">Novia AI</span>
            </div>
            <p className="text-gray-400">
              Expert market analysis delivered to your inbox. Subscribe to make informed trading decisions.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-2 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Products</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Starter Plan
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Pro Plan
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Expert Plan
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Custom Solutions
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Risk Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm">info@novia-ai.com</p>
                  <p className="text-xs text-gray-500">For general inquiries</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm">+90 534 486 29 20</p>
                  <p className="text-xs text-gray-500">Turkey</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm">Turkey istanbul</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Novia AI Inc. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                Cookies
              </Link>
              <Link href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
