declare module 'virtual:technical-breakdowns' {
  export type TechnicalBreakdown = {
    slug: string
    title: string
    description: string
    date: string
    cover: string | null
    body: string
    assets: Record<string, string>
  }
  const breakdowns: TechnicalBreakdown[]
  export default breakdowns
}
