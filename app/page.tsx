'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { DesktopSidebar, MobileTabBar, TabType } from '@/components/navigation'
import { OverviewView, GoalsListView, TotalProgressView } from '@/components/views'
import { EditGoalSheet } from '@/components/edit-goal-sheet'
import { Goal } from '@/components/goal-provider'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [isEditingOrder, setIsEditingOrder] = useState(false)

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

  // Reset editing mode when switching away from Total tab
  const handleTabChange = (tab: TabType) => {
    if (tab !== 'total') {
      setIsEditingOrder(false)
    }
    setActiveTab(tab)
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Overview'
      case 'goals': return 'Goals'
      case 'total': return 'Total Progress'
    }
  }

  const getTabDescription = () => {
    switch (activeTab) {
      case 'overview': return 'Track all your goals at a glance'
      case 'goals': return 'Detailed view of your savings goals'
      case 'total': return 'Global balance and smart allocation'
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddGoal={handleAddGoal}
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-24 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden glass border-b border-glass-border px-5 pt-10 pb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {getTabTitle()}
          </h1>
          {activeTab === 'total' ? (
            <button
              onClick={() => setIsEditingOrder(!isEditingOrder)}
              className={`text-sm font-semibold transition-colors ${
                isEditingOrder ? 'text-blue-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isEditingOrder ? 'Done' : 'Edit'}
            </button>
          ) : (
            <button
              onClick={handleAddGoal}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1"
              aria-label="Add new goal"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* Desktop Header */}
        <header className="hidden md:block px-8 py-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">
            {getTabTitle()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {getTabDescription()}
          </p>
        </header>

        {/* Content Area */}
        <div className="p-5 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <OverviewView onEditGoal={handleEditGoal} />
              </motion.div>
            )}
            {activeTab === 'goals' && (
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
            {activeTab === 'total' && (
              <motion.div
                key="total"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <TotalProgressView isEditingOrder={isEditingOrder} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
