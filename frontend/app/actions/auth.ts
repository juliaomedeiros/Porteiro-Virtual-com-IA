'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')

  // Detect if we are inside a docker container by checking if backend host resolves,
  // but a simpler way is to check an env var or just fallback
  const internalApiUrl = process.env.BACKEND_URL || 'http://backend:8000/api/v1'
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` : 'http://localhost:8000/api/v1'
  
  let apiUrl = publicApiUrl;
  if (process.env.HOSTNAME || process.env.DOCKER_CONTAINER) {
    // Usually if we are in Docker, we use the internal hostname
    apiUrl = internalApiUrl;
  }

  let res;
  try {
    // Try internal Docker network first
    res = await fetch(`${internalApiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email as string, password: password as string }),
    });
  } catch (err) {
    // Fallback to public URL (for local dev)
    try {
      res = await fetch(`${publicApiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email as string, password: password as string }),
      });
    } catch (err2) {
      return { error: 'Não foi possível conectar ao servidor (Backend offline).' }
    }
  }

  try {
    if (!res.ok) {
      const error = await res.json()
      return { error: error.detail || 'Falha no login. Verifique suas credenciais.' }
    }

    const data = await res.json()
    
    // Create cookie (Using cookies() from next/headers)
    const cookieStore = await cookies()
    cookieStore.set('token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    cookieStore.set('user_id', data.user_id, { path: '/' })
    cookieStore.set('user_role', data.role, { path: '/' })

  } catch (error) {
    return { error: 'Não foi possível conectar ao servidor.' }
  }

  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('user_id')
  cookieStore.delete('user_role')
  redirect('/login')
}
