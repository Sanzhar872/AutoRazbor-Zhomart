'use client'

import { useEffect, useRef } from 'react'

const DGIS_KEY = '6624d8c0-0ff6-44cb-95d9-4de4c9516ad8'
const COORDS: [number, number] = [76.792195, 43.231915]

declare global {
  interface Window {
    mapgl?: {
      Map: new (container: string | HTMLElement, options: object) => object
      Marker: new (map: object, options: object) => object
    }
  }
}

export function DGisMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<object | null>(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const scriptId = 'dgis-mapgl-script'

    const init = () => {
      if (!window.mapgl || !containerRef.current) return

      const map = new window.mapgl.Map(containerRef.current, {
        center: COORDS,
        zoom: 17,
        key: DGIS_KEY,
      })

      new window.mapgl.Marker(map, {
        coordinates: COORDS,
        color: '#1565C0',
      })

      mapRef.current = map
    }

    if (document.getElementById(scriptId)) {
      if (window.mapgl) init()
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://mapgl.2gis.com/api/js/v1'
    script.onload = init
    document.head.appendChild(script)

    return () => {
      // карта живёт вместе с компонентом — не уничтожаем при hot-reload
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />
}
