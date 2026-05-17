'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DesktopSidebar, MobileTabBar } from '@/components/navigation'
import { OverviewView, GoalsListView } from '@/components/views'
import { EditGoalSheet } from '@/components/edit-goal-sheet'
import { Goal } from '@/components/goal-provider'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'goals'>('overview')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const handleAddGoal = () => {
    setEditingGoal(null)
    setIsSheetOpen(true)
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    setEditingGoal(null)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddGoal={handleAddGoal}
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-24 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden glass border-b border-glass-border px-5 py-4 safe-top">
          <h1 className="text-xl font-bold text-foreground">
            {activeTab === 'overview' ? 'Overview' : 'Goals'}
          </h1>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:block px-8 py-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">
            {activeTab === 'overview' ? 'Overview' : 'Goals'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'overview'
              ? 'Track all your goals at a glance'
              : 'Detailed view of your savings goals'}
          </p>
        </header>

        {/* Content Area */}
        <div className="p-5 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <OverviewView onEditGoal={handleEditGoal} />
              </motion.div>
            ) : (
              <motion.div
                key="goals"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <GoalsListView onEditGoal={handleEditGoal} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddGoal={handleAddGoal}
      />

      {/* Edit/Add Goal Sheet */}
      <EditGoalSheet
        goal={editingGoal}
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
      />
    </div>
  )
}
