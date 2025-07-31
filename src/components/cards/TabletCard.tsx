'use client'
import { motion } from 'framer-motion'
import UserAuthForm from '@/components/UserAuthForm'

export default function TabletCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'backOut' }}
      className="relative w-80 rounded-2xl bg-white/10 p-8 shadow-xl backdrop-blur-md"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="absolute -top-16 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full bg-white/20"
      />
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-xl font-mono text-white">tablet</h1>
        <UserAuthForm />
      </div>
    </motion.div>
  )
}
