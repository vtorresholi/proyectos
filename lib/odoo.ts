const ODOO_URL = process.env.ODOO_URL!
const ODOO_DB = process.env.ODOO_DB!
const ODOO_API_KEY = process.env.ODOO_API_KEY!
const ODOO_LOGIN = process.env.ODOO_LOGIN!

let sessionCache: { uid: number; session_id: string } | null = null

async function authenticate(): Promise<{ uid: number; session_id: string }> {
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
  if (!data.result?.uid) throw new Error(`Odoo auth failed: ${JSON.stringify(data.error)}`)

  const setCookie = res.headers.get('set-cookie') ?? ''
  const sessionMatch = setCookie.match(/session_id=([^;]+)/)
  const session_id = sessionMatch?.[1] ?? ''

  sessionCache = { uid: data.result.uid, session_id }
  setTimeout(() => { sessionCache = null }, 1000 * 60 * 30)
  return sessionCache
}

export async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const { session_id } = await authenticate()

  const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session_id=${session_id}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { model, method, args, kwargs },
    }),
  })

  const data = await res.json()
  if (data.error) throw new Error(`Odoo error: ${JSON.stringify(data.error)}`)
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
