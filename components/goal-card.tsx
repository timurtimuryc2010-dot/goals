'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Pencil, Trash2, Check, ImagePlus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useGoals, Goal } from './goal-provider'
import { cn } from '@/lib/utils'

interface GoalCardProps {
  goal: Goal
  variant?: 'grid' | 'list'
  onEdit?: () => void
}

export function GoalCard({ goal, variant = 'grid', onEdit }: GoalCardProps) {
  const { adjustAmount, deleteGoal } = useGoals()
  const [showParticles, setShowParticles] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const prevCurrentRef = useRef(goal.current)

  const percentage = Math.min((goal.current / goal.target) * 100, 100)
  const isCompleted = goal.current >= goal.target
  const remaining = Math.max(goal.target - goal.current, 0)

  // Detect when goal just completed
  useEffect(() => {
    const wasCompleted = prevCurrentRef.current >= goal.target
    const nowCompleted = goal.current >= goal.target

    if (!wasCompleted && nowCompleted) {
      setJustCompleted(true)
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 1000)
      setTimeout(() => setJustCompleted(false), 2000)
    }

    prevCurrentRef.current = goal.current
  }, [goal.current, goal.target])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    tx: `${(Math.random() - 0.5) * 100}px`,
    ty: `${-Math.random() * 80 - 20}px`,
    delay: Math.random() * 0.2,
  }))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        'relative rounded-2xl p-4 transition-all duration-500',
        isCompleted
          ? 'bg-success/10 border border-success/30'
          : 'bg-card border border-border',
        justCompleted && 'success-glow',
        variant === 'list' && 'flex items-center gap-4'
      )}
    >
      {/* Particles for completion */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {particles.map(particle => (
              <motion.div
                key={particle.id}
                initial={{ opacity: 1, scale: 1, x: '50%', y: '50%' }}
                animate={{
                  opacity: 0,
                  scale: 0,
                  x: `calc(50% + ${particle.tx})`,
                  y: `calc(50% + ${particle.ty})`,
                }}
                transition={{ duration: 0.8, delay: particle.delay, ease: 'easeOut' }}
                className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-success"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Goal Image */}
      {goal.image && (
        <div
          className={cn(
            'overflow-hidden',
            variant === 'grid'
              ? 'mb-3 aspect-square w-full rounded-xl'
              : 'h-14 w-14 flex-shrink-0 rounded-xl'
          )}
        >
          <img
            src={goal.image}
            alt={goal.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className={cn('flex-1', variant === 'list' && 'min-w-0')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground truncate text-base">
            {goal.name}
          </h3>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex-shrink-0 w-5 h-5 rounded-full bg-success flex items-center justify-center"
            >
              <Check className="w-3 h-3 text-success-foreground" />
            </motion.div>
          )}
        </div>

        {/* Amount Display */}
        <div className="mb-3">
          <span className="text-sm text-muted-foreground">
            {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            ({percentage.toFixed(0)}%)
          </span>
        </div>

        {/* Progress Bar - iOS Style */}
        <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              isCompleted
                ? 'bg-success'
                : 'bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/70'
            )}
          />
        </div>

        {/* Remaining */}
        <p className="text-xs text-muted-foreground">
          {isCompleted ? 'Goal achieved!' : `Remaining: ${formatCurrency(remaining)}`}
        </p>
      </div>

      {/* Actions */}
      <div
        className={cn(
          'flex items-center gap-2',
          variant === 'grid' ? 'mt-4 justify-between' : 'flex-shrink-0'
        )}
      >
        <div className="flex items-center gap-1">
          {/* Decrease Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustAmount(goal.id, -10)}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
            aria-label="Decrease by $10"
          >
            <Minus className="w-4 h-4" />
          </motion.button>

          {/* Increase Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => adjustAmount(goal.id, 10)}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
            aria-label="Increase by $10"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="flex items-center gap-1">
          {/* Edit Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
            aria-label="Edit goal"
          >
            <Pencil className="w-3.5 h-3.5" />
          </motion.button>

          {/* Delete Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => deleteGoal(goal.id)}
            className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
            aria-label="Delete goal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// Empty state component
export function EmptyGoals() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <ImagePlus className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No goals yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Start tracking your savings goals by tapping the + button below.
      </p>
    </motion.div>
  )
}
