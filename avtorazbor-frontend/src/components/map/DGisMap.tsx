'use client'

export function DGisMap() {
  return (
    <iframe
      src="https://maps.google.com/maps?q=43.231915,76.792195&z=17&output=embed"
      className="absolute inset-0 w-full h-full border-0"
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}
