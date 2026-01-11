"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, User, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "react-i18next"

export function Navbar() {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  
  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      if (token) {
        setIsAuthenticated(true)
        // Try to get user info from localStorage if available
        const userInfo = localStorage.getItem('userInfo')
        if (userInfo) {
          try {
            const parsed = JSON.parse(userInfo)
            setUserName(parsed.firstName || "")
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
      } else {
        setIsAuthenticated(false)
      }
    }
    
    // Check immediately
    checkAuth()
    
    // Also set up a listener for storage changes (for cross-tab logout)
    const handleStorageChange = () => {
      checkAuth()
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    setIsAuthenticated(false)
    router.push('/')
  }

  const navItems = [
    { name: t('navbar.home'), href: "/" },
    { name: t('navbar.about'), href: "/about" },
    { name: t('navbar.contact'), href: "/contact" },
    { name: t('navbar.economicCalendar'), href: "/economic-calendar" },
    { name: t('navbar.subscriptions'), href: "/#pricing" },
    { name: t('navbar.chart'), href: "/chart" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-lg border-b border-gray-800">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Novia AI</span>
            <div className="flex items-center gap-2">
            <Image src={"./logo.jpeg"} alt="Website Logo" width={50} height={50} className="rounded-full border border-gray-800 p-2" />
            <span className="text-xl font-bold tracking-tight">Novia AI</span>
            </div>
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">{t('navbar.openMenu')}</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-semibold leading-6 ${
                pathname === item.href ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 lg:items-center">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full focus:ring-0 focus:ring-offset-0 border-0 hover:bg-gray-800/70">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border border-gray-800 bg-gray-950 text-white shadow-lg rounded-md py-2">
                <div className="flex items-center justify-start gap-2 p-3 border-b border-gray-800">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    {userName && <p className="font-medium text-white">{t('navbar.welcome', { name: userName })}</p>}
                    <p className="text-xs text-gray-400">{t('navbar.manageAccount')}</p>
                  </div>
                </div>
                <div className="p-1">
                  <Link 
                    href="/profile" 
                    className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-800 text-gray-200 cursor-pointer"
                    onClick={() => {}}
                  >
                    <User className="mr-2 h-4 w-4 text-gray-400" />
                    <span>{t('navbar.profile')}</span>
                  </Link>
                  <button
                    onClick={handleLogout} 
                    className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-800 text-gray-200 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-gray-400" />
                    <span>{t('navbar.logout')}</span>
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">{t('navbar.login')}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t('navbar.register')}</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="relative z-[200] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="fixed inset-x-0 top-0 z-[200] pt-16 pb-6 overflow-y-auto max-h-screen bg-black/95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 sm:px-6 pb-4 border-b border-gray-800">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    className="rounded-md p-2 text-white hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">{t('navbar.closeMenu')}</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-6">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block rounded-lg px-3 py-4 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="mb-6">
                  <LanguageSwitcher />
                </div>
                <div className="grid gap-4 mt-8">
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          router.push('/profile')
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('navbar.profile')}</span>
                      </Button>
                      <Button
                        className="w-full flex items-center justify-center"
                        variant="destructive"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          handleLogout()
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('navbar.logout')}</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                        asChild
                      >
                        <Link href="/login">{t('navbar.login')}</Link>
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                        asChild
                      >
                        <Link href="/register">{t('navbar.register')}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}
