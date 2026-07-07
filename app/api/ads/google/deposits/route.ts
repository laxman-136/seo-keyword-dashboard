// app/api/ads/google/deposits/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const { data, error } = await supabase
      .from('google_ads_deposits')
      .select('*')
      .order('deposit_date', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (err: any) {
    console.error('Failed to fetch deposits:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { deposit_date, amount, type, notes } = body

    if (!deposit_date || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields: deposit_date, amount' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('google_ads_deposits')
      .insert([{
        deposit_date,
        amount: Number(amount),
        type: type || 'top-up',
        notes: notes || ''
      }])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data: data?.[0] })
  } catch (err: any) {
    console.error('Failed to create deposit:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing deposit ID parameter' }, { status: 400 })
    }

    const { error } = await supabase
      .from('google_ads_deposits')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Failed to delete deposit:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
