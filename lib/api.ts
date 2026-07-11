"use client"

import axios from "axios"

export const TOKEN_KEY = "omni_shift_token"

export const api = axios.create({
  baseURL: "https://workspaceapi-server-production-a750.up.railway.app/api/admin" || "",
})

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// On 401, clear the token and bounce to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY)
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message || error.message || fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
