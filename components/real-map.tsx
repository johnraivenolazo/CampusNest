'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useCallback, useRef, useMemo, useState } from 'react'

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

// Custom component to handle user location
function MapUserLocation({
  userLocation,
  setUserLocation
}: {
  userLocation: [number, number] | null;
  setUserLocation: (loc: [number, number]) => void
}) {
  const map = useMap()

  useEffect(() => {
    // Only ask once, and if we don't already have it
    if (userLocation || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([latitude, longitude])
        // Smoothly fly to the user's location
        map.flyTo([latitude, longitude], 15, {
          duration: 2,
        })
      },
      (error) => {
        console.warn("Geolocation denied or failed:", error)
        // Silently fails and remains at the fallback center
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }, [map, userLocation, setUserLocation])

  return null
}

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
  onPropertySelect: (property: Property | null) => void
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Compute the initial center once — from the first property or fall back to Manila temporarily.
  const lat0 = Number(initialLat)
  const lng0 = Number(initialLng)
  const initialCenter: [number, number] = useMemo(
    () => [
      Number.isFinite(lat0) && lat0 !== 0 ? lat0 : 14.5995,
      Number.isFinite(lng0) && lng0 !== 0 ? lng0 : 120.9842,
    ],
    [lat0, lng0]
  )

  return (
    <div className="relative h-full w-full" style={{ minHeight: '400px' }}>
      <MapContainer
        key="main-map"
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
        <MapUserLocation userLocation={userLocation} setUserLocation={setUserLocation} />
        <MapFixer />
        <MapInvalidator trigger={properties.length} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: 'bg-transparent border-none',
              html: `<div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] relative">
                <div class="absolute inset-0 rounded-full border-2 border-blue-400 border-opacity-50 animate-ping"></div>
              </div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup className="rounded-lg overflow-hidden border-0 shadow-lg p-0">
              <div className="p-2 text-sm font-semibold">Your Location</div>
            </Popup>
          </Marker>
        )}

        {properties.map((property) =>
          property.latitude && property.longitude ? (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
              eventHandlers={{
                click: () => onPropertySelect(property),
              }}
            />
          ) : null
        )}
      </MapContainer>
    </div>
  )
}
