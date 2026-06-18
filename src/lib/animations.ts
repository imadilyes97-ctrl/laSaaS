/**
 * Animations et transitions pour une meilleure UX
 */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
}

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

export const buttonHover = {
  whileHover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  whileTap: {
    scale: 0.98
  }
}

export const cardHover = {
  whileHover: {
    y: -4,
    transition: { duration: 0.3 }
  }
}

export const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(0, 212, 255, 0.4)',
      '0 0 0 10px rgba(0, 212, 255, 0)',
      '0 0 0 0 rgba(0, 212, 255, 0)'
    ]
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
}