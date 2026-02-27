'use client'

import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { Trash2, MessageSquare, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Property {
  id: string
  title: string
  price_per_month: number
  status: 'available' | 'reserved' | 'taken'
  address: string
  created_at: string
}

interface LandlordDashboardProps {
  user: User
  initialProperties: Property[]
}

export default function LandlordDashboard({
  user: _user,
  initialProperties,
}: LandlordDashboardProps) {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('properties').delete().eq('id', id)

      if (error) throw error

      setProperties((prev) => prev.filter((p) => p.id !== id))
      router.refresh()
    } catch (error) {
      console.error('Error deleting property:', error)
      alert('Failed to delete property. Please try again.')
    } finally {
      setIsDeleting(null)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available',
          dot: 'bg-emerald-500',
          pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
        }
      case 'reserved':
        return {
          label: 'Reserved',
          dot: 'bg-amber-500',
          pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
        }
      case 'taken':
        return {
          label: 'Taken',
          dot: 'bg-red-500',
          pill: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
        }
      default:
        return { label: status, dot: 'bg-muted', pill: 'bg-muted text-muted-foreground' }
    }
  }

  const availableCount = properties.filter((p) => p.status === 'available').length
  const totalCount = properties.length

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground mt-1">Manage your properties and inquiries</p>
        </div>
        <Button asChild className="bg-amber-500 font-semibold text-white hover:bg-amber-600">
          <Link href="/landlord/properties/new">+ Add Listing</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">{availableCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-500">
              {totalCount - availableCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="border-border mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-amber-50 dark:bg-amber-950/40">
                <span className="text-3xl">🏠</span>
              </div>
              <p className="text-foreground font-bold">No listings yet</p>
              <p className="text-muted-foreground mt-1 mb-4 text-sm">
                Add your first rental property to get started
              </p>
              <Button asChild className="bg-amber-500 text-white hover:bg-amber-600">
                <Link href="/landlord/properties/new">Create Your First Listing</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((property) => {
                const s = getStatusConfig(property.status)
                return (
                  <div
                    key={property.id}
                    className="border-border hover:bg-muted/40 flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">{property.title}</h3>
                      <p className="text-muted-foreground mt-0.5 truncate text-sm">
                        {property.address}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.pill}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                        <span className="text-sm font-bold text-amber-500">
                          ${property.price_per_month?.toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                        <Link href={`/landlord/properties/${property.id}/messages`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Messages
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/landlord/properties/${property.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            disabled={isDeleting === property.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{property.title}" and remove all related data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(property.id)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Delete Listing
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
