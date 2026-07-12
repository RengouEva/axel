"use client"

import { motion } from "framer-motion"

const showcaseItems = [
  {
    src: "/images/products/iphone-16-pro-max.svg",
    title: "iPhone 16 Pro Max",
    price: "1 599 000 F",
    rotation: -8,
    z: 0,
    x: -20,
    y: 10,
    delay: 0,
  },
  {
    src: "/images/products/macbook-pro-16-m4.svg",
    title: "MacBook Pro M4",
    price: "3 499 000 F",
    rotation: 5,
    z: 30,
    x: 30,
    y: -20,
    delay: 0.2,
  },
  {
    src: "/images/products/montre-connectee-ultra-3.svg",
    title: "Montre Ultra 3",
    price: "459 000 F",
    rotation: -3,
    z: 10,
    x: -10,
    y: -30,
    delay: 0.4,
  },
  {
    src: "/images/products/airpods-pro-3.svg",
    title: "AirPods Pro 3",
    price: "299 000 F",
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
          key={item.title}
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
            className="w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
          >
            <img
              src={item.src}
              alt={item.title}
              className="w-full h-full object-cover p-4"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: item.delay + 0.3 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10"
          >
            <p className="text-xs text-white/80 font-semibold">{item.title}</p>
            <p className="text-[10px] text-white/50">{item.price}</p>
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
