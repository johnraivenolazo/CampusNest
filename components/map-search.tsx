'use client'

import { useState, useEffect, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import MapContainer from '@/components/map-container'
import PropertyListings from '@/components/property-listings'
import { createClient } from '@/lib/supabase/client'
import { Search, SlidersHorizontal, X, MapPin, Navigation } from 'lucide-react'
import { formatCurrency } from '@/lib/utils.currency'

const DEFAULT_RADIUS_KM = 5
const MAX_RADIUS_KM = 50
const MAX_PRICE_CEILING = 100000

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

interface FilterOptions {
  minPrice: number
  maxPrice: number
  radiusKm: number
  radiusApplied: boolean
  center: [number, number] | null
  areaSearchApplied: boolean
  bounds: MapBounds | null
}

interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

interface MapViewport {
  center: [number, number]
  bounds: MapBounds
}

function getDistanceKm(from: [number, number], to: [number, number]) {
  const [lat1, lng1] = from
  const [lat2, lng2] = to
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function filterPropertiesList(properties: Property[], filters: FilterOptions) {
  return properties.filter((property) => {
    const hasCoordinates = Boolean(property.latitude && property.longitude)
    const isWithinPrice =
      property.price_per_month >= filters.minPrice && property.price_per_month <= filters.maxPrice

    if (!isWithinPrice) {
      return false
    }

    if (filters.areaSearchApplied) {
      if (!filters.bounds || !hasCoordinates) {
        return false
      }

      const isInsideBounds =
        property.latitude <= filters.bounds.north &&
        property.latitude >= filters.bounds.south &&
        property.longitude <= filters.bounds.east &&
        property.longitude >= filters.bounds.west

      if (!isInsideBounds) {
        return false
      }
    }

    if (!filters.radiusApplied || !filters.center) {
      return true
    }

    if (!hasCoordinates) {
      return false
    }

    const distanceFromCenter = getDistanceKm(filters.center, [
      property.latitude,
      property.longitude,
    ])
    return distanceFromCenter <= filters.radiusKm
  })
}

/** Returns the filled-track % for a range input */
function pct(val: number, min: number, max: number) {
  return ((val - min) / (max - min)) * 100
}

/** Styled range slider with amber fill track */
function RangeSlider({
  id,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  const fill = pct(value, min, max)
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-md"
      style={{
        background: `linear-gradient(to right, #f59e0b ${fill}%, #e5e7eb ${fill}%)`,
      }}
    />
  )
}

export default function MapSearch({ user }: { user: User | null }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list') // Mobile-only toggle

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS_KM)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE_CEILING)
  const [campusLocation, setCampusLocation] = useState('')

  // Pending (inside the panel before applying)
  const [pendingRadius, setPendingRadius] = useState(DEFAULT_RADIUS_KM)
  const [pendingMin, setPendingMin] = useState(0)
  const [pendingMax, setPendingMax] = useState(MAX_PRICE_CEILING)
  const [radiusApplied, setRadiusApplied] = useState(false)

  // Map center
  const [initialLat, setInitialLat] = useState(0)
  const [initialLng, setInitialLng] = useState(0)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null)
  const [usingGeolocation, setUsingGeolocation] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [areaSearchApplied, setAreaSearchApplied] = useState(false)
  const [currentViewport, setCurrentViewport] = useState<MapViewport | null>(null)
  const [appliedViewport, setAppliedViewport] = useState<MapViewport | null>(null)

  // Count of active (non-default) filters
  const radiusCenter = searchCenter

  const activeFilterCount = [
    radiusApplied,
    areaSearchApplied,
    minPrice !== 0,
    maxPrice !== MAX_PRICE_CEILING,
  ].filter(Boolean).length
  const previewRadiusKm = filterOpen ? pendingRadius : searchRadius
  const showRadiusOverlay = Boolean(radiusCenter) && (filterOpen || radiusApplied)
  const showSearchAreaPrompt = useMemo(() => {
    if (!currentViewport || !appliedViewport) return false

    const centerDistance = getDistanceKm(currentViewport.center, appliedViewport.center)
    const boundsChanged =
      Math.abs(currentViewport.bounds.north - appliedViewport.bounds.north) > 0.001 ||
      Math.abs(currentViewport.bounds.south - appliedViewport.bounds.south) > 0.001 ||
      Math.abs(currentViewport.bounds.east - appliedViewport.bounds.east) > 0.001 ||
      Math.abs(currentViewport.bounds.west - appliedViewport.bounds.west) > 0.001

    return centerDistance > 0.15 || boundsChanged
  }, [appliedViewport, currentViewport])

  // Geolocation on mount is disabled per user request.
  // User must explicitly click "Locate me".

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    const nextFiltered = filterPropertiesList(properties, {
      minPrice,
      maxPrice,
      radiusKm: searchRadius,
      radiusApplied,
      center: radiusCenter,
      areaSearchApplied,
      bounds: appliedViewport?.bounds || null,
    })

    setFilteredProperties(nextFiltered)
  }, [
    properties,
    minPrice,
    maxPrice,
    searchRadius,
    radiusApplied,
    radiusCenter,
    areaSearchApplied,
    appliedViewport,
  ])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
      if (error) throw error
      setProperties(data || [])
      if (data && data.length > 0) {
        setInitialLat((prev) => (prev === 0 ? data[0].latitude : prev))
        setInitialLng((prev) => (prev === 0 ? data[0].longitude : prev))
      }
    } catch (err) {
      console.error('Error fetching properties:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location access.')
      return
    }

    setLocating(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLocation: [number, number] = [pos.coords.latitude, pos.coords.longitude]

        setInitialLat(nextLocation[0])
        setInitialLng(nextLocation[1])
        setUserLocation(nextLocation)
        setSearchCenter(nextLocation)
        setUsingGeolocation(true)
        setSelectedProperty(null)
        setViewMode('map')
        setLocationError('')
        setAreaSearchApplied(false)
        setLocating(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setLocationError(
          'We could not get your current location. Please allow location access and try again.'
        )
        setLocating(false)
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }

  const applyFilters = () => {
    setSearchRadius(pendingRadius)
    setMinPrice(pendingMin)
    setMaxPrice(pendingMax)
    setRadiusApplied(Boolean(radiusCenter))
    setFilterOpen(false)
  }

  const handleMapViewportReady = (viewport: MapViewport) => {
    setCurrentViewport(viewport)
    setAppliedViewport((prev) => prev || viewport)
  }

  const handleMapViewportChange = (viewport: MapViewport) => {
    setCurrentViewport(viewport)
  }

  const applyAreaSearch = () => {
    if (!currentViewport) return

    setAppliedViewport(currentViewport)
    setAreaSearchApplied(true)
    setSearchCenter(currentViewport.center)
    setSelectedProperty(null)
  }

  const resetFilters = () => {
    setPendingRadius(DEFAULT_RADIUS_KM)
    setPendingMin(0)
    setPendingMax(MAX_PRICE_CEILING)
    setSearchRadius(DEFAULT_RADIUS_KM)
    setMinPrice(0)
    setMaxPrice(MAX_PRICE_CEILING)
    setRadiusApplied(false)
    setAreaSearchApplied(false)
    setAppliedViewport(currentViewport)
    setFilterOpen(false)
  }

  const openFilter = () => {
    // Sync pending to current applied values when opening
    setPendingRadius(searchRadius)
    setPendingMin(minPrice)
    setPendingMax(maxPrice)
    setFilterOpen(true)
  }

  return (
    <div className="relative flex h-[calc(100vh-65px)] overflow-hidden">
      {/* ─── Left Sidebar (List) ─── */}
      <div
        className={`border-border bg-background flex w-full shrink-0 flex-col overflow-hidden border-r md:flex md:w-[360px] ${
          viewMode === 'list' ? 'flex' : 'hidden'
        }`}
      >
        {/* ── Search bar row ── */}
        <div className="border-border/60 space-y-3 border-b px-4 pt-4 pb-3">
          {/* Main action row */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleLocateMe}
              disabled={locating}
              className={`flex flex-1 justify-center gap-2 transition-all ${
                usingGeolocation
                  ? 'border-amber-500 bg-amber-500 text-white shadow-sm hover:bg-amber-600 hover:text-white dark:text-amber-950 dark:hover:text-amber-950'
                  : 'bg-muted/40 hover:bg-muted font-medium'
              }`}
            >
              <Navigation className="h-4 w-4" />
              {locating ? 'Getting Your Location...' : 'Go to My Current Location'}
            </Button>

            {/* Filter icon button */}
            <button
              onClick={filterOpen ? () => setFilterOpen(false) : openFilter}
              title="Toggle filters"
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                filterOpen || activeFilterCount > 0
                  ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                  : 'bg-muted/40 text-muted-foreground border-border/60 hover:border-muted-foreground/40 hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="border-background absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-amber-500 text-[9px] font-bold text-white shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              id="campus"
              placeholder="Search by university or area..."
              value={campusLocation}
              onChange={(e) => setCampusLocation(e.target.value)}
              className="bg-muted/40 border-border/60 h-9 w-full pl-9 text-sm focus-visible:ring-amber-400/50"
            />
          </div>

          {usingGeolocation && !locationError && (
            <p className="text-xs font-medium text-amber-600">
              Map centered on your current location.
            </p>
          )}

          {locationError && <p className="text-destructive text-xs">{locationError}</p>}

          {/* Clear filters link — only when active */}
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            >
              <X className="h-3 w-3" />
              Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* ── Filter panel (slide-down) ── */}
        <div
          className={`border-border/60 overflow-hidden border-b transition-all duration-300 ease-in-out ${
            filterOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-muted/20 space-y-5 px-4 py-4">
            {/* Radius */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="radius" className="text-foreground text-xs font-semibold">
                  Search Radius
                </label>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-500 dark:bg-amber-950/40">
                  {pendingRadius} km
                </span>
              </div>
              <RangeSlider
                id="radius"
                min={0.5}
                max={MAX_RADIUS_KM}
                step={0.5}
                value={pendingRadius}
                onChange={setPendingRadius}
              />
              <div className="text-muted-foreground flex justify-between text-[10px]">
                <span>0.5 km</span>
                <span>{MAX_RADIUS_KM} km</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {radiusCenter
                  ? 'The circle on the map previews your search area. Apply filters to update the listings and pins inside it.'
                  : 'Use your current location or Search this area to set the center of your radius filter.'}
              </p>
            </div>

            {/* Min price */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="min-price" className="text-foreground text-xs font-semibold">
                  Min Price
                </label>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-500 dark:bg-amber-950/40">
                  {formatCurrency(pendingMin, 'en-PH', 'PHP')}
                </span>
              </div>
              <RangeSlider
                id="min-price"
                min={0}
                max={MAX_PRICE_CEILING}
                step={100}
                value={pendingMin}
                onChange={setPendingMin}
              />
            </div>

            {/* Max price */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="max-price" className="text-foreground text-xs font-semibold">
                  Max Price
                </label>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-500 dark:bg-amber-950/40">
                  {formatCurrency(pendingMax, 'en-PH', 'PHP')}
                </span>
              </div>
              <RangeSlider
                id="max-price"
                min={0}
                max={MAX_PRICE_CEILING}
                step={100}
                value={pendingMax}
                onChange={setPendingMax}
              />
              <div className="text-muted-foreground flex justify-between text-[10px]">
                <span>{formatCurrency(0, 'en-PH', 'PHP')}</span>
                <span>{formatCurrency(MAX_PRICE_CEILING, 'en-PH', 'PHP')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={resetFilters}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-muted flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 rounded-lg bg-amber-500 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-amber-600"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>

        {/* ── Results header ── */}
        <div className="border-border/40 flex items-center justify-between border-b px-4 py-2.5">
          {loading ? (
            <span className="text-muted-foreground animate-pulse text-xs">Loading listings…</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {filteredProperties.length === 0
                  ? 'No listings found'
                  : `${filteredProperties.length} listing${filteredProperties.length !== 1 ? 's' : ''}`}
              </span>
              {filteredProperties.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {filteredProperties.length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Property list (scrollable) ── */}
        <div className="sidebar-scroll flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border-border animate-pulse overflow-hidden rounded-xl border"
                >
                  <div className="bg-muted h-32" />
                  <div className="space-y-2 p-3.5">
                    <div className="bg-muted h-3.5 w-3/4 rounded" />
                    <div className="bg-muted h-2.5 w-1/2 rounded" />
                    <div className="bg-muted mt-3 h-2 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PropertyListings
              properties={filteredProperties}
              selectedProperty={selectedProperty}
              onPropertySelect={setSelectedProperty}
              user={user}
            />
          )}
        </div>
      </div>

      {/* ─── Right: Map (desktop or active mobile view) ─── */}
      <div className={`flex-1 flex-col md:flex ${viewMode === 'map' ? 'flex' : 'hidden'}`}>
        {showSearchAreaPrompt && (
          <div className="pointer-events-none absolute top-4 right-4 z-20">
            <Button
              onClick={applyAreaSearch}
              className="bg-background/95 text-foreground hover:bg-background pointer-events-auto h-10 rounded-full border border-white/70 px-4 text-sm font-semibold shadow-lg backdrop-blur-sm"
            >
              Search this area
            </Button>
          </div>
        )}
        <MapContainer
          properties={filteredProperties}
          selectedProperty={selectedProperty}
          onPropertySelect={setSelectedProperty}
          initialLat={initialLat}
          initialLng={initialLng}
          userLocation={userLocation}
          searchCenter={searchCenter}
          radiusKm={previewRadiusKm}
          showRadius={showRadiusOverlay}
          onViewportReady={handleMapViewportReady}
          onViewportChange={handleMapViewportChange}
          showMapHint={!showSearchAreaPrompt}
        />
      </div>

      {/* ─── Mobile FAB View Toggle ─── */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden">
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-amber-600 active:scale-95"
        >
          {viewMode === 'list' ? (
            <>
              <MapPin className="h-4 w-4" />
              <span>Show Map</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Show List</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
