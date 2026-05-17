'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ImagePlus, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useGoals, Goal } from './goal-provider'

interface EditGoalSheetProps {
  goal?: Goal | null
  isOpen: boolean
  onClose: () => void
}

export function EditGoalSheet({ goal, isOpen, onClose }: EditGoalSheetProps) {
  const { addGoal, updateGoal, deleteGoal } = useGoals()
  const [name, setName] = useState('')
  const [current, setCurrent] = useState('')
  const [target, setTarget] = useState('')
  const [image, setImage] = useState<string | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!goal

  // Reset form when opening/closing or changing goal
  useEffect(() => {
    if (isOpen && goal) {
      setName(goal.name)
      setCurrent(goal.current.toString())
      setTarget(goal.target.toString())
      setImage(goal.image)
    } else if (isOpen) {
      setName('')
      setCurrent('')
      setTarget('')
      setImage(undefined)
    }
  }, [isOpen, goal])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    const trimmedName = name.trim()
    const currentAmount = parseFloat(current) || 0
    const targetAmount = parseFloat(target) || 0

    // Validate required fields
    if (!trimmedName || targetAmount <= 0) {
      console.log('[v0] Validation failed:', { trimmedName, targetAmount })
      return
    }

    const goalData = {
      name: trimmedName,
      current: currentAmount,
      target: targetAmount,
      image,
    }

    console.log('[v0] Submitting goal:', goalData, 'isEditing:', isEditing)

    if (isEditing && goal) {
      updateGoal(goal.id, goalData)
    } else {
      addGoal(goalData)
    }

    onClose()
  }

  const handleDelete = () => {
    if (goal) {
      deleteGoal(goal.id)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300,
              mass: 0.8
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[90vh] overflow-hidden safe-bottom"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-border">
              <button
                onClick={onClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <h2 className="font-semibold text-foreground">
                {isEditing ? 'Edit Goal' : 'New Goal'}
              </h2>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!name.trim() || !target}
                className="text-sm font-semibold text-success disabled:text-muted-foreground transition-colors"
              >
                {isEditing ? 'Save' : 'Add'}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Image Upload */}
              <div className="flex justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-2xl bg-secondary overflow-hidden flex items-center justify-center group"
                >
                  {image ? (
                    <>
                      <img src={image} alt="Goal" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImagePlus className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <ImagePlus className="w-8 h-8 text-muted-foreground" />
                  )}
                </motion.button>
              </div>

              {/* Goal Name */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="New iPhone, Vacation, etc."
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-success/50 transition-all"
                />
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Target Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-success/50 transition-all"
                  />
                </div>
              </div>

              {/* Current Amount */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Current Saved
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={current}
                    onChange={e => setCurrent(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-success/50 transition-all"
                  />
                </div>
              </div>

              {/* Delete Button (only for editing) */}
              {isEditing && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium">Delete Goal</span>
                </motion.button>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
