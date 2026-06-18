import { NextRequest, NextResponse } from 'next/server'
import { getTimesheets, logTimesheet } from '@/lib/odooModule'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const data = await getTimesheets({
      project_id: searchParams.get('project_id') ? Number(searchParams.get('project_id')) : undefined,
      user_id: searchParams.get('user_id') ? Number(searchParams.get('user_id')) : undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await logTimesheet(body)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
