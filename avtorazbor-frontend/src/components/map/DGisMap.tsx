'use client'

// lat=43.231915, lon=76.792195 — координаты авторазбора
export function DGisMap() {
  return (
    <iframe
      src="https://www.openstreetmap.org/export/embed.html?bbox=76.7871%2C43.2289%2C76.7973%2C43.2349&amp;layer=mapnik&amp;marker=43.231915%2C76.792195"
      className="absolute inset-0 w-full h-full border-0"
      allowFullScreen
    />
  )
}
