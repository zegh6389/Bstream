'use client'
import { motion } from 'framer-motion'
import { AuthForm } from '@/components/auth-form'

export default function PhoneCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="w-80 rounded-2xl bg-white/10 px-6 py-6 shadow-lg backdrop-blur-md"
    >
      <div className="text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Sign In</h1>
        <AuthForm className="w-full" />
      </div>
    </motion.div>
  )
}
