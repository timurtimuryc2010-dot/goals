'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useGoals, Goal } from './goal-provider'
import { GoalCard, EmptyGoals } from './goal-card'
import { useState } from 'react'
import { EditGoalSheet } from './edit-goal-sheet'

interface OverviewViewProps {
  onEditGoal: (goal: Goal) => void
}

export function OverviewView({ onEditGoal }: OverviewViewProps) {
  const { goals } = useGoals()

  // Calculate stats
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0)
  const totalCurrent = goals.reduce((sum, g) => sum + g.current, 0)
  const completedGoals = goals.filter(g => g.current >= g.target).length
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (goals.length === 0) {
    return <EmptyGoals />
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-card border border-border"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Saved</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCurrent)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            of {formatCurrency(totalTarget)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-card border border-border"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Progress</p>
          <p className="text-2xl font-bold text-foreground">{overallProgress.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {completedGoals} of {goals.length} complete
          </p>
        </motion.div>
      </div>

      {/* Overall Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-2xl bg-card border border-border"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm text-muted-foreground">{overallProgress.toFixed(0)}%</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-y-0 left-0 rounded-full bg-success"
          />
        </div>
      </motion.div>

      {/* Goals Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          All Goals
        </h2>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          layout
        >
          <AnimatePresence mode="popLayout">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                variant="grid"
                onEdit={() => onEditGoal(goal)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

interface GoalsListViewProps {
  onEditGoal: (goal: Goal) => void
}

export function GoalsListView({ onEditGoal }: GoalsListViewProps) {
  const { goals } = useGoals()

  // Sort goals: incomplete first (by percentage), then completed
  const sortedGoals = [...goals].sort((a, b) => {
    const aComplete = a.current >= a.target
    const bComplete = b.current >= b.target
    
    if (aComplete && !bComplete) return 1
    if (!aComplete && bComplete) return -1
    
    const aPercent = a.current / a.target
    const bPercent = b.current / b.target
    
    return aPercent - bPercent
  })

  if (goals.length === 0) {
    return <EmptyGoals />
  }

  const inProgress = sortedGoals.filter(g => g.current < g.target)
  const completed = sortedGoals.filter(g => g.current >= g.target)

  return (
    <div className="space-y-6">
      {/* In Progress */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            In Progress ({inProgress.length})
          </h2>
          <motion.div className="space-y-3" layout>
            <AnimatePresence mode="popLayout">
              {inProgress.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  variant="list"
                  onEdit={() => onEditGoal(goal)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Completed ({completed.length})
          </h2>
          <motion.div className="space-y-3" layout>
            <AnimatePresence mode="popLayout">
              {completed.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  variant="list"
                  onEdit={() => onEditGoal(goal)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  )
}
