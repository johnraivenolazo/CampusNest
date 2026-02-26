'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Input } from '@/components/ui/input'
import MapContainer from '@/components/map-container'
import PropertyListings from '@/components/property-listings'
import { createClient } from '@/lib/supabase/client'
import { Search, SlidersHorizontal, X, MapPin, Navigation } from 'lucide-react'
import { formatCurrency } from '@/lib/utils.currency'

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
  const [searchRadius, setSearchRadius] = useState(5)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(20000)
  const [campusLocation, setCampusLocation] = useState('')

  // Pending (inside the panel before applying)
  const [pendingRadius, setPendingRadius] = useState(5)
  const [pendingMin, setPendingMin] = useState(0)
  const [pendingMax, setPendingMax] = useState(20000)

  // Map center
  const [initialLat, setInitialLat] = useState(0)
  const [initialLng, setInitialLng] = useState(0)
  const [usingGeolocation, setUsingGeolocation] = useState(false)

  // Count of active (non-default) filters
  const activeFilterCount = [searchRadius !== 5, minPrice !== 0, maxPrice !== 20000].filter(
    Boolean
  ).length

  // Geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInitialLat((prev) => (prev === 0 ? pos.coords.latitude : prev))
        setInitialLng((prev) => (prev === 0 ? pos.coords.longitude : prev))
        setUsingGeolocation(true)
      },
      () => { },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  useEffect(() => {
    fetchProperties()
  }, [])

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
      setFilteredProperties(data || [])
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

  const applyFilters = () => {
    setSearchRadius(pendingRadius)
    setMinPrice(pendingMin)
    setMaxPrice(pendingMax)

    const filtered = properties.filter(
      (p) => p.price_per_month >= pendingMin && p.price_per_month <= pendingMax
    )
    setFilteredProperties(filtered)
    setFilterOpen(false)
  }

  const resetFilters = () => {
    setPendingRadius(5)
    setPendingMin(0)
    setPendingMax(20000)
    setSearchRadius(5)
    setMinPrice(0)
    setMaxPrice(20000)
    setFilteredProperties(properties)
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
        className={`border-border bg-background flex w-full shrink-0 flex-col overflow-hidden border-r md:w-[360px] md:flex ${viewMode === 'list' ? 'flex' : 'hidden'
          }`}
      >
        {/* ── Search bar row ── */}
        <div className="border-border/60 space-y-3 border-b px-4 pt-4 pb-3">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-base font-bold">Find Housing</h2>
              <p className="text-muted-foreground text-xs">Near your campus</p>
            </div>
            {usingGeolocation && (
              <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-600 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                <Navigation className="h-2.5 w-2.5" />
                Your location
              </div>
            )}
          </div>

          {/* Search + Filter in one row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                id="campus"
                placeholder="Campus, university, area…"
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                className="bg-muted/40 border-border/60 h-9 pr-3 pl-9 text-sm focus-visible:ring-amber-400/50"
              />
            </div>

            {/* Filter icon button */}
            <button
              onClick={filterOpen ? () => setFilterOpen(false) : openFilter}
              title="Toggle filters"
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${filterOpen || activeFilterCount > 0
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
          className={`border-border/60 overflow-hidden border-b transition-all duration-300 ease-in-out ${filterOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
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
                max={20}
                step={0.5}
                value={pendingRadius}
                onChange={setPendingRadius}
              />
              <div className="text-muted-foreground flex justify-between text-[10px]">
                <span>0.5 km</span>
                <span>20 km</span>
              </div>
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
                max={20000}
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
                max={20000}
                step={100}
                value={pendingMax}
                onChange={setPendingMax}
              />
              <div className="text-muted-foreground flex justify-between text-[10px]">
                <span>$0</span>
                <span>$20,000</span>
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
        <MapContainer
          properties={filteredProperties}
          selectedProperty={selectedProperty}
          onPropertySelect={setSelectedProperty}
          initialLat={initialLat}
          initialLng={initialLng}
        />
      </div>

      {/* ─── Mobile FAB View Toggle ─── */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden">
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 rounded-full px-6 py-3 font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
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
