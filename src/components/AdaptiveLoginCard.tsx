import dynamic from 'next/dynamic'
import useBreakpoint from '@/hooks/useBreakpoint'

export default function AdaptiveLoginCard() {
  const device = useBreakpoint()

  const Desktop = dynamic(() => import('./cards/DesktopCard'), { ssr: false })
  const Tablet = dynamic(() => import('./cards/TabletCard'), { ssr: false })
  const Phone = dynamic(() => import('./cards/PhoneCard'), { ssr: false })

  return (
    <>
      {device === 'desktop' && <Desktop />}
      {device === 'tablet' && <Tablet />}
      {device === 'phone' && <Phone />}
    </>
  )
}
