import { NextResponse } from 'next/server'
import { getSummary } from '@/lib/odooModule'

export async function GET() {
  try {
    const data = await getSummary()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
