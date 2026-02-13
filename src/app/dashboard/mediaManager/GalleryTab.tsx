import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";

interface GalleryTabProps {
  galleryTitle: string;
  setGalleryTitle: (v: string) => void;
  galleryImage: any;
  pickImage: (setter: (img: any) => void) => void;
  setGalleryImage: (img: any) => void;
  submitGallery: () => void;

  gallery: any[];
  gallerySearch: string;
  setGallerySearch: (v: string) => void;
  deleteGalleryItem: (token: string, id: string) => Promise<any>;
  token: string;
  refreshData: () => void;

  styles: any;
}

export default function GalleryTab({
  galleryTitle, setGalleryTitle,
  galleryImage, pickImage, setGalleryImage,
  submitGallery,
  gallery, gallerySearch, setGallerySearch,
  deleteGalleryItem, token, refreshData,
  styles
}: GalleryTabProps) {

      const PAGE_SIZE = 10;
      const [page, setPage] = useState(1);
    
      const filteredPosts = useMemo(
        () => gallery.filter((g) => g.title?.toLowerCase().includes(gallerySearch.toLowerCase())),
        [gallery, gallerySearch]
      );
    
      const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
      const pagedPosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    
      useEffect(() => {
        setPage(1);
      }, [gallerySearch]);

  return (
    <View>
      <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Upload Gallery Image</Text>
      <TextInput placeholder="Title" value={galleryTitle} onChangeText={setGalleryTitle} style={styles.input} />
      <TouchableOpacity style={styles.btn} onPress={() => pickImage(setGalleryImage)}>
        <Text style={styles.btnText}>Pick Image</Text>
      </TouchableOpacity>
      {galleryImage?.uri && <Image source={{ uri: galleryImage.uri }} style={{ height: 120, marginBottom: 12 }} />}

      <TouchableOpacity style={styles.btnPrimary} onPress={submitGallery}>
        <Text style={styles.btnText}>Upload</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Gallery</Text>
      <TextInput placeholder="Search..." value={gallerySearch} onChangeText={setGallerySearch} style={styles.input} />

        {pagedPosts.map((g) => (
            <View key={g._id} style={styles.card}>
            <Text style={{ fontWeight: "bold" }}>{g.title}</Text>
            {g.img && <Image source={{ uri: g.img }} style={{ height: 120, marginTop: 6 }} />}
            <TouchableOpacity onPress={() => deleteGalleryItem(token, g._id).then(refreshData)}>
              <Text style={{ color: "#ef4444", marginTop: 6 }}>Delete</Text>
            </TouchableOpacity>
          </View>
            ))}

            {/* Pagination Controls */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <TouchableOpacity
                style={[styles.btn, { flex: 1, marginRight: 6, opacity: page === 1 ? 0.5 : 1 }]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
            >
                <Text style={styles.btnText}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.btn, { flex: 1, marginLeft: 6, opacity: page === totalPages ? 0.5 : 1 }]}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
            >
                <Text style={styles.btnText}>Next</Text>
            </TouchableOpacity>
            </View>
            <Text style={{ textAlign: "center", marginTop: 6, color: "#64748b" }}>
            Page {page} of {totalPages}
            </Text>
    </View>
  );
}