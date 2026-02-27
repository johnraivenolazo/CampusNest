import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronRight, Image as ImageIcon, MapPin } from 'lucide-react'
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
}

export default function MapContainer({
  properties,
  selectedProperty,
  onPropertySelect,
  initialLat,
  initialLng,
}: MapContainerProps) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* ── Instructions Tooltip ── */}
      <div className="bg-background/80 border-border pointer-events-none absolute top-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border px-3.5 py-1.5 shadow-md backdrop-blur-sm md:flex">
        <span className="text-sm">📍</span>
        <p className="text-muted-foreground text-xs font-medium whitespace-nowrap">
          Click the "pin" icon to view listing details
        </p>
      </div>

      <div className="h-full flex-1">
        <RealMap
          properties={properties}
          selectedProperty={selectedProperty}
          onPropertySelect={onPropertySelect}
          initialLat={initialLat}
          initialLng={initialLng}
        />
      </div>

      {/* ── Darkening Overlay ── */}
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

      {/* ── Side Detail Panel (Desktop) / Bottom Sheet (Mobile) ── */}
      <AnimatePresence mode="wait">
        {selectedProperty && (
          <>
            {/* Mobile Bottom Sheet (visible < md) */}
            <motion.div
              key="mobile-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-30 flex max-h-[85vh] flex-col rounded-t-[2.5rem] border-t shadow-2xl backdrop-blur-xl md:hidden"
            >
              {/* Handle */}
              <div className="flex w-full justify-center p-4">
                <div className="bg-muted-foreground/20 h-1.5 w-12 rounded-full" />
              </div>

              <div className="flex flex-1 flex-col overflow-y-auto pb-8">
                {/* Hero Image Mobile */}
                <div className="relative h-48 w-full shrink-0 px-6">
                  <div className="relative h-full w-full overflow-hidden rounded-2xl">
                    {selectedProperty.property_images?.[0] ? (
                      <Image
                        src={selectedProperty.property_images[0]}
                        alt={selectedProperty.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground/30 flex h-full items-center justify-center">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[8px] font-black tracking-widest text-white uppercase backdrop-blur-md">
                      {selectedProperty.status}
                    </div>
                  </div>
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
                    VIEW FULL LISTING
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Desktop Side Panel (visible >= md) */}
            <motion.div
              key="desktop-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="border-border bg-card/95 absolute top-0 right-0 z-30 hidden h-full w-[380px] flex-col border-l shadow-2xl backdrop-blur-md md:flex"
            >
              <button
                onClick={() => onPropertySelect(null)}
                className="bg-background/80 hover:bg-background absolute top-4 -left-6 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-transform hover:scale-110 active:scale-90 md:-left-5"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="bg-muted relative h-64 w-full">
                  {selectedProperty.property_images?.[0] ? (
                    <Image
                      src={selectedProperty.property_images[0]}
                      alt={selectedProperty.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground/30 flex h-full items-center justify-center">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase backdrop-blur-md">
                    {selectedProperty.status}
                  </div>
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
                      {selectedProperty.amenities?.slice(0, 4).map((amenity, idx) => (
                        <span
                          key={idx}
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
                    VIEW FULL LISTING
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
