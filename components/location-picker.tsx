'use client'

import dynamic from 'next/dynamic'
import { useState, useRef } from 'react'
import { Search, MapPin, Navigation, Loader2, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

const PickerMap = dynamic(() => import('./picker-map'), {
  ssr: false,
  loading: () => (
    <div className="bg-muted flex h-full w-full animate-pulse items-center justify-center rounded-xl">
      <MapPin className="text-muted-foreground/30 h-6 w-6 animate-bounce" />
    </div>
  ),
})

interface LocationPickerProps {
  address: string
  latitude: string
  longitude: string
  onAddressChange: (address: string) => void
  onCoordsChange: (lat: string, lng: string) => void
}

export default function LocationPicker({
  address,
  latitude,
  longitude,
  onAddressChange,
  onCoordsChange,
}: LocationPickerProps) {
  const [geocoding, setGeocoding] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [locating, setLocating] = useState(false)
  const [pinSet, setPinSet] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lat = parseFloat(latitude) || 0
  const lng = parseFloat(longitude) || 0

  // --- Geocode address via Nominatim (free, no key) ---
  const geocodeAddress = async (query: string) => {
    if (!query.trim() || query.trim().length < 5) return
    setGeocoding(true)
    setGeoError('')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const results = await res.json()
      if (results.length > 0) {
        const { lat: gLat, lon: gLng } = results[0]
        onCoordsChange(parseFloat(gLat).toFixed(6), parseFloat(gLng).toFixed(6))
        setPinSet(true)
      } else {
        setGeoError('Address not found. Try clicking the map to place a pin manually.')
      }
    } catch {
      setGeoError('Geocoding failed. Try clicking the map instead.')
    } finally {
      setGeocoding(false)
    }
  }

  // --- Browser geolocation ---
  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCoordsChange(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6))
        setPinSet(true)
        setLocating(false)
      },
      () => {
        setGeoError('Could not get your location.')
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }

  // --- Handle address input with debounced geocoding ---
  const handleAddressChange = (val: string) => {
    onAddressChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => geocodeAddress(val), 800)
  }

  // --- Map click → set pin ---
  const handleMapPick = (pickedLat: number, pickedLng: number) => {
    onCoordsChange(pickedLat.toFixed(6), pickedLng.toFixed(6))
    setPinSet(true)
  }

  return (
    <div className="space-y-3">
      {/* Address search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            id="location"
            placeholder="Type full address, street, barangay, city…"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="pr-3 pl-9 text-sm"
          />
          {geocoding && (
            <Loader2 className="absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-amber-500" />
          )}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          title="Use my current location"
          className="border-border bg-muted/40 hover:bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors hover:text-amber-500 disabled:opacity-50"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Helper text */}
      <p className="text-muted-foreground text-xs">
        Address auto-locates the pin. You can also{' '}
        <span className="text-foreground font-medium">click anywhere on the map</span> to place it
        manually.
      </p>

      {/* Error */}
      {geoError && <p className="text-destructive text-xs">{geoError}</p>}

      {/* Map */}
      <div className="border-border relative h-56 overflow-hidden rounded-xl border shadow-sm">
        <PickerMap lat={lat} lng={lng} onPick={handleMapPick} />

        {/* Overlay hint when no pin set yet */}
        {!pinSet && !lat && (
          <div className="bg-background/60 pointer-events-none absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <MapPin className="mb-2 h-8 w-8 text-amber-500" />
            <p className="text-foreground text-sm font-medium">
              Search an address or click the map
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">to pin your property location</p>
          </div>
        )}
      </div>

      {/* Coordinates readout (read-only, shows once set) */}
      {lat !== 0 && lng !== 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Location pinned: {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
      )}
    </div>
  )
}
