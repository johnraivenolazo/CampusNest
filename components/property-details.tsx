'use client'

import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import MessageDialog from '@/components/message-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils.currency'
import PropertyReviews from '@/components/property-reviews'
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  House,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
} from 'lucide-react'

interface Property {
  id: string
  title: string
  description: string
  price_per_month: number
  address: string
  latitude: number
  longitude: number
  status: 'available' | 'reserved' | 'taken'
  property_images: string[]
  images?: string[]
  amenities: string[]
  rules: string[] | string
  bedrooms: number
  bathrooms: number
  furnished: boolean
  landlord_id: string
  created_at: string
}

interface PropertyDetailsProps {
  property: Property
  user: User | null
}

function getStatusClasses(status: Property['status']) {
  switch (status) {
    case 'available':
      return 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200'
    case 'reserved':
      return 'border-amber-400/30 bg-amber-400/15 text-amber-200'
    case 'taken':
      return 'border-rose-400/30 bg-rose-400/15 text-rose-200'
    default:
      return 'border-white/10 bg-white/10 text-white'
  }
}

export default function PropertyDetails({ property, user }: PropertyDetailsProps) {
  const [showMessage, setShowMessage] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

  const images = property.property_images || property.images || []
  const hasImages = images.length > 0
  const rules = (
    Array.isArray(property.rules)
      ? property.rules
      : property.rules?.split(',').map((rule) => rule.trim())
  ).filter(Boolean)

  const statItems = [
    { label: 'Bedrooms', value: property.bedrooms, icon: BedDouble },
    { label: 'Bathrooms', value: property.bathrooms, icon: Bath },
    { label: 'Setup', value: property.furnished ? 'Furnished' : 'Unfurnished', icon: House },
  ]

  useEffect(() => {
    const checkBookmark = async () => {
      if (!user) return

      const { data } = await supabase
        .from('saved_properties')
        .select('*')
        .eq('user_id', user.id)
        .eq('property_id', property.id)
        .single()

      if (data) {
        setIsBookmarked(true)
      }
    }

    checkBookmark()
  }, [property.id, supabase, user])

  const toggleBookmark = async () => {
    if (!user) return

    setIsBookmarking(true)

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', property.id)

        if (error) throw error

        setIsBookmarked(false)
        toast({
          title: 'Removed from saved',
          description: 'Property removed from your saved list.',
        })
      } else {
        const { error } = await supabase.from('saved_properties').insert({
          user_id: user.id,
          property_id: property.id,
        })

        if (error) throw error

        setIsBookmarked(true)
        toast({
          title: 'Property saved',
          description: 'You can view this in your saved properties.',
        })
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast({
        title: 'Error',
        description: 'Could not update saved properties.',
        variant: 'destructive',
      })
    } finally {
      setIsBookmarking(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_24%),linear-gradient(180deg,rgba(3,10,14,0.98),rgba(4,12,16,1))]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-10 lg:py-10">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">
            <section className="bg-card/70 overflow-hidden rounded-[30px] border border-white/8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm">
              <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
                <div className="border-border/60 border-b lg:border-r lg:border-b-0">
                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    {hasImages ? (
                      <>
                        <Image
                          src={images[activeImageIndex]}
                          alt={`${property.title} image ${activeImageIndex + 1}`}
                          fill
                          priority
                          className="object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-5">
                          <div className="flex items-end justify-between gap-4">
                            <div className="space-y-2">
                              <Badge
                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide uppercase ${getStatusClasses(property.status)}`}
                              >
                                {property.status}
                              </Badge>
                              <p className="max-w-md text-sm font-medium text-white/85">
                                Browse photos to check the room setup and condition.
                              </p>
                            </div>
                            {images.length > 1 && (
                              <div className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                {activeImageIndex + 1} / {images.length}
                              </div>
                            )}
                          </div>
                        </div>

                        {images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveImageIndex((prev) =>
                                  prev > 0 ? prev - 1 : images.length - 1
                                )
                              }
                              className="absolute top-1/2 left-4 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveImageIndex((prev) =>
                                  prev < images.length - 1 ? prev + 1 : 0
                                )
                              }
                              className="absolute top-1/2 right-4 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3">
                        <ImageIcon className="h-12 w-12 opacity-30" />
                        <p className="text-sm">No images uploaded for this listing yet.</p>
                      </div>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto p-4">
                      {images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border transition ${
                            activeImageIndex === index
                              ? 'border-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]'
                              : 'border-white/8 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <Image
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] p-6 md:p-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-300 uppercase">
                          Listing
                        </Badge>
                        <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
                          Updated {new Date(property.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                          {property.title}
                        </h1>
                        <div className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                          <span>{property.address}</span>
                        </div>
                      </div>

                      <p className="text-sm leading-7 text-white/72">
                        {property.description ||
                          'A practical stay with a straightforward setup near key student areas.'}
                      </p>
                    </div>

                    <div className="bg-background/28 divide-y divide-white/8 rounded-2xl border border-white/8">
                      {statItems.map(({ label, value, icon: Icon }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-4 px-4 py-3.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm text-white/72">{label}</span>
                          </div>
                          <span className="text-right text-base font-semibold text-white">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {property.amenities?.length > 0 && (
                    <div className="mt-8 space-y-3">
                      <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                        Highlights
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.slice(0, 6).map((amenity) => (
                          <span
                            key={amenity}
                            className="inline-flex max-w-full items-center rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-sm text-white/80"
                          >
                            <span className="truncate">{amenity}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <div className="bg-card/65 rounded-[28px] border border-white/8 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs tracking-[0.22em] uppercase">
                      Overview
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Overview</h2>
                  </div>
                  <Badge
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase ${getStatusClasses(property.status)}`}
                  >
                    {property.status}
                  </Badge>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="bg-background/40 rounded-3xl border border-white/8 p-5">
                    <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                      Description
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/78">{property.description}</p>
                  </div>

                  <div className="bg-background/40 rounded-3xl border border-white/8 p-5">
                    <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                      Setup
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-white/82">
                      <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                        <span>Monthly price</span>
                        <strong className="text-amber-300">
                          {formatCurrency(property.price_per_month, 'en-PH', 'PHP')}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                        <span>Bedrooms</span>
                        <strong>{property.bedrooms}</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                        <span>Bathrooms</span>
                        <strong>{property.bathrooms}</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                        <span>Furnishing</span>
                        <strong>{property.furnished ? 'Included' : 'Not included'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-card/65 rounded-[28px] border border-white/8 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
                  <p className="text-muted-foreground text-xs tracking-[0.22em] uppercase">
                    Amenities
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">What’s included</h2>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {property.amenities?.length > 0 ? (
                      property.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full border border-white/8 bg-white/[0.04] px-3.5 py-2 text-sm text-white/82"
                        >
                          {amenity}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-white/60">No amenities listed yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-card/65 rounded-[28px] border border-white/8 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
                  <p className="text-muted-foreground text-xs tracking-[0.22em] uppercase">
                    Home rules
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Before you book</h2>
                  <div className="mt-5 space-y-3">
                    {rules.length > 0 ? (
                      rules.map((rule) => (
                        <div
                          key={rule}
                          className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/78"
                        >
                          <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                          <span>{rule}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/60">No house rules provided.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="[&>div]:mt-0">
              <PropertyReviews propertyId={property.id} user={user} />
            </div>
          </div>

          <aside className="xl:pt-2">
            <div className="bg-card/78 sticky top-28 space-y-5 rounded-[30px] border border-white/8 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-sm">
              <div className="space-y-3 border-b border-white/8 pb-5">
                <p className="text-muted-foreground text-xs tracking-[0.22em] uppercase">
                  Monthly rate
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-amber-300">
                    {formatCurrency(property.price_per_month, 'en-PH', 'PHP')}
                  </span>
                  <span className="pb-1 text-sm text-white/55">/ month</span>
                </div>
                <p className="text-sm leading-6 text-white/60">
                  Contact the landlord or save this listing to compare it later.
                </p>
              </div>

              <div className="space-y-3">
                {user?.user_metadata?.user_type === 'student' && (
                  <>
                    <Button
                      className="h-12 w-full rounded-2xl bg-amber-500 text-base font-semibold text-white hover:bg-amber-600"
                      disabled={property.status !== 'available'}
                      onClick={() => setShowMessage(true)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {property.status === 'available' ? 'Send a Message' : 'Not Available'}
                    </Button>
                    <Button
                      variant={isBookmarked ? 'default' : 'outline'}
                      className={`h-12 w-full rounded-2xl ${
                        isBookmarked
                          ? 'border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60'
                          : 'bg-background/35 border-white/10'
                      }`}
                      onClick={toggleBookmark}
                      disabled={isBookmarking}
                    >
                      <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      {isBookmarked ? 'Saved to your list' : 'Save Property'}
                    </Button>
                  </>
                )}

                {!user && (
                  <div className="bg-background/40 space-y-4 rounded-[26px] border border-white/8 p-5">
                    <div>
                      <p className="text-lg font-semibold text-white">Interested in this place?</p>
                      <p className="mt-1 text-sm leading-6 text-white/62">
                        Sign up to contact the landlord, save listings, and keep track of your
                        shortlist.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        'Message the landlord directly',
                        'Save listings you want to compare',
                        'Come back to your shortlisted stays anytime',
                      ].map((text) => (
                        <div key={text} className="flex items-start gap-3 text-sm text-white/78">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      asChild
                      className="h-12 w-full rounded-2xl bg-amber-500 font-semibold text-white hover:bg-amber-600"
                    >
                      <Link href="/">
                        Get started for free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}

                {user?.user_metadata?.user_type === 'landlord' && (
                  <Button
                    asChild
                    variant="outline"
                    className="bg-background/35 h-12 w-full rounded-2xl border-white/10"
                  >
                    <Link href={`/landlord/properties/${property.id}/edit`}>Edit Listing</Link>
                  </Button>
                )}
              </div>

              <div className="bg-background/40 rounded-[26px] border border-white/8 p-5">
                <p className="text-muted-foreground text-xs tracking-[0.22em] uppercase">
                  Quick snapshot
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-white/78">
                    <span>Status</span>
                    <span className="font-medium text-white capitalize">{property.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/78">
                    <span>Amenities listed</span>
                    <span className="font-medium text-white">
                      {property.amenities?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/78">
                    <span>Rules posted</span>
                    <span className="font-medium text-white">{rules.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {user && user.user_metadata?.user_type === 'student' && (
        <MessageDialog
          open={showMessage}
          onOpenChange={setShowMessage}
          propertyId={property.id}
          landlordId={property.landlord_id}
          propertyTitle={property.title}
          user={user}
        />
      )}
    </div>
  )
}
