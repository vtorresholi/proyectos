import { NextRequest, NextResponse } from 'next/server'
import { searchRead, create, write } from '@/lib/odoo'
import type { OdooProject } from '@/lib/types'

const FIELDS = [
  'id', 'name', 'date_start', 'date', 'user_id', 'partner_id',
  'task_count', 'description', 'color', 'last_update_status',
  'allocated_hours', 'effective_hours',
]

export async function GET() {
  try {
    const projects = await searchRead<OdooProject>(
      'project.project',
      [['active', 'in', [true, false]]],
      FIELDS,
      { order: 'id desc', limit: 50 }
    )
    return NextResponse.json({ projects })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = await create('project.project', {
      name: body.name,
      date_start: body.date_start || false,
      date: body.date || false,
      user_id: body.user_id || false,
      partner_id: body.partner_id || false,
      allocated_hours: body.allocated_hours || 0,
    })
    return NextResponse.json({ id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...vals } = body
    await write('project.project', [id], vals)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
