import { NextResponse } from 'next/server'
import { getUsers } from '@/lib/odooModule'

export async function GET() {
  try {
    const data = await getUsers()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
