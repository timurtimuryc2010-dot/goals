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

  // Get total balance across all goals
  const getTotalBalance = () => {
    return goals.reduce((sum, g) => sum + g.current, 0)
  }

  // Global add money - cascades from cheapest incomplete goal upwards
  const globalAddMoney = (amount: number) => {
    if (amount <= 0) return

    setGoals(prev => {
      // Sort by target (ascending) - cheapest first
      const sortedByTarget = [...prev].sort((a, b) => a.target - b.target)
      let remaining = amount
      const updatedGoals = new Map<string, Goal>()

      // Distribute money to incomplete goals starting from cheapest
      for (const goal of sortedByTarget) {
        if (remaining <= 0) break
        
        const isIncomplete = goal.current < goal.target
        if (!isIncomplete) continue

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
      // add overflow to the most expensive goal
      if (remaining > 0) {
        const lastGoal = sortedByTarget[sortedByTarget.length - 1]
        if (lastGoal) {
          const existing = updatedGoals.get(lastGoal.id) || lastGoal
          updatedGoals.set(lastGoal.id, {
            ...existing,
            current: existing.current + remaining
          })
        }
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
      getTotalBalance
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
