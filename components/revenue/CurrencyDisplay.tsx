// components/revenue/CurrencyDisplay.tsx
import React from 'react'
import { formatCurrency } from '@/lib/sheets'

interface CurrencyDisplayProps {
  value: number
}

export default function CurrencyDisplay({ value }: CurrencyDisplayProps) {
  return <span>{formatCurrency(value)}</span>
}
