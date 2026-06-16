export type Pagination = {
  page: number
  limit: number
  total: number
}

export type PaginatedResult<T> = {
  data: T[]
  pagination: Pagination
}

export type JwtPayload = {
  sub: string
  email: string
  role: string
  brigadeId?: string
}

export type Role = 'BRIGADE' | 'IGT' | 'ADMIN'



