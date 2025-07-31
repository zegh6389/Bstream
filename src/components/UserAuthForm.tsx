import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function UserAuthForm() {
  const [email, setEmail] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('need email')
    toast.success('link sent')
  }

  return (
    <form onSubmit={submit} className="w-full space-y-3">
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white"
      />
      <button
        type="submit"
        className="w-full rounded bg-white/10 py-2 text-sm text-white hover:bg-white/20 active:scale-95"
      >
        go
      </button>
    </form>
  )
}
