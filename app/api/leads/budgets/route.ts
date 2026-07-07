// app/api/leads/budgets/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabase) {
      return NextResponse.json({ budgets: [] })
    }

    const { data, error } = await supabase
      .from('channel_budgets')
      .select('*')
      .order('month', { ascending: false })

    if (error) {
      // If table doesn't exist yet, return empty list instead of crashing
      if (error.code === 'P0001' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return NextResponse.json({ budgets: [], warning: 'Database table channel_budgets does not exist yet. Please run the SQL migration.' })
      }
      throw error
    }

    return NextResponse.json({ budgets: data || [] })
  } catch (error: any) {
    console.error('Leads Budgets GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection missing' }, { status: 500 })
    }

    const body = await request.json()
    const { month, channel, budget } = body

    if (!month || !channel || budget === undefined) {
      return NextResponse.json({ error: 'Missing month, channel, or budget' }, { status: 400 })
    }

    const numBudget = parseFloat(String(budget))
    if (isNaN(numBudget)) {
      return NextResponse.json({ error: 'Budget must be a valid number' }, { status: 400 })
    }

    // Upsert budget on month + channel conflict
    const { data, error } = await supabase
      .from('channel_budgets')
      .upsert(
        {
          month,
          channel,
          budget: numBudget,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'month,channel' }
      )
      .select()

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return NextResponse.json({ error: 'Database table channel_budgets does not exist. Please run the SQL migration in Supabase first.' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true, budget: data?.[0] || null })
  } catch (error: any) {
    console.error('Leads Budgets POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
