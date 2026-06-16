const ODOO_URL = process.env.ODOO_URL!
const ODOO_DB = process.env.ODOO_DB!
const ODOO_API_KEY = process.env.ODOO_API_KEY!
const ODOO_LOGIN = process.env.ODOO_LOGIN!
const ODOO_SESSION_ID = process.env.ODOO_SESSION_ID

let sessionCache: string | null = ODOO_SESSION_ID ?? null

async function getSession(): Promise<string> {
  if (sessionCache) return sessionCache

  const res = await fetch(`${ODOO_URL}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { db: ODOO_DB, login: ODOO_LOGIN, password: ODOO_API_KEY },
    }),
  })

  const data = await res.json()
  if (!data.result?.uid) throw new Error(`Odoo auth failed: ${data.error?.data?.message ?? 'unknown error'}`)

  const setCookie = res.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/session_id=([^;]+)/)
  if (!match) throw new Error('No session_id in response')

  sessionCache = match[1]
  setTimeout(() => { sessionCache = ODOO_SESSION_ID ?? null }, 1000 * 60 * 25)
  return sessionCache!
}

export async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const session = await getSession()

  const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session_id=${session}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { model, method, args, kwargs },
    }),
  })

  const data = await res.json()
  if (data.error) {
    if (data.error.data?.message?.includes('session')) {
      sessionCache = ODOO_SESSION_ID ?? null
      throw new Error('SESSION_EXPIRED')
    }
    throw new Error(`Odoo error: ${data.error.data?.message ?? JSON.stringify(data.error)}`)
  }
  return data.result as T
}

export async function searchRead<T>(
  model: string,
  domain: unknown[] = [],
  fields: string[] = [],
  opts: { limit?: number; offset?: number; order?: string } = {}
): Promise<T[]> {
  return odooCall<T[]>(model, 'search_read', [domain], {
    fields,
    limit: opts.limit ?? 100,
    offset: opts.offset ?? 0,
    order: opts.order ?? 'id desc',
  })
}

export async function create(model: string, vals: Record<string, unknown>): Promise<number> {
  return odooCall<number>(model, 'create', [vals])
}

export async function write(model: string, ids: number[], vals: Record<string, unknown>): Promise<boolean> {
  return odooCall<boolean>(model, 'write', [ids, vals])
}

export async function unlink(model: string, ids: number[]): Promise<boolean> {
  return odooCall<boolean>(model, 'unlink', [ids])
}
