import React from 'react';
import { Sidebar } from './Sidebar';
import { motion, AnimatePresence } from 'motion/react';

export function Layout({ children, currentPath, onNavigate, onLogout }: { children: React.ReactNode, currentPath: string, onNavigate: (path: string) => void, onLogout: () => void }) {
  return (
    <div className="flex h-screen bg-background text-text">
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
