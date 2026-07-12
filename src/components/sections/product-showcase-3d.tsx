"use client"

import { motion } from "framer-motion"

const showcaseItems = [
  {
    src: "/images/visuel.png",
    rotation: -8,
    z: 0,
    x: -20,
    y: 10,
    delay: 0,
  },
  {
    src: "/images/visuel.png",
    rotation: 5,
    z: 30,
    x: 30,
    y: -20,
    delay: 0.2,
  },
  {
    src: "/images/visuel.png",
    rotation: -3,
    z: 10,
    x: -10,
    y: -30,
    delay: 0.4,
  },
  {
    src: "/images/visuel.png",
    rotation: 8,
    z: -10,
    x: 40,
    y: 30,
    delay: 0.6,
  },
]

export default function ProductShowcase3D() {
  return (
    <div className="relative w-full max-w-lg h-[500px] perspective-[1000px]">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 rounded-3xl" />
      {showcaseItems.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: item.delay, duration: 0.6, type: "spring", stiffness: 100 }}
          whileHover={{
            scale: 1.05,
            z: 60,
            transition: { duration: 0.3 },
          }}
          className="absolute cursor-pointer"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px)) rotate(${item.rotation}deg) translateZ(${item.z}px)`,
            transformStyle: "preserve-3d",
            zIndex: showcaseItems.length - i,
          }}
        >
          <motion.div
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
            className="w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center"
          >
            <img
              src={item.src}
              alt="Produit"
              className="w-full h-full object-cover p-4"
            />
          </motion.div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
      >
        <p className="text-white/40 text-sm bg-white/5 backdrop-blur-sm rounded-full px-4 py-1.5">
          ✦ +50 catégories disponibles
        </p>
      </motion.div>
    </div>
  )
}
