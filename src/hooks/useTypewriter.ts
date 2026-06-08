'use client'

import { useState, useEffect } from 'react'

export function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('')
  const done = displayed.length >= text.length

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      let currentIndex = 0
      const interval = setInterval(() => {
        currentIndex++
        setDisplayed(text.slice(0, currentIndex))
        if (currentIndex >= text.length) {
          clearInterval(interval)
        }
      }, speed)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(startTimeout)
  }, [text, speed, startDelay])

  return { displayed, done }
}
