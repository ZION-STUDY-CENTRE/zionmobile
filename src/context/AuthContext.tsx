import React, { createContext, useContext, useState } from "react"
import * as SecureStore from "expo-secure-store"
import {jwtDecode} from "jwt-decode"

export type UserRole = "student" | "media-manager" | "instructor" | null
export interface AuthUser {
  _id: string;
  name?: string;      
  token: string
  role: UserRole
  email: string
}

export type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  login: (user: AuthUser) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type DecodedToken = { exp?: number }

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

    React.useEffect(() => {
    ;(async () => {
      const stored = await SecureStore.getItemAsync("zion_auth")
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log("Restored user from storage:", parsed)
        setUser(parsed)
      }
      setLoading(false)
    })()
  }, [])

    React.useEffect(() => {
    if (!user?.token) return
    try {
      const decoded = jwtDecode<DecodedToken>(user.token)
      const expMs = (decoded.exp ?? 0) * 1000
      const now = Date.now()

      if (!decoded.exp || expMs <= now) {
        logout()
        return
      }

      const timeoutId = setTimeout(() => {
        logout()
      }, expMs - now)

      return () => clearTimeout(timeoutId)
    } catch {
      logout()
    }
    return
  }, [user?.token])

  const login = async (userData: AuthUser) => {
    const userObj = {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      token: userData.token,
      role: userData.role,
    };
    setUser(userObj);
    await SecureStore.setItemAsync("zion_auth", JSON.stringify(userObj));
  };

  const logout = async () => {
    setUser(null)
    await SecureStore.deleteItemAsync("zion_auth")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
