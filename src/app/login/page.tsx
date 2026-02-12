'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const login = async () => {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error || 'Login gagal')
            setLoading(false)
            return
        }

        localStorage.setItem('token', data.token)
        router.push('/')
    }

    return (
        <div className="h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-96">
                <CardContent className="p-6 space-y-4">
                    <h1 className="text-xl font-bold">WorkflowBuilder Login</h1>

                    <Input
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />

                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />

                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <Button onClick={login} disabled={loading} className="w-full">
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
