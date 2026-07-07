// components/tables/KeywordsTable.tsx
'use client';

import React, { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProcessedKeyword, PageBand, Movement } from '@/lib/types'
import GroupBadge from '../ui/GroupBadge'
import PageBandBadge from '../ui/PageBandBadge'
import MovementBadge from '../ui/MovementBadge'
import { cn } from '@/lib/utils'

interface KeywordsTableProps {
  keywords: ProcessedKeyword[]
  groups: string[]
}

type SortField = 'keyword' | 'group' | 'rank' | 'movement' | 'searchVolume' | 'competition'
type SortOrder = 'asc' | 'desc'

export default function KeywordsTable({ keywords, groups }: KeywordsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedBand, setSelectedBand] = useState('')
  const [selectedMovement, setSelectedMovement] = useState('')

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const bands: PageBand[] = [
    'P1 Top (1-4)',
    'P1 Good (5-10)',
    'Page 2',
    'Page 3',
    'Page 4+',
    'Not Ranking'
  ]

  const movements: Movement[] = [
    'Improved',
    'Neutral',
    'Dropped',
    'New Entry',
    'Lost Ranking'
  ]

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  // Filter and sort keywords
  const processedData = useMemo(() => {
    const filtered = keywords.filter(kw => {
      const matchesSearch = kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGroup = !selectedGroup || kw.group === selectedGroup
      const matchesBand = !selectedBand || kw.pageBand === selectedBand
      const matchesMovement = !selectedMovement || kw.movement === selectedMovement
      return matchesSearch && matchesGroup && matchesBand && matchesMovement
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      if (sortField === 'keyword') {
        comparison = a.keyword.localeCompare(b.keyword)
      } else if (sortField === 'group') {
        comparison = a.group.localeCompare(b.group)
      } else if (sortField === 'rank') {
        // We want to sort ranking keywords first, then not ranking
        const getRankScore = (page: number, pos: number) => {
          if (page === 0) return 999999 // Put at the bottom
          return page * 100 + pos
        }
        comparison = getRankScore(a.currentPage, a.currentPosition) - getRankScore(b.currentPage, b.currentPosition)
      } else if (sortField === 'movement') {
        comparison = a.movement.localeCompare(b.movement)
      } else if (sortField === 'searchVolume') {
        comparison = (a.searchVolume || 0) - (b.searchVolume || 0)
      } else if (sortField === 'competition') {
        comparison = (a.competition || '').localeCompare(b.competition || '')
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [keywords, searchTerm, selectedGroup, selectedBand, selectedMovement, sortField, sortOrder])

  // Pagination calculation
  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return processedData.slice(start, start + itemsPerPage)
  }, [processedData, currentPage])

  // Reset page when filters change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  // Status color badges
  const StatusBadge = ({ status }: { status: string }) => {
    const isGood = status === 'Ranking Well'
    const isNeeds = status === 'Needs Work'

    return (
      <span className={cn(
        "px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase inline-block text-center shadow-sm",
        isGood ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        isNeeds ? 'bg-amber-50 text-amber-700 border-amber-200' :
        'bg-slate-50 text-slate-500 border-slate-200'
      )}>
        {status}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Filtering panel */}
      <div className="p-3 sm:p-4 lg:p-6 border-b border-slate-100 space-y-3 sm:space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 sm:gap-2">
            <SlidersHorizontal className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400 flex-shrink-0" />
            Search Keywords
          </h3>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
            {processedData.length} of {keywords.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              placeholder="Search keywords..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/50"
            />
          </div>

          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => handleFilterChange(setSelectedGroup, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/50 text-slate-600"
          >
            <option value="">All Groups (13 Courses)</option>
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Band Filter */}
          <select
            value={selectedBand}
            onChange={(e) => handleFilterChange(setSelectedBand, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/50 text-slate-600"
          >
            <option value="">All Page Bands</option>
            {bands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Movement Filter */}
          <select
            value={selectedMovement}
            onChange={(e) => handleFilterChange(setSelectedMovement, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50/50 text-slate-600"
          >
            <option value="">All Movements</option>
            {movements.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile cards view */}
      <div className="space-y-2 sm:hidden p-3">
        {paginatedData.length > 0 ? (
          paginatedData.map((kw) => (
            <div key={kw.keyword} className="bg-slate-50 rounded-2xl border border-slate-200 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Keyword</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-900 truncate">{kw.keyword}</p>
                </div>
                <PageBandBadge band={kw.pageBand} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-slate-400">Group</p>
                  <p className="mt-0.5 font-medium text-slate-800 truncate">{kw.group}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-slate-400">Rank</p>
                  <p className="mt-0.5 font-medium text-slate-800">
                    {kw.currentPage > 0 ? `P${kw.currentPage} #${kw.currentPosition}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-slate-400">Volume</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {kw.searchVolume !== undefined ? kw.searchVolume.toLocaleString('en-IN') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-slate-400">Comp</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {kw.competition || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Movement</p>
                  <div className="mt-1">
                    <MovementBadge movement={kw.movement} label={kw.vsLastMonthLabel} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={kw.status} />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500 text-sm font-medium">
            No keywords match your selected filter criteria.
          </div>
        )}
      </div>

      {/* Main Table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all text-xs"
                onClick={() => handleSort('keyword')}
              >
                <div className="flex items-center gap-1">
                  Keyword & Group
                  <ArrowUpDown className="w-3 h-3 flex-shrink-0" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all text-xs"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center gap-1">
                  SEO Rank & Visibility
                  <ArrowUpDown className="w-3 h-3 flex-shrink-0" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all text-xs"
                onClick={() => handleSort('searchVolume')}
              >
                <div className="flex items-center gap-1">
                  Search Volume & Comp
                  <ArrowUpDown className="w-3 h-3 flex-shrink-0" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-all text-xs"
                onClick={() => handleSort('movement')}
              >
                <div className="flex items-center gap-1">
                  Movement & Status
                  <ArrowUpDown className="w-3 h-3 flex-shrink-0" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {paginatedData.length > 0 ? (
              paginatedData.map((kw, idx) => (
                <tr 
                  key={kw.keyword} 
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'
                  )}
                >
                  {/* Keyword & Group */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 text-sm select-all">{kw.keyword}</div>
                    <div className="mt-1">
                      <GroupBadge group={kw.group} />
                    </div>
                  </td>

                  {/* SEO Rank & Visibility */}
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-slate-700 text-sm">
                      {kw.currentPage > 0 ? (
                        <span>P{kw.currentPage} <span className="text-slate-400 font-normal">(#{kw.currentPosition})</span></span>
                      ) : (
                        <span className="text-slate-400 font-normal">Not Ranking</span>
                      )}
                    </div>
                    <div className="mt-1">
                      <PageBandBadge band={kw.pageBand} />
                    </div>
                  </td>

                  {/* Search Volume & Comp */}
                  <td className="px-6 py-4 relative group/vol">
                    <div className="font-mono font-bold text-slate-800 text-sm">
                      {kw.searchVolume !== undefined ? (
                        <span className="cursor-help border-b border-dashed border-slate-300 pb-0.5">
                          {kw.searchVolume.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </div>
                    <div className="mt-1">
                      {kw.competition ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase inline-block",
                          kw.competition === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                          kw.competition === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          kw.competition === 'LOW' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        )}>
                          {kw.competition}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </div>

                    {/* Popover Trend Chart */}
                    {kw.monthlySearchVolumes && kw.monthlySearchVolumes.length > 0 && (
                      <div className="absolute z-35 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-950 text-white rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover/vol:opacity-100 transition-all duration-200 w-56 border border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider text-center">
                          12-Month Search Trend
                        </p>
                        <div className="flex items-end justify-between gap-1 h-16 pt-2">
                          {kw.monthlySearchVolumes.map((m, idx) => {
                            const maxVal = Math.max(...kw.monthlySearchVolumes!.map(v => v.volume), 1)
                            const heightPct = (m.volume / maxVal) * 100
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center group/bar">
                                <div 
                                  className="w-full bg-emerald-500 rounded-t-sm hover:bg-emerald-400 transition-all" 
                                  style={{ height: `${Math.max(4, heightPct)}%` }}
                                />
                                <div className="absolute bottom-full mb-1 bg-slate-900 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded opacity-0 pointer-events-none group-hover/bar:opacity-100 whitespace-nowrap z-40 text-center">
                                  {m.month.substring(0,3)} {m.year}: {m.volume}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Movement & Status */}
                  <td className="px-6 py-4">
                    <div>
                      <MovementBadge movement={kw.movement} label={kw.vsLastMonthLabel} />
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={kw.status} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-400 font-medium bg-slate-50/10 text-sm">
                  No keywords match your selected filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination panel */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between no-print bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-700">{currentPage}</span> of <span className="font-semibold text-slate-700">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-500 hover:text-slate-700 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-500 hover:text-slate-700 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
