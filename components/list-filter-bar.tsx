'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GoalSection } from '@/components/goal-provider'
import { GoalSectionFilter } from '@/components/views'

interface ListFilterBarProps {
  sections: GoalSection[]
  sectionFilter: GoalSectionFilter
  onSectionFilterChange: (filter: GoalSectionFilter) => void
  onDeleteSection: (id: string) => void
}

export function ListFilterBar({
  sections,
  sectionFilter,
  onSectionFilterChange,
  onDeleteSection,
}: ListFilterBarProps) {
  const [sectionPendingDeletion, setSectionPendingDeletion] = useState<GoalSection | null>(null)
  const filters: { id: GoalSectionFilter; name: string }[] = [
    { id: null, name: 'All' },
    { id: 'unsorted', name: 'Unsorted' },
    ...sections.map(section => ({ id: section.id, name: section.name })),
  ]

  const handleDeleteSection = () => {
    if (!sectionPendingDeletion) return

    onDeleteSection(sectionPendingDeletion.id)
    if (sectionFilter === sectionPendingDeletion.id) {
      onSectionFilterChange(null)
    }
    setSectionPendingDeletion(null)
  }

  return (
    <>
      {sections.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter goals by list">
          {filters.map(item => {
            const isSection = item.id !== null && item.id !== 'unsorted'
            const isSelected = sectionFilter === item.id
            const filterButtonClassName = `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? 'border-success/40 bg-success/15 text-success'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`

            if (!isSection) {
              return (
                <button
                  key={item.id ?? 'all'}
                  type="button"
                  onClick={() => onSectionFilterChange(item.id)}
                  aria-pressed={isSelected}
                  className={filterButtonClassName}
                >
                  {item.name}
                </button>
              )
            }

            return (
              <div
                key={item.id}
                className={`flex shrink-0 items-center overflow-hidden rounded-full border transition-colors ${
                  isSelected
                    ? 'border-success/40 bg-success/15'
                    : 'border-border bg-card'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSectionFilterChange(item.id)}
                  aria-pressed={isSelected}
                  className={`max-w-36 truncate px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected ? 'text-success' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.name}
                </button>
                <button
                  type="button"
                  aria-label={`Delete list ${item.name}`}
                  onClick={() => setSectionPendingDeletion(sections.find(section => section.id === item.id) ?? null)}
                  className="flex size-10 shrink-0 items-center justify-center border-l border-border/70 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <AlertDialog
        open={sectionPendingDeletion !== null}
        onOpenChange={open => {
          if (!open) setSectionPendingDeletion(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{sectionPendingDeletion?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This list will be deleted. Its goals will remain and move to Unsorted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete list
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
