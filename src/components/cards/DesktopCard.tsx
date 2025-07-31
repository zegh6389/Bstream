'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere } from '@react-three/drei'
import { motion } from 'framer-motion'
import UserAuthForm from '@/components/UserAuthForm'

export default function DesktopCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="relative w-[420px] rounded-3xl border border-white/20 bg-white/5 p-10 shadow-2xl backdrop-blur-md"
    >
      <Canvas className="absolute inset-0 -z-10">
        <ambientLight intensity={0.4} />
        <Sphere args={[1.2, 32, 32]} scale={[2, 2, 2]} rotation={[0, 0, 0]}>
          <meshBasicMaterial wireframe color="#fff" />
        </Sphere>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
      <div className="relative z-10 flex flex-col items-center space-y-4">
        <h1 className="text-2xl font-mono text-white">desktop</h1>
        <UserAuthForm />
      </div>
    </motion.div>
  )
}
