"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Search, ArrowRight } from "lucide-react";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/services", label: "Services" },
    { href: "/faq", label: "FAQ" },
    { href: "/a-propos", label: "À Propos" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      {/* Top bar fine, allégée et sobre */}
      <div className="bg-brand-dark text-gray-300 text-[11px] py-1.5 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
            <span>Atelier Gbégamey : Lun - Ven (9h - 20h)</span>
          </div>

          <div className="flex items-center gap-3 font-medium">
            <Link
              href="/suivi"
              className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
            >
              <Search className="w-3 h-3 text-brand-green" />
              <span>Suivi réparation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Marque - Lien complet vers Accueil */}
          <Link href="/" className="flex items-center gap-3 group" title="RyHaD Tic-Medic - Accueil">
            <div className="relative w-11 h-11 rounded-xl bg-white flex items-center justify-center p-1 border border-gray-100 shadow-xs group-hover:scale-105 transition-transform">
              <Image
                src="/images/logo.jpg"
                alt="RyHaD Tic-Medic Logo"
                width={44}
                height={44}
                className="w-full h-full object-contain rounded-lg"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-brand-blue group-hover:text-brand-blue-dark transition-colors">
                  RyHaD
                </span>
                <span className="text-xs font-bold uppercase tracking-wider bg-brand-green-light text-brand-green px-1.5 py-0.5 rounded">
                  Tic-Medic
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                Maintenance & Ingénierie Tech • Cotonou
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-brand-dark hover:text-brand-blue transition-colors relative py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/demande-intervention"
              className="inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:bg-brand-blue-dark active:scale-[0.98] transition-all"
            >
              <span>Demander une intervention</span>
              <ArrowRight className="w-4 h-4 text-brand-green" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-brand-dark hover:bg-gray-100 transition-colors"
            aria-label="Menu principal"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-brand-dark hover:bg-brand-slate hover:text-brand-blue transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
            <Link
              href="/demande-intervention"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 bg-brand-blue text-white py-2.5 rounded-lg font-semibold text-sm shadow"
            >
              <span>Demander une intervention</span>
              <ArrowRight className="w-4 h-4 text-brand-green" />
            </Link>
            <Link
              href="/devis"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 border border-brand-green text-brand-green py-2.5 rounded-lg font-semibold text-sm"
            >
              <span>Demande commerciale (Vente/Location)</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
