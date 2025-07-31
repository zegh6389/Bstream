'use client'
import { motion } from 'framer-motion'
import UserAuthForm from '@/components/UserAuthForm'

export default function PhoneCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="w-64 rounded-full bg-white/10 px-6 py-4 shadow-lg backdrop-blur-md"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="mb-3 text-center text-3xl"
      >
        👁
      </motion.div>
      <UserAuthForm />
    </motion.div>
  )
}
