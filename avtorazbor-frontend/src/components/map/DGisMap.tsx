'use client'

export function DGisMap() {
  return (
    <iframe
      src="https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lon%22%3A76.792195%2C%22lat%22%3A43.231915%2C%22zoom%22%3A17%7D%7D"
      className="absolute inset-0 w-full h-full border-0"
      allowFullScreen
      loading="lazy"
    />
  )
}
