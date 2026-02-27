'use client'

import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Home, Wifi, Car, ShieldCheck, Zap, Droplets, Wind } from 'lucide-react'
import { formatCurrency } from '@/lib/utils.currency'
import { createClient } from '@/lib/supabase/client'

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
  average_rating?: number
}

interface PropertyListingsProps {
  properties: Property[]
  selectedProperty: Property | null
  onPropertySelect: (property: Property) => void
  user: User | null
}

const STATUS = {
  available: {
    label: 'Available',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  reserved: {
    label: 'Reserved',
    dot: 'bg-amber-500',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  taken: {
    label: 'Taken',
    dot: 'bg-red-500',
    pill: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
}

// Map common amenity strings to icons
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3 w-3" />,
  parking: <Car className="h-3 w-3" />,
  security: <ShieldCheck className="h-3 w-3" />,
  electricity: <Zap className="h-3 w-3" />,
  water: <Droplets className="h-3 w-3" />,
  aircon: <Wind className="h-3 w-3" />,
}

function AmenityPill({ label }: { label: string }) {
  const normalized = label.toLowerCase().trim()
  const icon = AMENITY_ICONS[normalized] || null

  return (
    <div className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border bg-background/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap shadow-sm backdrop-blur-md transition-colors hover:bg-muted/50">
      {icon && <span className="opacity-70">{icon}</span>}
      <span>{label}</span>
    </div>
  )
}

function SaveButton({ propertyId, userId }: { propertyId: string; userId?: string | undefined }) {
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    const checkSave = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .single()

      if (data) setIsSaved(true)
    }
    checkSave()
  }, [userId, propertyId])

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the card click
    if (!userId) {
      // Could show a toast telling them to log in here
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      if (isSaved) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', propertyId)
        setIsSaved(false)
      } else {
        await supabase
          .from('saved_properties')
          .insert({ user_id: userId, property_id: propertyId })
        setIsSaved(true)
      }
    } catch (err) {
      console.error('Failed to toggle save:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isSaving}
      className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all ${isSaved
        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-sm'
        : 'bg-black/40 text-white hover:bg-black/60 hover:scale-105'
        }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isSaved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <p className="text-muted-foreground mt-2 max-w-[220px] text-sm leading-relaxed">
        No properties found.
      </p>
    </div>
  )
}

export default function PropertyListings({
  properties,
  selectedProperty,
  onPropertySelect,
  user,
}: PropertyListingsProps) {
  if (properties.length === 0) return <EmptyState />

  return (
    <motion.div
      className="space-y-3 pr-1"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {properties.map((property) => {
        const status = STATUS[property.status] ?? STATUS.available
        const img = property.property_images?.[0] ?? property.images?.[0]
        const isSelected = selectedProperty?.id === property.id

        return (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            key={property.id}
            onClick={() => onPropertySelect(property)}
            className={`group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${isSelected
              ? 'scale-[1.01] border-amber-400 bg-amber-50/40 shadow-[0_0_0_2px_rgba(251,191,36,0.25)] dark:border-amber-500 dark:bg-amber-950/10'
              : 'border-border bg-card hover:border-muted-foreground/30 hover:-translate-y-0.5 hover:shadow-lg'
              }`}
          >
            {/* Thumbnail */}
            <div className="bg-muted relative h-36 w-full overflow-hidden">
              {img ? (
                <Image
                  src={img}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="from-muted via-muted to-muted/60 flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br">
                  <Home className="text-muted-foreground/25 h-8 w-8" />
                  <span className="text-muted-foreground/40 text-[10px] font-medium tracking-wider uppercase">
                    No photo
                  </span>
                </div>
              )}

              {/* Status badge */}
              <div
                className={`absolute top-2 left-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${status.pill}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot} animate-pulse`} />
                {status.label}
              </div>

              {/* Quick Save overlay (Heart) */}
              <div className="absolute top-2 right-2 flex items-center justify-center">
                <SaveButton propertyId={property.id} userId={user?.id} />
              </div>
            </div>

            {/* Body */}
            <div className="space-y-2.5 p-3.5">
              {/* Title + address + rating */}
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-foreground line-clamp-1 text-sm leading-snug font-bold">
                    {property.title}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-3 w-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {property.average_rating ? property.average_rating.toFixed(1) : 'New'}
                  </div>
                </div>
                <div className="mt-0.5 flex items-center gap-1">
                  <MapPin className="text-muted-foreground h-3 w-3 shrink-0" />
                  <p className="text-muted-foreground line-clamp-1 text-xs">{property.address}</p>
                </div>
              </div>

              {/* Amenity pills */}
              {property.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {property.amenities.slice(0, 3).map((a) => (
                    <AmenityPill key={a} label={a} />
                  ))}
                  {property.amenities.length > 3 && (
                    <span className="bg-muted text-muted-foreground border-border/50 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                      +{property.amenities.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Price + CTA */}
              <div className="border-border flex items-center justify-between border-t pt-2">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl leading-none font-extrabold text-amber-500">
                    {formatCurrency(property.price_per_month, 'en-PH', 'PHP')}
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">/mo</span>
                </div>
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-amber-500 px-3 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPropertySelect(property)
                  }}
                >
                  Details
                </Button>
              </div>

              {/* Guest nudge — shown instead of contact button */}
              {!user && property.status === 'available' && (
                <Link
                  href="/"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground block text-center text-[10px] transition-colors hover:text-amber-500"
                >
                  Sign up free to inquire →
                </Link>
              )}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
