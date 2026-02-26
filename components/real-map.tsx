'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useCallback, useRef } from 'react'

// Use locally served icons from /public/ to avoid Edge tracking prevention
// blocking unpkg.com CDN requests
const DefaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

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
}

interface RealMapProps {
  properties: Property[]
  selectedProperty: Property | null
  onPropertySelect: (property: Property) => void
  initialLat?: number
  initialLng?: number
}

// Only flies to a property when the user explicitly selects one.
// Does NOT sync external center state back → no feedback loop.
function FlyToSelected({ selectedProperty }: { selectedProperty: Property | null }) {
  const map = useMap()
  const prevId = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedProperty || selectedProperty.id === prevId.current) return

    const lat = Number(selectedProperty.latitude)
    const lng = Number(selectedProperty.longitude)

    // Number.isFinite guards against NaN, null, undefined, and Infinity
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return

    prevId.current = selectedProperty.id

    // Delay so the map container is fully laid out before flyTo is called.
    // Calling flyTo on a zero-size container causes Leaflet's projection
    // math to return NaN, crashing with "Invalid LatLng object: (NaN, NaN)".
    const timer = setTimeout(() => {
      try {
        map.flyTo([lat, lng], 16, { animate: true, duration: 0.8 })
      } catch {
        // Fallback: setView is more resilient than flyTo
        try {
          map.setView([lat, lng], 16)
        } catch {
          /* ignore */
        }
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [selectedProperty, map])

  return null
}

// Uses ResizeObserver on the actual map container element so it catches
// ALL layout shifts (sidebar growing/shrinking, etc.), not just window resize.
function MapFixer() {
  const map = useMap()

  const fixMap = useCallback(() => {
    map.invalidateSize({ animate: false })
  }, [map])

  useEffect(() => {
    const timers = [50, 200, 500, 1000, 2000].map((d) => setTimeout(fixMap, d))

    const container = map.getContainer()
    const ro = new ResizeObserver(fixMap)
    ro.observe(container)

    window.addEventListener('resize', fixMap)

    return () => {
      timers.forEach((t) => clearTimeout(t))
      ro.disconnect()
      window.removeEventListener('resize', fixMap)
    }
  }, [map, fixMap])

  return null
}

// Calls invalidateSize whenever the number of properties changes so that
// if the sidebar grows (listing cards appear), the map redraws correctly.
function MapInvalidator({ trigger }: { trigger: number }) {
  const map = useMap()
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize({ animate: false }), 100)
    const t2 = setTimeout(() => map.invalidateSize({ animate: false }), 400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [trigger, map])
  return null
}

export default function RealMap({
  properties,
  selectedProperty,
  onPropertySelect,
  initialLat,
  initialLng,
}: RealMapProps) {
  // Compute the initial center once — from the first property or fall back to Manila.
  // This is intentionally a plain variable (not state) so React never re-centers
  // the map when properties load later.
  const lat0 = Number(initialLat)
  const lng0 = Number(initialLng)
  const initialCenter: [number, number] = [
    Number.isFinite(lat0) && lat0 !== 0 ? lat0 : 14.5995,
    Number.isFinite(lng0) && lng0 !== 0 ? lng0 : 120.9842,
  ]

  return (
    <div className="relative h-full w-full" style={{ minHeight: '400px' }}>
      <MapContainer
        center={initialCenter}
        zoom={15}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FlyToSelected selectedProperty={selectedProperty} />
        <MapFixer />
        <MapInvalidator trigger={properties.length} />

        {properties.map((property) =>
          property.latitude && property.longitude ? (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
              eventHandlers={{
                click: () => onPropertySelect(property),
              }}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="text-sm font-bold">{property.title}</h3>
                  <p className="text-primary text-xs font-bold">${property.price_per_month}/mo</p>
                  <p className="text-muted-foreground text-[10px]">{property.address}</p>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  )
}
