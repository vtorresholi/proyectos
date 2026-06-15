import { NextRequest, NextResponse } from 'next/server'
import { searchRead, create, write } from '@/lib/odoo'

const TICKET_FIELDS = [
  'id', 'name', 'description', 'user_id', 'partner_id',
  'stage_id', 'priority', 'team_id', 'ticket_type_id',
  'write_date', 'create_date',
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')
    const domain: unknown[] = []
    if (stage) domain.push(['stage_id.name', 'ilike', stage])

    const tickets = await searchRead(
      'helpdesk.ticket',
      domain,
      TICKET_FIELDS,
      { order: 'priority desc, create_date desc', limit: 100 }
    )
    return NextResponse.json({ tickets })
  } catch (err: unknown) {
    const msg = String(err)
    if (msg.includes('helpdesk')) {
      return NextResponse.json({ tickets: [], note: 'Helpdesk module not installed' })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = await create('helpdesk.ticket', {
      name: body.name,
      description: body.description || '',
      user_id: body.user_id || false,
      priority: body.priority || '0',
      team_id: body.team_id || false,
    })
    return NextResponse.json({ id })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...vals } = body
    await write('helpdesk.ticket', [id], vals)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
