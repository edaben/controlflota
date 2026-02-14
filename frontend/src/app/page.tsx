'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            router.push('/dashboard')
        } else {
            router.push('/login')
        }
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="text-white text-xl font-bold animate-pulse">Cargando...</div>
        </div>
    )
}
