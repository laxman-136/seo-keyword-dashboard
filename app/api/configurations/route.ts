// app/api/configurations/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  getConfigurations, 
  saveConfiguration, 
  deleteConfiguration, 
  setActiveConfiguration 
} from '@/lib/configurations-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Restrict configuration access to admin roles (superadmin, admin, ceo)
    if (!['superadmin', 'admin', 'ceo'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const configs = await getConfigurations()
    return NextResponse.json({ configs })
  } catch (err: any) {
    console.error('Catch handler in configs GET:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin', 'ceo'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, config, label } = body

    if (action === 'save') {
      if (!config || !config.label) {
        return NextResponse.json({ error: 'Config content and label are required' }, { status: 400 })
      }
      await saveConfiguration(config, user.email)
      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      if (!label) {
        return NextResponse.json({ error: 'Label is required for deletion' }, { status: 400 })
      }
      await deleteConfiguration(label)
      return NextResponse.json({ success: true })
    }

    if (action === 'activate') {
      // label can be null to clear active config
      await setActiveConfiguration(label || null)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 })
  } catch (err: any) {
    console.error('Catch handler in configs POST:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
