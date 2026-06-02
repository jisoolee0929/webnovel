export type Review = {
  id: number
  platform: string
  title: string
  read_start_date: string | null
  read_end_date: string | null
  rating: number | null
  short_review: string | null
  created_at: string
  updated_at: string
}

export type ReviewFormData = {
  platform: string
  title: string
  read_start_date: string
  read_end_date: string
  rating: number
  short_review: string
}
