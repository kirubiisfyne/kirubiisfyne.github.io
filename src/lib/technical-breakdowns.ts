import breakdowns from 'virtual:technical-breakdowns'

export { breakdowns }

export function breakdownHref(slug: string): string {
  return `${import.meta.env.BASE_URL}game-dev/${slug}/`
}

