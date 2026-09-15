export const onRequestGet = () =>
  Response.json({
    ok: true,
    service: 'benimbakicim',
    time: new Date().toISOString()
  })
