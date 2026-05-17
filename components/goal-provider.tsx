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
}

interface GoalContextType {
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  adjustAmount: (id: string, amount: number) => void
  globalAddMoney: (amount: number) => void
  globalDeductMoney: (amount: number) => void
  getTotalBalance: () => number
  togglePin: (id: string) => void
  reorderPinned: (id: string, direction: 'up' | 'down') => void
}

const GoalContext = createContext<GoalContextType | undefined>(undefined)

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load goals from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('goals')
    if (stored) {
      try {
        setGoals(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored goals:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save goals to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('goals', JSON.stringify(goals))
    }
  }, [goals, isLoaded])

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
  const globalAddMoney = (amount: number) => {
    if (amount <= 0) return

    setGoals(prev => {
      // Separate pinned and unpinned incomplete goals
      const pinnedIncomplete = prev
        .filter(g => g.isPinned && g.current < g.target)
        .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0))
      
      const unpinnedIncomplete = prev
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
      } else if (remaining > 0 && prev.length > 0) {
        // If no incomplete goals, add to any goal
        const anyGoal = prev[0]
        updatedGoals.set(anyGoal.id, {
          ...anyGoal,
          current: anyGoal.current + remaining
        })
      }

      return prev.map(g => updatedGoals.get(g.id) || g)
    })
  }

  // Global deduct money - removes from most recently funded active goal
  const globalDeductMoney = (amount: number) => {
    if (amount <= 0) return

    setGoals(prev => {
      // Sort by target (descending) - most expensive first for deduction
      const sortedByTarget = [...prev].sort((a, b) => b.target - a.target)
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
