'use client'

import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useState } from 'react'
import MessageDialog from '@/components/message-dialog'
import { CheckCircle2, MessageCircle, Bookmark, Bell, ArrowRight } from 'lucide-react'
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
          ← Back to listings
        </Link>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left - Main Content */}
          <div className="space-y-6 md:col-span-2">
            {/* Images */}
            <div className="bg-muted flex h-96 items-center justify-center rounded-lg">
              <div className="text-center">
                <p className="text-muted-foreground">Property images go here</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {(property.property_images || property.images)?.length || 0} photos available
                </p>
              </div>
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
                  <CardTitle>House Rules</CardTitle>
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
                      {property.status === 'available' ? 'Message Landlord' : 'Not Available'}
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
                      <Link href="/auth/signup">
                        Get started — it&apos;s free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <p className="text-muted-foreground text-center text-xs">
                      Already have an account?{' '}
                      <Link
                        href="/auth/login"
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
