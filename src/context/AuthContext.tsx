import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import * as SecureStore from "expo-secure-store"
import {jwtDecode} from "jwt-decode"
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from "react-native";

// Configure notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId ?? "3e86712f-f968-499e-b69f-a2d45bb54e6c"; 
    
    if (!projectId) {
      alert('Project ID not found');
    }

    try {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        token = pushTokenData.data;
    } catch (e: any) {
        console.error("Error fetching push token:", e);
    }
  } else {
    // console.log('Must use physical device for Push Notifications');
  }
  return token;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Register for push notifications on login
  useEffect(() => {
    if (!user?.token) return;

    registerForPushNotificationsAsync().then(token => {
        if (token) {
            console.log("Push Token:", token);
            // Send to backend
            const API_URL = "https://zion-backend-og8z.onrender.com";
            fetch(`${API_URL}/api/users/push-token`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': user.token
                },
                body: JSON.stringify({ token })
            }).catch(err => console.error("Failed to save push token:", err));
        }
    });

    // Listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification Received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log("Notification Tapped:", response);
    });

    return () => {
        notificationListener.current && notificationListener.current.remove();
        responseListener.current && responseListener.current.remove();
    };
  }, [user?.token]);

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
