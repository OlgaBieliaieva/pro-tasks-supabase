import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  const { data, error } = await supabaseAdmin.from('tasks').select('*')
  if (error) return Response.json({ error }, { status: 500 })
  return Response.json(data)
}

export async function POST(req) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('tasks').insert(body).select()
  if (error) return Response.json({ error }, { status: 500 })
  return Response.json(data[0])
}
