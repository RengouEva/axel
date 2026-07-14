export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    status: "ok",
    nodeEnv: process.env.NODE_ENV || "unknown",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "unknown",
  })
}
