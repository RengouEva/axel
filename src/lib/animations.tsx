"use client"

import { motion, type HTMLMotionProps, type Variants, type TargetAndTransition } from "framer-motion"
import type { ReactNode } from "react"

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
}

interface AnimatedDivProps extends HTMLMotionProps<"div"> {
  fade?: boolean
  slideUp?: boolean
  slideDown?: boolean
  scaleIn?: boolean
  delay?: number
}

export function AnimatedDiv({ fade, slideUp: su, slideDown: sd, scaleIn: si, delay = 0, children, ...props }: AnimatedDivProps) {
  let variants: Variants = {}
  if (fade) variants = fadeIn
  if (su) variants = slideUp
  if (sd) variants = slideDown
  if (si) variants = scaleIn

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: variants.hidden || { opacity: 0 },
        visible: {
          ...variants.visible as TargetAndTransition,
          transition: { ...(variants.visible as TargetAndTransition)?.transition, delay },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
