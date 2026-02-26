import dynamic from 'next/dynamic'

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
  onPropertySelect: (property: Property) => void
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
    <div className="relative flex h-full w-full flex-col">
      <div className="bg-background/80 border-border pointer-events-none absolute top-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border px-3.5 py-1.5 shadow-md backdrop-blur-sm md:flex">
        <span className="text-sm">📍</span>
        <p className="text-muted-foreground text-xs font-medium whitespace-nowrap">
          Click a pin to view listing details
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

      {selectedProperty && (
        <div className="bg-card/95 animate-in slide-in-from-bottom-2 absolute right-4 bottom-4 left-4 z-10 rounded-xl border-t p-4 shadow-lg backdrop-blur-sm md:static md:mt-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-foreground text-lg font-bold">{selectedProperty.title}</h3>
              <p className="text-primary font-bold">${selectedProperty.price_per_month}/month</p>
              <p className="text-muted-foreground mt-1 text-sm">{selectedProperty.address}</p>
            </div>
            <div
              className={`rounded px-2 py-1 text-xs font-bold uppercase ${selectedProperty.status === 'available'
                  ? 'bg-green-100 text-green-700'
                  : selectedProperty.status === 'reserved'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-red-100 text-red-700'
                }`}
            >
              {selectedProperty.status}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
