import { NextRequest, NextResponse } from 'next/server'
import { getTasks, createTask } from '@/lib/odooModule'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const result = await getTasks({
      project_id: searchParams.get('project_id') ? Number(searchParams.get('project_id')) : undefined,
      stage_id: searchParams.get('stage_id') ? Number(searchParams.get('stage_id')) : undefined,
      user_id: searchParams.get('user_id') ? Number(searchParams.get('user_id')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await createTask(body)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
