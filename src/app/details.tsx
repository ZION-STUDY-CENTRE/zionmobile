import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function DetailsScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
      <Text style={{ fontSize: 24, marginBottom: 20, color: "white" }}>Details Screen</Text>
      <Button title="Go Back" onPress={() => router.back()} />
    </View>
  );
}
