import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;
const TRIGGER_ZONE = 60; // Top pixels to start gesture
const REFRESH_THRESHOLD = 80;

export default function GlobalPullToRefresh({ children, onRefresh }: Props) {
  const insets = useSafeAreaInsets();
  const pullY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const rotate = pullY.interpolate({
    inputRange: [0, REFRESH_THRESHOLD],
    outputRange: ["0deg", "180deg"],
  });

  const panResponder = useRef(
    PanResponder.create({
      // 1. NEVER claim the responder immediately on start. 
      //    Let the touch pass through so child views (like Tabs) can see it.
      onStartShouldSetPanResponder: () => false,
      
      // 2. Only claim AFTER moving
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (refreshing) return false;

        // Must start near top
        const isTopEdge = gestureState.y0 <= (insets.top + TRIGGER_ZONE);
        if (!isTopEdge) return false;

        // Must be a downward drag of at least 10px to be intentional
        const isPullingDown = gestureState.dy > 10;
        
        // CRITICAL: Strict angle check.
        // Vertical distance must be > 2x Horizontal distance.
        // If I drag 10px down, I must have dragged less than 5px sideways.
        const isStrictlyVertical = Math.abs(gestureState.dy) > (Math.abs(gestureState.dx) * 2);

        return isPullingDown && isStrictlyVertical;
      },
      
      onPanResponderGrant: () => {
        // Optional: Any visual feedback when gesture starts
      },

      onPanResponderMove: (_, gestureState) => {
        // Damping
        const y = Math.max(0, Math.min(gestureState.dy / 2.5, REFRESH_THRESHOLD * 1.5));
        pullY.setValue(y);
      },
      
      onPanResponderRelease: async (_, gestureState) => {
        if (gestureState.dy / 2.5 >= REFRESH_THRESHOLD * 0.8) {
          setRefreshing(true);
          
          Animated.spring(pullY, {
            toValue: REFRESH_THRESHOLD, 
            useNativeDriver: true,
          }).start();

          try {
            await onRefresh();
          } finally {
            setRefreshing(false);
            Animated.spring(pullY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        } else {
          // Cancelled
          Animated.spring(pullY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      
      onPanResponderTerminate: () => {
        Animated.spring(pullY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.indicatorWrap,
          {
            top: insets.top + 10,
            opacity: pullY.interpolate({
              inputRange: [0, 20],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
            transform: [
              { translateY: pullY },
              { rotate },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.indicator}>
          {refreshing ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <MaterialIcons name="refresh" size={24} color="#4F46E5" />
          )}
        </View>
      </Animated.View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  content: { 
    flex: 1,
    zIndex: 1, 
  },
  indicatorWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  indicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});