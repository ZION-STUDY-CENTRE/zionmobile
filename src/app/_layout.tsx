import { Slot } from "expo-router"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { AuthProvider, useAuth } from "../context/AuthContext"
import { useRouter, useSegments } from "expo-router"
import { useEffect } from "react"
import * as Updates from "expo-updates";
import { DevSettings } from "react-native";
import GlobalPullToRefresh from "src/components/GlobalPullToRefresh"

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuthGroup =
      segments[0] === undefined ||
      segments[0] === "(auth)" ||
      segments[0] === "login"

    if (!user && !inAuthGroup) {
      router.replace("/")
    }
    if (user && (segments[0] === undefined || segments[0] === "(auth)" || segments[0] === "login")) {
      if (user.role === "instructor") {
        router.replace("/dashboard/instructor")
      } else if (user.role === "student") {
        router.replace("/dashboard/student")
      } else if (user.role === "media-manager") {
        router.replace("/dashboard/mediaManager")
      } else {
        router.replace("/dashboard")
      }
    }
  }, [user, loading, segments])

  return <>{children}</>
}

export default function Root() {

  const handleGlobalRefresh = async () => {
    try {
      if (__DEV__) {
        DevSettings.reload();
        return;
      }
      await Updates.reloadAsync();
    } catch {
      if (__DEV__) DevSettings.reload();
    }
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GlobalPullToRefresh onRefresh={handleGlobalRefresh}>
          <AuthGate>
            <SafeAreaView style={{ flex: 1, paddingTop: 20, paddingBottom: -10, backgroundColor: "#1e3a8a" }}>
              <Slot />
            </SafeAreaView>
          </AuthGate>
        </GlobalPullToRefresh>
        </AuthProvider>
    </SafeAreaProvider>
  )
}
