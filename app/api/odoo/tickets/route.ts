import { NextRequest, NextResponse } from 'next/server'
import { getTickets, createTicket } from '@/lib/odooModule'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const result = await getTickets({
      stage: searchParams.get('stage') ?? undefined,
      team_id: searchParams.get('team_id') ? Number(searchParams.get('team_id')) : undefined,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err), tickets: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await createTicket(body)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
