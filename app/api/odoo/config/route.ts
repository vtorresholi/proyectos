import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/odooModule'

export async function GET() {
  try {
    const data = await getConfig()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
