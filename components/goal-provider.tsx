'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface Goal {
  id: string
  name: string
  current: number
  target: number
  image?: string
  createdAt: number
  completedAt?: number
  isPinned?: boolean
  pinOrder?: number
  sectionId?: string
}

export interface GoalSection {
  id: string
  name: string
  createdAt: number
}

interface GoalContextType {
  goals: Goal[]
  sections: GoalSection[]
  addSection: (name: string) => string

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  adjustAmount: (id: string, amount: number) => void
  globalAddMoney: (amount: number, scopeIds?: string[]) => void
  globalDeductMoney: (amount: number, scopeIds?: string[]) => void
  getTotalBalance: () => number
  togglePin: (id: string) => void
  reorderPinned: (id: string, direction: 'up' | 'down') => void
}

const GoalContext = createContext<GoalContextType | undefined>(undefined)

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [sections, setSections] = useState<GoalSection[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const storedGoals = localStorage.getItem('goals')
      const storedSections = localStorage.getItem('goal-sections')
      if (storedGoals) setGoals(JSON.parse(storedGoals))
      if (storedSections) setSections(JSON.parse(storedSections))
    } catch (error) {
      console.error('Failed to load saved goals or lists:', error)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem('goals', JSON.stringify(goals))
    localStorage.setItem('goal-sections', JSON.stringify(sections))
  }, [goals, sections, isLoaded])

  const addSection = (name: string) => {
    const section: GoalSection = {
      id: uuidv4(),
      name: name.trim(),
      createdAt: Date.now(),
    }
    setSections(previous => [...previous, section])
    return section.id
  }

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: uuidv4(),
      createdAt: Date.now(),
    }
    setGoals(prev => [...prev, newGoal])
  }

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev =>
      prev.map(goal => {
        if (goal.id !== id) return goal
        const updated = { ...goal, ...updates }
        // Check if goal just completed
        if (updated.current >= updated.target && !goal.completedAt) {
          updated.completedAt = Date.now()
        }
        // If current goes below target, remove completed status
        if (updated.current < updated.target && goal.completedAt) {
          updated.completedAt = undefined
        }
        return updated
      })
    )
  }

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id))
  }

  const adjustAmount = (id: string, amount: number) => {
    setGoals(prev =>
      prev.map(goal => {
        if (goal.id !== id) return goal
        const newCurrent = Math.max(0, goal.current + amount)
        const updated = { ...goal, current: newCurrent }
        // Check if goal just completed
        if (newCurrent >= goal.target && !goal.completedAt) {
          updated.completedAt = Date.now()
        }
        // If current goes below target, remove completed status
        if (newCurrent < goal.target && goal.completedAt) {
          updated.completedAt = undefined
        }
        return updated
      })
    )
  }

  // Toggle pin status
  const togglePin = (id: string) => {
    setGoals(prev => {
      const goal = prev.find(g => g.id === id)
      if (!goal) return prev

      if (goal.isPinned) {
        // Unpinning - remove pinOrder and shift others
        return prev.map(g => {
          if (g.id === id) {
            return { ...g, isPinned: false, pinOrder: undefined }
          }
          if (g.isPinned && g.pinOrder !== undefined && goal.pinOrder !== undefined && g.pinOrder > goal.pinOrder) {
            return { ...g, pinOrder: g.pinOrder - 1 }
          }
          return g
        })
      } else {
        // Pinning - add to end of pinned list
        const maxPinOrder = prev.filter(g => g.isPinned).reduce((max, g) => Math.max(max, g.pinOrder ?? 0), -1)
        return prev.map(g => {
          if (g.id === id) {
            return { ...g, isPinned: true, pinOrder: maxPinOrder + 1 }
          }
          return g
        })
      }
    })
  }

  // Reorder pinned goals
  const reorderPinned = (id: string, direction: 'up' | 'down') => {
    setGoals(prev => {
      const goal = prev.find(g => g.id === id)
      if (!goal || !goal.isPinned || goal.pinOrder === undefined) return prev

      const pinnedGoals = prev.filter(g => g.isPinned).sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0))
      const currentIndex = pinnedGoals.findIndex(g => g.id === id)
      
      if (direction === 'up' && currentIndex === 0) return prev
      if (direction === 'down' && currentIndex === pinnedGoals.length - 1) return prev

      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const swapGoal = pinnedGoals[swapIndex]
      if (!swapGoal) return prev

      return prev.map(g => {
        if (g.id === id) {
          return { ...g, pinOrder: swapGoal.pinOrder }
        }
        if (g.id === swapGoal.id) {
          return { ...g, pinOrder: goal.pinOrder }
        }
        return g
      })
    })
  }

  // Get total balance across all goals
  const getTotalBalance = () => {
    return goals.reduce((sum, g) => sum + g.current, 0)
  }

  // Global add money - prioritizes pinned incomplete goals first, then closest to completion
  const globalAddMoney = (amount: number, scopeIds?: string[]) => {
    if (!Number.isFinite(amount) || amount <= 0) return
    const scope = scopeIds ? new Set(scopeIds) : null

    setGoals(prev => {
      const scopedGoals = scope ? prev.filter(goal => scope.has(goal.id)) : prev
      const pinnedIncomplete = scopedGoals
        .filter(g => g.isPinned && g.current < g.target)
        .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0))
      
      const unpinnedIncomplete = scopedGoals
        .filter(g => !g.isPinned && g.current < g.target)
        .sort((a, b) => {
          // Sort by proximity to completion (highest percentage first)
          const aPercent = a.current / a.target
          const bPercent = b.current / b.target
          return bPercent - aPercent
        })

      // Combined priority order: pinned first, then unpinned sorted by completion proximity
      const priorityOrder = [...pinnedIncomplete, ...unpinnedIncomplete]

      let remaining = amount
      const updatedGoals = new Map<string, Goal>()

      // Distribute money according to priority
      for (const goal of priorityOrder) {
        if (remaining <= 0) break
        
        const spaceAvailable = goal.target - goal.current
        const toAdd = Math.min(remaining, spaceAvailable)
        
        if (toAdd > 0) {
          const newCurrent = goal.current + toAdd
          const updated = { 
            ...goal, 
            current: newCurrent,
            completedAt: newCurrent >= goal.target ? Date.now() : goal.completedAt
          }
          updatedGoals.set(goal.id, updated)
          remaining -= toAdd
        }
      }

      // If there's still remaining money and all goals are complete,
      // add overflow to the last goal in priority order
      if (remaining > 0 && priorityOrder.length > 0) {
        const lastGoal = priorityOrder[priorityOrder.length - 1]
        const existing = updatedGoals.get(lastGoal.id) || lastGoal
        updatedGoals.set(lastGoal.id, {
          ...existing,
          current: existing.current + remaining
        })
      } else if (remaining > 0 && scopedGoals.length > 0) {
        // If no incomplete goals, add overflow within the current list
        const anyGoal = scopedGoals[0]
        updatedGoals.set(anyGoal.id, {
          ...anyGoal,
          current: anyGoal.current + remaining
        })
      }

      return prev.map(g => updatedGoals.get(g.id) || g)
    })
  }

  // Global deduct money - removes from most recently funded active goal
  const globalDeductMoney = (amount: number, scopeIds?: string[]) => {
    if (!Number.isFinite(amount) || amount <= 0) return
    const scope = scopeIds ? new Set(scopeIds) : null

    setGoals(prev => {
      const scopedGoals = scope ? prev.filter(goal => scope.has(goal.id)) : prev
      const sortedByTarget = [...scopedGoals].sort((a, b) => b.target - a.target)
      let remaining = amount
      const updatedGoals = new Map<string, Goal>()

      // Deduct money from goals with funds, starting from most expensive
      for (const goal of sortedByTarget) {
        if (remaining <= 0) break
        if (goal.current <= 0) continue

        const toDeduct = Math.min(remaining, goal.current)
        
        if (toDeduct > 0) {
          const newCurrent = goal.current - toDeduct
          const updated = { 
            ...goal, 
            current: newCurrent,
            completedAt: newCurrent < goal.target ? undefined : goal.completedAt
          }
          updatedGoals.set(goal.id, updated)
          remaining -= toDeduct
        }
      }

      return prev.map(g => updatedGoals.get(g.id) || g)
    })
  }

  return (
    <GoalContext.Provider value={{ 
      goals,
      sections,
      addSection,
      addGoal, 
      updateGoal, 
      deleteGoal, 
      adjustAmount,
      globalAddMoney,
      globalDeductMoney,
      getTotalBalance,
      togglePin,
      reorderPinned
    }}>
      {children}
    </GoalContext.Provider>
  )
}

export function useGoals() {
  const context = useContext(GoalContext)
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider')
  }
  return context
}
