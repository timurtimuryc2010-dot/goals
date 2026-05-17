'use client'

import { motion } from 'framer-motion'
import { LayoutGrid, List, Layers, Plus } from 'lucide-react'
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
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
    { id: 'goals' as const, label: 'Goals', icon: List },
    { id: 'total' as const, label: 'Total', icon: Layers },
  ]

  return (
    <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md">
      <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl shadow-black/50">
        {/* Liquid Glass Sliding Pill Indicator */}
        <motion.div
          layoutId="mobile-tab-indicator"
          className="absolute top-2 bottom-2 bg-white/10 backdrop-blur-md rounded-full border border-white/5"
          style={{
            width: `calc(${100 / navItems.length}% - 8px)`,
            left: `calc(${(navItems.findIndex(item => item.id === activeTab) * 100) / navItems.length}% + 4px)`,
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 30,
            mass: 0.8
          }}
        />
        
        {/* Tab Buttons */}
        <div className="relative flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 px-3 transition-colors relative z-10',
                activeTab === item.id
                  ? 'text-white'
                  : 'text-white/40'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
