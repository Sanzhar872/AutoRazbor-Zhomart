export interface CarMake {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export interface CarModel {
  id: string
  name: string
  slug: string
  make_id: string
}

export interface CarGeneration {
  id: string
  name: string
  year_from: number | null
  year_to: number | null
  model_id: string
  model_name?: string
  make_name?: string
}
