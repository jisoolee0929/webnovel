export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import ReviewPageClient from '@/components/reviews/ReviewPageClient'

export default async function ReviewsPage() {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .order('updated_at', { ascending: false })

  return <ReviewPageClient initialReviews={reviews ?? []} />
}
