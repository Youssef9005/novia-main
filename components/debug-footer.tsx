"use client"

import { useEffect, useState } from "react"

export function DebugFooter() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Update dimensions on mount and window resize
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [])

  return (
    <footer className="bg-red-900 text-white py-4 relative z-50">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold mb-2">Debug Footer</h2>
        <p>This is a simple debug footer to verify footer visibility.</p>
        <p>
          Screen dimensions: {dimensions.width}px × {dimensions.height}px
        </p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </footer>
  )
}
