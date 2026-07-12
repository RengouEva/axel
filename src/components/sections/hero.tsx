"use client"

import { ArrowRight, PlayCircle } from "lucide-react"
import { motion } from "framer-motion"
import Button from "@/components/ui/button"
import { AnimatedDiv } from "@/lib/animations"
import ProductShowcase3D from "./product-showcase-3d"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 gradient-axel" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDI0YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0tMTgtMTJjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <AnimatedDiv fade slideUp delay={0}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 text-white/80 text-xs sm:text-sm font-medium mb-4 sm:mb-6 backdrop-blur-sm"
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400"
              />
              Paiement à crédit disponible
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-4xl xl:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
              Achetez maintenant,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Payez à votre rythme.
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-sm sm:text-lg text-white/70 max-w-xl mb-6 sm:mb-8 leading-relaxed"
            >
              La marketplace qui rend vos achats accessibles, simples et sécurisés.
              Des milliers de produits avec paiement comptant ou à crédit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Link href="/produits" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="bg-[var(--bg-primary)] text-[var(--text-primary)] group w-full sm:w-auto justify-center text-sm sm:text-base">
                  Découvrir les produits
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/a-credit" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 w-full sm:w-auto justify-center text-sm sm:text-base">
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Comment ça marche
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="grid grid-cols-3 gap-3 sm:gap-8 mt-8 sm:mt-12 pt-4 sm:pt-8 border-t border-white/10"
            >
              {[
                { value: "-", label: "Produits" },
                { value: "-", label: "Clients" },
                { value: "-", label: "Note moyenne" },
              ].map((stat, index) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="text-base sm:text-2xl font-bold text-white"
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-[10px] sm:text-xs text-white/50">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </AnimatedDiv>

          <AnimatedDiv delay={0.2} fade scaleIn className="hidden lg:flex items-center justify-center">
            <ProductShowcase3D />
          </AnimatedDiv>
        </div>
      </div>
    </section>
  )
}
