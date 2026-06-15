import { NextResponse } from 'next/server'
import { searchRead } from '@/lib/odoo'
import type { OdooUser } from '@/lib/types'

export async function GET() {
  try {
    const users = await searchRead<OdooUser>(
      'res.users',
      [['active', '=', true], ['share', '=', false]],
      ['id', 'name', 'login', 'email', 'image_128'],
      { order: 'name asc', limit: 100 }
    )
    return NextResponse.json({ users })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
