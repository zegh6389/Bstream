import { useEffect, useState } from 'react'

const getDevice = () => {
  const w = window.innerWidth
  if (w < 640) return 'phone'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

export default function useBreakpoint() {
  const [device, setDevice] = useState('desktop')
  useEffect(() => {
    const onResize = () => setDevice(getDevice())
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return device
}
