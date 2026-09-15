const ALLOWED_FIELDS = [
  'form-name',
  'name',
  'phone',
  'email',
  'service',
  'work_type',
  'district',
  'start_date',
  'message',
  'budget',
  'package',
  'kvkk',
  'page'
]

const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  })

export const onRequestOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })

export const onRequestPost = async ({ request, env }) => {
  let raw = {}

  const contentType = request.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      raw = await request.json()
    } else {
      const form = await request.formData()
      raw = Object.fromEntries(form.entries())
    }
  } catch {
    return json({ ok: false, error: 'Gecersiz form verisi' }, 400)
  }

  if (String(raw['bot-field'] || '').trim()) {
    return json({ ok: true })
  }

  const payload = {}
  for (const key of ALLOWED_FIELDS) {
    const value = raw[key]
    if (value != null && String(value).trim() !== '') {
      payload[key] = String(value).slice(0, 2000)
    }
  }

  const name = payload.name?.trim() || ''
  const phone = payload.phone?.trim() || ''
  if (name.length < 2 || phone.length < 7) {
    return json({ ok: false, error: 'Ad ve telefon zorunludur' }, 400)
  }

  payload.receivedAt = new Date().toISOString()
  payload.source = 'cloudflare-pages'

  let stored = false
  let notified = false

  if (env.FORMS) {
    const id = `${Date.now()}-${crypto.randomUUID()}`
    await env.FORMS.put(`form:${id}`, JSON.stringify(payload), {
      metadata: {
        form: payload['form-name'] || 'talep'
      }
    })
    stored = true
  }

  if (env.NOTIFY_WEBHOOK_URL) {
    const notifyResponse = await fetch(env.NOTIFY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    notified = notifyResponse.ok
  }

  return json({ ok: true, stored, notified })
}
