"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu, X, Heart, ShoppingCart, Bell, User,
  Moon, Sun, GitCompare, ChevronDown, LogOut,
  Store, LayoutDashboard, Package
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useFavorites } from "@/lib/favorites-context"
import { useCompare } from "@/lib/compare-context"
import { useNotifications } from "@/lib/notification-context"
import { useTheme } from "@/lib/theme-context"
import SearchBar from "@/components/search/search-bar"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/produits", label: "Produits" },
  { href: "/boutiques", label: "Boutiques" },
  { href: "/promotions", label: "Promotions" },
  { href: "/blog", label: "Blog" },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const { items: favorites } = useFavorites()
  const { items: compareItems } = useCompare()
  const { unreadCount } = useNotifications()
  const { isDark, toggle: toggleTheme } = useTheme()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-navbar)] backdrop-blur-xl border-b border-[var(--border)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img
              src="/images/logo-axel.png"
              alt="AXEL Marketplace"
              className="h-10 sm:h-11 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "text-[var(--text-link)] bg-[var(--text-link)]/10"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search - Desktop */}
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search toggle (mobile) */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Rechercher"
              title="Rechercher"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              aria-label={isDark ? "Mode clair" : "Mode sombre"}
              title={isDark ? "Mode clair" : "Mode sombre"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Favorites */}
            <Link
              href="/compte/favoris"
              className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors hidden sm:flex"
              aria-label="Favoris"
              title="Favoris"
            >
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Compare */}
            <Link
              href="/comparateur"
              className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors hidden sm:flex"
              aria-label="Comparateur"
              title="Comparateur"
            >
              <GitCompare className="w-5 h-5" />
              {compareItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--text-link)] text-white text-[9px] font-bold flex items-center justify-center">
                  {compareItems.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/panier"
              className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Panier"
              title="Panier"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--text-link)] text-white text-[9px] font-bold flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors hidden sm:flex"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1.5 pr-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--text-link)]/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--text-link)]" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-elevated)] border-2 border-[var(--border)] rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in">
                      <div className="px-4 py-3 border-b border-[var(--border-light)]">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          href="/compte"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <User className="w-4 h-4" /> Mon compte
                        </Link>
                        <Link
                          href="/compte/commandes"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <Package className="w-4 h-4" /> Mes commandes
                        </Link>
                        {(user.role === "seller" || user.role === "admin") && (
                          <Link
                            href={user.role === "admin" ? "/admin" : "/vendeur"}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            {user.role === "admin" ? (
                              <LayoutDashboard className="w-4 h-4" />
                            ) : (
                              <Store className="w-4 h-4" />
                            )}
                            {user.role === "admin" ? "Administration" : "Espace vendeur"}
                          </Link>
                        )}
                        <button
                          onClick={() => { logout(); toast.success("Déconnecté"); setShowUserMenu(false) }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Déconnexion
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/connexion"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--text-link)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <User className="w-4 h-4" /> Connexion
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Menu"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden pb-3 animate-fadeIn">
            <SearchBar />
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--bg-primary)] animate-fadeIn">
          <nav className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "text-[var(--text-link)] bg-[var(--text-link)]/10"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-[var(--border-light)]" />
            {user ? (
              <>
                <Link
                  href="/compte/favoris"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <Heart className="w-4 h-4" /> Favoris ({favorites.length})
                </Link>
                <Link
                  href="/comparateur"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <GitCompare className="w-4 h-4" /> Comparateur ({compareItems.length})
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <Bell className="w-4 h-4" /> Notifications ({unreadCount})
                </Link>
                <button
                  onClick={() => { toggleTheme(); setMobileMenuOpen(false) }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? "Mode clair" : "Mode sombre"}
                </button>
                <hr className="my-2 border-[var(--border-light)]" />
                {(user.role === "seller" || user.role === "admin") && (
                  <Link
                    href={user.role === "admin" ? "/admin" : "/vendeur"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-link)] bg-[var(--text-link)]/10 transition-colors"
                  >
                    {user.role === "admin" ? <LayoutDashboard className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                    {user.role === "admin" ? "Administration" : "Espace vendeur"}
                  </Link>
                )}
                <button
                  onClick={() => { logout(); toast.success("Déconnecté"); setMobileMenuOpen(false) }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[var(--text-link)] text-white"
              >
                <User className="w-4 h-4" /> Connexion / Inscription
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
