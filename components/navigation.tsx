'use client'

import { motion } from 'framer-motion'
import { LayoutGrid, List, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabType = 'overview' | 'goals' | 'total'

interface DesktopSidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onAddGoal: () => void
}

export function DesktopSidebar({ activeTab, onTabChange, onAddGoal }: DesktopSidebarProps) {
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
    { id: 'goals' as const, label: 'Goals', icon: List },
    { id: 'total' as const, label: 'Total Progress', icon: Layers },
  ]

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 glass border-r border-glass-border safe-top safe-bottom">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-foreground">Goals</h1>
        <p className="text-xs text-muted-foreground mt-1">Track your dreams</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative',
                  activeTab === item.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {activeTab === item.id && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-1 h-6 bg-success rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Add Goal Button */}
      <div className="p-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onAddGoal}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-success text-success-foreground font-semibold hover:bg-success/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </motion.button>
      </div>
    </aside>
  )
}

interface MobileTabBarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onAddGoal: () => void
}

export function MobileTabBar({ activeTab, onTabChange }: Omit<MobileTabBarProps, 'onAddGoal'>) {
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
    { id: 'goals' as const, label: 'Goals', icon: List },
    { id: 'total' as const, label: 'Total', icon: Layers },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-glass-border safe-bottom">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex flex-col items-center gap-1 py-2 px-4 transition-colors min-w-0',
              activeTab === item.id
                ? 'text-success'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
