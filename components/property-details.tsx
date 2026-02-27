'use client'

import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'
import MessageDialog from '@/components/message-dialog'
import {
  CheckCircle2,
  MessageCircle,
  Bookmark,
  Bell,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils.currency'
import PropertyReviews from '@/components/property-reviews'

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
  images?: string[] // For compatibility
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

export default function PropertyDetails({ property, user }: PropertyDetailsProps) {
  const [showMessage, setShowMessage] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const images = property.property_images || property.images || []
  const hasImages = images.length > 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'reserved':
        return 'bg-orange-100 text-orange-800'
      case 'taken':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl p-6 md:p-10">
        <Link href="/" className="text-primary mb-6 inline-block hover:underline">
          Back to listings
        </Link>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left - Main Content */}
          <div className="space-y-6 md:col-span-2">
            {/* Images Gallery */}
            <div className="space-y-4">
              <div className="bg-muted relative h-[450px] overflow-hidden rounded-2xl border">
                {hasImages ? (
                  <>
                    <Image
                      src={images[activeImageIndex]}
                      alt={`${property.title} - Image ${activeImageIndex + 1}`}
                      fill
                      className="object-cover transition-opacity duration-500"
                      priority
                    />

                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                          }
                          className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-md transition-all hover:bg-black/50"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() =>
                            setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                          }
                          className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-md transition-all hover:bg-black/50"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>

                        <div className="absolute right-4 bottom-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                          {activeImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground flex h-full flex-col items-center justify-center italic">
                    <ImageIcon className="mb-2 h-12 w-12 opacity-20" />
                    <p>No images available for this property</p>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeImageIndex === idx
                        ? 'scale-95 border-amber-500 shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                    >
                      <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title and Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="mb-2 text-2xl">{property.title}</CardTitle>
                    <p className="text-muted-foreground">{property.address}</p>
                  </div>
                  <Badge className={getStatusColor(property.status)}>
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-border grid grid-cols-3 gap-4 border-y py-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Bedrooms</p>
                    <p className="text-lg font-bold">{property.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Bathrooms</p>
                    <p className="text-lg font-bold">{property.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Furnished</p>
                    <p className="text-lg font-bold">{property.furnished ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-bold">Description</h3>
                  <p className="text-muted-foreground text-sm">{property.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2">
                        <div className="bg-primary h-2 w-2 rounded-full" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rules */}
            {property.rules && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Home Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(Array.isArray(property.rules)
                      ? property.rules
                      : property.rules.split(',').map((r) => r.trim())
                    )
                      .filter(Boolean)
                      .map((rule) => (
                        <li key={rule} className="text-muted-foreground flex gap-2 text-sm">
                          <span className="text-primary">•</span>
                          {rule}
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <PropertyReviews propertyId={property.id} user={user} />
          </div>

          {/* Right - Sidebar */}
          <div>
            <Card className="sticky top-32">
              <CardHeader>
                <div className="text-primary text-3xl font-bold">
                  {formatCurrency(property.price_per_month, 'en-PH', 'PHP')}
                </div>
                <p className="text-muted-foreground text-sm">per month</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Logged-in student */}
                {user?.user_metadata?.user_type === 'student' && (
                  <>
                    <Button
                      className="w-full bg-amber-500 text-white hover:bg-amber-600"
                      disabled={property.status !== 'available'}
                      onClick={() => setShowMessage(true)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {property.status === 'available' ? 'Send a Message' : 'Not Available'}
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Save Property
                    </Button>
                  </>
                )}

                {/* Guest — Airbnb-style invite panel */}
                {!user && (
                  <div className="space-y-3">
                    <div className="pb-1 text-center">
                      <p className="text-foreground text-sm font-bold">Interested in this place?</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Create a free account to:
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {[
                        { icon: MessageCircle, text: 'Message the landlord directly' },
                        { icon: Bookmark, text: 'Save listings you love' },
                        { icon: Bell, text: 'Get notified when available' },
                      ].map(({ icon: _Icon, text }) => (
                        <li
                          key={text}
                          className="text-muted-foreground flex items-center gap-2 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          {text}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="w-full bg-amber-500 font-semibold text-white hover:bg-amber-600"
                    >
                      <Link href="/">
                        Get started — it&apos;s free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <p className="text-muted-foreground text-center text-xs">
                      Already have an account?{' '}
                      <Link
                        href="/"
                        className="font-medium text-amber-500 underline-offset-4 hover:text-amber-600 hover:underline"
                      >
                        Log in
                      </Link>
                    </p>
                  </div>
                )}

                {/* Landlord */}
                {user?.user_metadata?.user_type === 'landlord' && (
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/landlord/properties/${property.id}/edit`}>Edit Listing</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Message Dialog */}
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
