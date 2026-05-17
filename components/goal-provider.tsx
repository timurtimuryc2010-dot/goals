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

  return (
    <GoalContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal, adjustAmount }}>
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
