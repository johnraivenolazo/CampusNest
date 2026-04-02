'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, ChevronLeft, ChevronRight, Image as ImageIcon, MapPin, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils.currency'

const RealMap = dynamic(() => import('./real-map'), {
  ssr: false,
  loading: () => (
    <div className="bg-muted flex h-full w-full animate-pulse items-center justify-center">
      Loading map...
    </div>
  ),
})

interface Property {
  id: string
  title: string
  price_per_month: number
  address: string
  latitude: number
  longitude: number
  status: 'available' | 'reserved' | 'taken'
  property_images: string[]
  amenities: string[]
  images?: string[]
}

interface MapContainerProps {
  properties: Property[]
  selectedProperty: Property | null
  onPropertySelect: (property: Property | null) => void
  initialLat?: number
  initialLng?: number
  userLocation?: [number, number] | null
  searchCenter?: [number, number] | null
  radiusKm?: number
  showRadius?: boolean
  onViewportReady?: (viewport: {
    center: [number, number]
    bounds: { north: number; south: number; east: number; west: number }
  }) => void
  onViewportChange?: (viewport: {
    center: [number, number]
    bounds: { north: number; south: number; east: number; west: number }
  }) => void
  showMapHint?: boolean
}

function getPropertyImages(property: Property) {
  const sourceImages = property.property_images?.length
    ? property.property_images
    : (property.images ?? [])

  return sourceImages.filter(Boolean)
}

function PropertyPreviewGallery({
  propertyId,
  title,
  status,
  images,
  heightClass,
  showThumbnails = false,
}: {
  propertyId: string
  title: string
  status: Property['status']
  images: string[]
  heightClass: string
  showThumbnails?: boolean
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const hasMultipleImages = images.length > 1

  return (
    <div className="space-y-3">
      <div className={`bg-muted relative w-full overflow-hidden rounded-2xl ${heightClass}`}>
        {images[activeImageIndex] ? (
          <>
            <Image
              src={images[activeImageIndex]}
              alt={`${title} photo ${activeImageIndex + 1}`}
              fill
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          </>
        ) : (
          <div className="text-muted-foreground/30 flex h-full items-center justify-center">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="rounded-full bg-black/60 px-2.5 py-1 text-[8px] font-black tracking-widest text-white uppercase backdrop-blur-md">
            {status}
          </div>
          {images.length > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
              <Camera className="h-3 w-3" />
              {images.length}
            </div>
          )}
        </div>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() =>
                setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
              }
              className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() =>
                setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
              }
              className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5 px-4">
              {images.map((image, index) => (
                <button
                  key={`${propertyId}-${image}-${index}`}
                  type="button"
                  aria-label={`Show photo ${index + 1}`}
                  onClick={() => setActiveImageIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeImageIndex === index
                      ? 'w-5 bg-white'
                      : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showThumbnails && hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${propertyId}-thumb-${index}`}
              type="button"
              aria-label={`Preview photo ${index + 1}`}
              onClick={() => setActiveImageIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition ${
                activeImageIndex === index
                  ? 'border-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]'
                  : 'border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MapContainer({
  properties,
  selectedProperty,
  onPropertySelect,
  initialLat,
  initialLng,
  userLocation,
  searchCenter,
  radiusKm,
  showRadius = false,
  onViewportReady,
  onViewportChange,
  showMapHint = true,
}: MapContainerProps) {
  const selectedPropertyImages = selectedProperty ? getPropertyImages(selectedProperty) : []

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {showMapHint && (
        <div className="bg-background/80 border-border pointer-events-none absolute top-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border px-3.5 py-1.5 shadow-md backdrop-blur-sm md:flex">
          <p className="text-muted-foreground text-xs font-medium whitespace-nowrap">
            Click the pin icon to view property details
          </p>
        </div>
      )}

      <div className="h-full flex-1">
        <RealMap
          properties={properties}
          selectedProperty={selectedProperty}
          onPropertySelect={onPropertySelect}
          initialLat={initialLat}
          initialLng={initialLng}
          userLocation={userLocation}
          searchCenter={searchCenter}
          radiusKm={radiusKm}
          showRadius={showRadius}
          onViewportReady={onViewportReady}
          onViewportChange={onViewportChange}
        />
      </div>

      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onPropertySelect(null)}
            className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedProperty && (
          <>
            <motion.div
              key={`mobile-sheet-${selectedProperty.id}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-30 flex max-h-[85vh] flex-col rounded-t-[2.5rem] border-t shadow-2xl backdrop-blur-xl md:hidden"
            >
              <div className="flex w-full justify-center p-4">
                <div className="bg-muted-foreground/20 h-1.5 w-12 rounded-full" />
              </div>

              <div className="flex flex-1 flex-col overflow-y-auto pb-8">
                <div className="px-6">
                  <PropertyPreviewGallery
                    propertyId={selectedProperty.id}
                    title={selectedProperty.title}
                    status={selectedProperty.status}
                    images={selectedPropertyImages}
                    heightClass="h-52"
                  />
                </div>

                <div className="space-y-6 p-6">
                  <div>
                    <h2 className="text-xl leading-tight font-black tracking-tighter text-amber-500 uppercase">
                      {selectedProperty.title}
                    </h2>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black uppercase">
                        {formatCurrency(selectedProperty.price_per_month, 'en-PH', 'PHP')}
                      </span>
                      <span className="text-muted-foreground text-[10px] font-black tracking-tighter uppercase">
                        / month
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <MapPin className="text-muted-foreground h-4 w-4" />
                    </div>
                    <p className="text-foreground text-xs leading-relaxed font-bold">
                      {selectedProperty.address}
                    </p>
                  </div>

                  <Link
                    href={`/properties/${selectedProperty.id}`}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-5 text-[11px] font-black text-white shadow-xl transition-all hover:bg-amber-600 active:scale-95"
                  >
                    View Full Listing
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div
              key={`desktop-panel-${selectedProperty.id}`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="bg-card/95 border-border fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l shadow-2xl backdrop-blur-xl md:w-[480px]"
            >
              <button
                onClick={() => onPropertySelect(null)}
                className="bg-background/80 hover:bg-background absolute top-4 -left-6 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-transform hover:scale-110 active:scale-90 md:-left-5"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="p-5 pb-0">
                  <PropertyPreviewGallery
                    propertyId={selectedProperty.id}
                    title={selectedProperty.title}
                    status={selectedProperty.status}
                    images={selectedPropertyImages}
                    heightClass="h-72"
                    showThumbnails
                  />
                </div>

                <div className="space-y-6 p-6">
                  <div>
                    <h2 className="text-xl leading-tight font-black tracking-tighter text-amber-500 uppercase">
                      {selectedProperty.title}
                    </h2>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black">
                        {formatCurrency(selectedProperty.price_per_month, 'en-PH', 'PHP')}
                      </span>
                      <span className="text-muted-foreground text-xs font-bold uppercase">
                        / month
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <MapPin className="text-muted-foreground h-4 w-4" />
                    </div>
                    <p className="text-foreground text-sm leading-relaxed font-semibold">
                      {selectedProperty.address}
                    </p>
                  </div>

                  <div className="border-border/60 border-t border-b py-4">
                    <h4 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                      Amenities
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedProperty.amenities?.slice(0, 4).map((amenity, index) => (
                        <span
                          key={`${amenity}-${index}`}
                          className="bg-muted/50 rounded-md px-2 py-1 text-[10px] font-bold"
                        >
                          {amenity}
                        </span>
                      ))}
                      {selectedProperty.amenities?.length > 4 && (
                        <span className="text-muted-foreground text-[10px] font-bold">
                          +{selectedProperty.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/properties/${selectedProperty.id}`}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 text-xs font-black text-white shadow-lg transition-all hover:bg-amber-600 hover:shadow-amber-500/20 active:scale-[0.98]"
                  >
                    View Full Listing
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
