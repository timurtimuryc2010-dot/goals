'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
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
  const [scrollY, setScrollY] = useState(0)

  // Scroll listener for progressive header blur
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate header opacity based on scroll (0-100px range)
  const headerOpacity = Math.min(scrollY / 100, 1)

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
        {/* Mobile Header - Telegram-Style with Centered Title */}
        <header 
          className="md:hidden fixed top-0 left-0 right-0 z-40 px-5 pt-14 pb-4 border-b transition-all duration-150"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${headerOpacity * 0.6})`,
            backdropFilter: `blur(${headerOpacity * 20}px) saturate(${100 + headerOpacity * 80}%)`,
            WebkitBackdropFilter: `blur(${headerOpacity * 20}px) saturate(${100 + headerOpacity * 80}%)`,
            borderColor: `rgba(255, 255, 255, ${headerOpacity * 0.1})`,
          }}
        >
          {/* Left Action Button */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pt-5">
            {activeTab === 'total' ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsEditingOrder(!isEditingOrder)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border backdrop-blur-md ${
                  isEditingOrder 
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10'
                }`}
              >
                {isEditingOrder ? 'Done' : 'Edit'}
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAddGoal}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                aria-label="Add new goal"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Centered Title */}
          <h1 className="text-lg font-semibold text-foreground text-center">
            {getTabTitle()}
          </h1>
        </header>

        {/* Mobile Header Spacer */}
        <div className="md:hidden h-24" />

        {/* Desktop Header - with Edit button for Total tab */}
        <header 
          className="hidden md:flex items-center justify-between px-8 py-6 border-b transition-all duration-150"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${headerOpacity * 0.4})`,
            backdropFilter: `blur(${headerOpacity * 16}px)`,
            WebkitBackdropFilter: `blur(${headerOpacity * 16}px)`,
            borderColor: `rgba(255, 255, 255, ${0.05 + headerOpacity * 0.05})`,
          }}
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getTabTitle()}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {getTabDescription()}
            </p>
          </div>
          
          {/* Desktop Edit Button for Total Tab */}
          {activeTab === 'total' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditingOrder(!isEditingOrder)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border backdrop-blur-md ${
                isEditingOrder 
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10'
              }`}
            >
              {isEditingOrder ? 'Done' : 'Edit Priority'}
            </motion.button>
          )}
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
