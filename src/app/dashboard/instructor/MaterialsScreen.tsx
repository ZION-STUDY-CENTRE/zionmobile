import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "../../../context/AuthContext";
import { getMaterials, uploadMaterial, deleteMaterial } from "../../../api/instructor";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

function getCloudinaryDownloadUrl(url: string) {
  return url.replace("/upload/", "/upload/fl_attachment/");
}

export default function MaterialsScreen({ selectedProgram }: { selectedProgram: any }) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", file: null as any });
  const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
  if (!user?.token || !selectedProgram?._id) return;
  setLoading(true);
  (async () => {
    try {
      const data = await getMaterials(selectedProgram._id, user.token);
      setMaterials(Array.isArray(data) ? data : data.materials || []);
    } catch (e) {
      console.log("Error fetching materials:", e);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  })();
}, [selectedProgram?._id, user?.token]);

  if (!user) return <ActivityIndicator />;

    const handlePickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setForm(f => ({ ...f, file: result.assets[0] }));
        }
    };

  const handleUpload = async () => {
    if (!form.title || !form.description || !form.file) {
      Alert.alert("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("program", selectedProgram._id);
      formData.append("file", {
        uri: form.file.uri,
        name: form.file.name,
        type: form.file.mimeType || "application/octet-stream",
      } as any);

      await uploadMaterial(selectedProgram._id, user.token, formData);
      setModalVisible(false);
      setForm({ title: "", description: "", file: null });
      // Refresh
      const data = await getMaterials(selectedProgram._id, user.token);
      setMaterials(data);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to upload material");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (materialId: string) => {
    Alert.alert("Delete Material", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteMaterial(materialId, user.token);
            const data = await getMaterials(selectedProgram._id, user.token);
            setMaterials(data);
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete material");
          }
        }
      }
    ]);
  };

    const handleDownload = async (url: string) => {
    try {
        const downloadUrl = getCloudinaryDownloadUrl(url);
        const fileName = downloadUrl.split("/").pop() || "file";
        const fileUri = (FileSystem as any).cacheDirectory + fileName;

        const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri);
        await Sharing.shareAsync(uri);
    } catch (e) {
        Alert.alert("Download failed", "Could not download file.");
        console.log(e);
    }
    };

  if (loading) return <ActivityIndicator />;
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{marginBottom: 30, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>

        <View>
          <Text style={{color: '#555', fontSize: 17, fontWeight: "500"}}>STUDY MATERIALS </Text>
          <Text style={{color: '#555', fontSize: 13, }}>{materials.length} FILES AVAILABLE</Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "#2563eb",
            padding: 12,
            borderRadius: 8,
            alignSelf: "flex-end"
          }}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Add Material</Text>
        </TouchableOpacity>
      </View>
        
      <FlatList
        data={materials}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 14,
            marginBottom: 14,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 2,
            elevation: 1
          }}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.title}</Text>
            
            <Text style={{ color: "#555", marginBottom: 8,  }}>
              {item.uploadedBy?.name ? "By:  Mr" : ''} {item.uploadedBy?.name} {item.uploadedBy?.name ? '•' : 'Released On:'} {new Date(item.uploadedAt).toLocaleDateString()}
            </Text>
            
            <Text style={{ color: "#555", marginBottom: 4 }}>{item.description}</Text>
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#2563eb",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  marginRight: 8,
                }}
                onPress={() => handleDownload(item.fileUrl || item.file)}
              >
                <Text style={{ color: "#fff" }}>View / Download</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#dc2626",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
                onPress={() => handleDelete(item._id)}
              >
                <Text style={{ color: "#fff" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: "#888", textAlign: "center", marginTop: 32 }}>No materials found.</Text>}
      />
      {/* Add Material Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{
          flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center"
        }}>
          <View style={{
            backgroundColor: "#fff", borderRadius: 14, padding: 24, width: "90%", maxWidth: 400, elevation: 5
          }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>Add Material</Text>
            <TextInput
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
              placeholder="Title"
              style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}
            />
            <TextInput
              value={form.description}
              onChangeText={v => setForm(f => ({ ...f, description: v }))}
              placeholder="Description"
              style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}
            />
            <TouchableOpacity
              style={{
                backgroundColor: "#f1f5f9",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                alignItems: "center"
              }}
              onPress={handlePickFile}
            >
              <Text style={{ color: "#2563eb" }}>
                {form.file ? form.file.name : "Pick File"}
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", marginTop: 18, justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#e5e7eb",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minWidth: 80,
                  alignItems: "center"
                }}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={{ color: "#1e293b" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#2563eb",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minWidth: 80,
                  alignItems: "center",
                  marginLeft: 8
                }}
                onPress={handleUpload}
                disabled={submitting}
              >
                <Text style={{ color: "#fff" }}>
                  {submitting ? "Uploading..." : "Upload"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}