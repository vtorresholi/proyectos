import { NextRequest, NextResponse } from 'next/server'
import { searchRead, create, write } from '@/lib/odoo'
import type { OdooTask } from '@/lib/types'

const FIELDS = [
  'id', 'name', 'project_id', 'user_ids', 'stage_id',
  'date_deadline', 'planned_hours', 'effective_hours',
  'priority', 'tag_ids', 'kanban_state', 'write_date', 'description',
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('project_id')
    const domain: unknown[] = [['active', '=', true]]
    if (projectId) domain.push(['project_id', '=', Number(projectId)])

    const tasks = await searchRead<OdooTask>('project.task', domain, FIELDS, {
      order: 'priority desc, date_deadline asc',
      limit: 200,
    })
    return NextResponse.json({ tasks })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = await create('project.task', {
      name: body.name,
      project_id: body.project_id,
      user_ids: body.user_ids ? [[6, 0, body.user_ids]] : false,
      date_deadline: body.date_deadline || false,
      planned_hours: body.planned_hours || 0,
      priority: body.priority || '0',
      description: body.description || false,
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
    if (vals.user_ids) vals.user_ids = [[6, 0, vals.user_ids]]
    await write('project.task', [id], vals)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
