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

  // Toggle pin state for a goal
  const togglePin = (id: string) => {
    setGoals(prev => {
      const goal = prev.find(g => g.id === id)
      if (!goal) return prev

      if (goal.isPinned) {
        // Unpin: remove pinOrder
        return prev.map(g => 
          g.id === id 
            ? { ...g, isPinned: false, pinOrder: undefined }
            : g
        )
      } else {
        // Pin: assign to end of pinned list
        const maxPinOrder = prev
          .filter(g => g.isPinned)
          .reduce((max, g) => Math.max(max, g.pinOrder ?? 0), 0)
        
        return prev.map(g =>
          g.id === id
            ? { ...g, isPinned: true, pinOrder: maxPinOrder + 1 }
            : g
        )
      }
    })
  }

  // Reorder pinned goals
  const reorderPinned = (id: string, direction: 'up' | 'down') => {
    setGoals(prev => {
      const pinnedGoals = prev
        .filter(g => g.isPinned)
        .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0))
      
      const currentIndex = pinnedGoals.findIndex(g => g.id === id)
      if (currentIndex === -1) return prev
      
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= pinnedGoals.length) return prev

      // Swap pinOrder values
      const currentGoal = pinnedGoals[currentIndex]
      const targetGoal = pinnedGoals[targetIndex]
      
      return prev.map(g => {
        if (g.id === currentGoal.id) {
          return { ...g, pinOrder: targetGoal.pinOrder }
        }
        if (g.id === targetGoal.id) {
          return { ...g, pinOrder: currentGoal.pinOrder }
        }
        return g
      })
    })
  }

  // Get total balance across all goals
  const getTotalBalance = () => {
    return goals.reduce((sum, g) => sum + g.current, 0)
  }

  // Global add money - prioritizes pinned goals first, then closest to completion
  const globalAddMoney = (amount: number) => {
    if (amount <= 0 || goals.length === 0) return

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
      
      // Priority order: pinned first, then unpinned by closest to completion
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
      if (remaining > 0) {
        const allGoals = [...pinnedIncomplete, ...unpinnedIncomplete]
        if (allGoals.length === 0) {
          // All goals complete - add to first pinned or most expensive
          const pinnedComplete = prev
            .filter(g => g.isPinned)
            .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0))
          const targetGoal = pinnedComplete[0] || prev.sort((a, b) => b.target - a.target)[0]
          if (targetGoal) {
            const existing = updatedGoals.get(targetGoal.id) || targetGoal
            updatedGoals.set(targetGoal.id, {
              ...existing,
              current: existing.current + remaining
            })
          }
        }
      }

      return prev.map(g => updatedGoals.get(g.id) || g)
    })
  }

  // Global deduct money - removes from most recently funded active goal
  const globalDeductMoney = (amount: number) => {
    if (amount <= 0 || goals.length === 0) return

    setGoals(prev => {
      // Deduct in reverse priority: unpinned first, then pinned
      const unpinnedWithFunds = prev
        .filter(g => !g.isPinned && g.current > 0)
        .sort((a, b) => {
          const aPercent = a.current / a.target
          const bPercent = b.current / b.target
          return aPercent - bPercent // Lowest percentage first for deduction
        })
      
      const pinnedWithFunds = prev
        .filter(g => g.isPinned && g.current > 0)
        .sort((a, b) => (b.pinOrder ?? 0) - (a.pinOrder ?? 0)) // Reverse order for deduction
      
      const deductOrder = [...unpinnedWithFunds, ...pinnedWithFunds]
      
      let remaining = amount
      const updatedGoals = new Map<string, Goal>()

      for (const goal of deductOrder) {
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
      reorderPinned,
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
