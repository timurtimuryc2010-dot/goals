'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useGoals, Goal } from './goal-provider'
import { GoalCard, EmptyGoals } from './goal-card'
import { useState, useRef, useEffect } from 'react'
import { Plus, Minus, ArrowUp, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

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

// Total Progress View - New Global Dashboard
export function TotalProgressView() {
  const { goals, globalAddMoney, globalDeductMoney, getTotalBalance } = useGoals()
  const [customAmount, setCustomAmount] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalBalance = getTotalBalance()
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0)
  const overallProgress = totalTarget > 0 ? (totalBalance / totalTarget) * 100 : 0

  // Sort by target ascending - cheapest at bottom (reversed for visual ladder)
  const sortedGoals = [...goals].sort((a, b) => b.target - a.target)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleGlobalAdd = () => {
    const amount = parseFloat(customAmount)
    if (!isNaN(amount) && amount > 0) {
      globalAddMoney(amount)
      setCustomAmount('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1500)
    }
  }

  const handleGlobalDeduct = () => {
    const amount = parseFloat(customAmount)
    if (!isNaN(amount) && amount > 0) {
      globalDeductMoney(amount)
      setCustomAmount('')
    }
  }

  if (goals.length === 0) {
    return <EmptyGoals />
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-success/20 via-success/10 to-transparent border border-success/30"
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-success" />
          <span className="text-sm font-medium text-success uppercase tracking-wide">Total Saved</span>
        </div>
        <motion.p 
          key={totalBalance}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className="text-4xl font-bold text-foreground mb-2"
        >
          {formatCurrency(totalBalance)}
        </motion.p>
        <p className="text-sm text-muted-foreground">
          across {goals.length} goals ({overallProgress.toFixed(0)}% of {formatCurrency(totalTarget)})
        </p>

        {/* Overall Progress Bar */}
        <div className="mt-4 relative h-2 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(overallProgress, 100)}%` }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-y-0 left-0 rounded-full bg-success"
          />
        </div>
      </motion.div>

      {/* Global Deposit/Withdraw */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-2xl bg-card border border-border"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
          Add or Withdraw Globally
        </p>
        
        <div className="flex items-center gap-2">
          {/* Deduct Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleGlobalDeduct}
            disabled={!customAmount || parseFloat(customAmount) <= 0}
            className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Withdraw globally"
          >
            <Minus className="w-5 h-5" />
          </motion.button>

          {/* Amount Input */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              ref={inputRef}
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full h-10 pl-7 pr-4 text-center rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-success/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGlobalAdd()
              }}
            />
          </div>

          {/* Add Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleGlobalAdd}
            disabled={!customAmount || parseFloat(customAmount) <= 0}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
              showSuccess 
                ? "bg-success text-success-foreground" 
                : "bg-success/20 text-success hover:bg-success/30"
            )}
            aria-label="Add globally"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Money cascades to the cheapest incomplete goal first
        </p>
      </motion.div>

      {/* Goal Ladder - Sorted by target (expensive at top, cheap at bottom) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ArrowUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Goal Ladder
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Sorted by target price - climb from bottom to top
        </p>

        <motion.div className="space-y-2" layout>
          <AnimatePresence mode="popLayout">
            {sortedGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GoalCard
                  goal={goal}
                  variant="ladder"
                  showActions={false}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
