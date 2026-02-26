'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'

// SVG for a filled/unfilled star to avoid massive imports
function StarIcon({
  filled,
  onClick,
  className = '',
}: {
  filled: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      className={`h-5 w-5 ${filled ? 'text-amber-500' : 'text-muted-foreground'} ${onClick ? 'cursor-pointer transition-transform hover:scale-110' : ''} ${className}`}
      onClick={onClick}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
      />
    </svg>
  )
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  user_id: string
}

interface PropertyReviewsProps {
  propertyId: string
  user: User | null
}

export default function PropertyReviews({ propertyId, user }: PropertyReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  // Submit state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasReviewed = reviews.some((r) => r.user_id === user?.id)

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId])

  const fetchReviews = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setReviews(data)
    } else if (error) {
      // Supress if table doesn't exist yet for smooth UX during dev
      if (error.code !== '42P01') {
        console.error('Error fetching reviews', error)
      }
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (rating === 0) {
      alert('Please select a star rating first.')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').insert({
      property_id: propertyId,
      user_id: user.id,
      rating: rating,
      comment: comment || null,
    })

    if (error) {
      alert('Failed to post review. You may have already reviewed this property.')
      console.error(error)
    } else {
      setRating(0)
      setComment('')
      fetchReviews()
    }
    setIsSubmitting(false)
  }

  const avgRating =
    reviews.length > 0
      ? Number((reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1))
      : 0

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            {avgRating > 0 ? `${avgRating} · ${reviews.length} Reviews` : 'No reviews yet'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review List */}
        {loading ? (
          <div className="text-muted-foreground animate-pulse text-sm">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-muted-foreground text-sm">Be the first to leave a review!</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="border-border/50 border-b pb-4 last:border-0 last:pb-0">
                <div className="mb-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <StarIcon key={s} filled={s <= rev.rating} className="h-3 w-3" />
                  ))}
                  <span className="text-muted-foreground ml-2 text-xs">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                {rev.comment && <p className="text-foreground text-sm">{rev.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Submit Review */}
        {user && user.user_metadata?.user_type === 'student' && !hasReviewed && (
          <div className="bg-muted/30 border-border mt-4 rounded-xl border p-4">
            <h4 className="mb-3 text-sm font-semibold">Leave a Review</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onClick={() => setRating(star)}
                  >
                    <StarIcon
                      filled={star <= (hoverRating || rating)}
                      onClick={() => {}}
                      className="h-6 w-6"
                    />
                  </div>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience (optional)"
                className="bg-background resize-none text-sm"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="bg-amber-500 font-semibold text-white hover:bg-amber-600"
              >
                {isSubmitting ? 'Posting...' : 'Post Review'}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
