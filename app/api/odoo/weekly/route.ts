import { NextRequest, NextResponse } from 'next/server'
import { getWeekly } from '@/lib/odooModule'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const data = await getWeekly(
      searchParams.get('date_from') ?? undefined,
      searchParams.get('date_to') ?? undefined
    )
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
