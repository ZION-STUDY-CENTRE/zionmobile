import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../../context/AuthContext";
import {
  uploadImage,
  getPrograms,
  getBlogPosts,
  createBlogPost,
  deleteBlogPost,
  getGalleryItems,
  createGalleryItem,
  deleteGalleryItem,
  getTestimonials,
  createTestimonial,
  deleteTestimonial,
} from "../../../api/mediaManager";
import BlogTab from "./BlogTab";
import GalleryTab from "./GalleryTab";
import TestimonialsTab from "./TestimonialsTab";
import ChatTab from "./ChatTab";
import NotificationBell from "../../../components/NotificationBell";

type TabKey = "blog" | "gallery" | "testimonials" | "chat";
const TABS: TabKey[] = ["blog", "gallery", "testimonials", "chat"];

type BlogType = "upcoming-event" | "ongoing-activity";

export default function MediaManagerScreen() {
  const { user, logout } = useAuth();
  const token = user?.token;

  const [activeTab, setActiveTab] = useState<TabKey>("blog");
  const [loading, setLoading] = useState(false);

  const [programs, setPrograms] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  const [blogSearch, setBlogSearch] = useState("");
  const [gallerySearch, setGallerySearch] = useState("");
  const [testimonialSearch, setTestimonialSearch] = useState("");

  // Blog form
  const [blogTitle, setBlogTitle] = useState("");
  const [blogDept, setBlogDept] = useState("");
  const [blogType, setBlogType] = useState<BlogType>("upcoming-event");
  const [blogShort, setBlogShort] = useState("");
  const [blogDesc, setBlogDesc] = useState("");
  const [blogDate, setBlogDate] = useState("");
  const [blogImage, setBlogImage] = useState<any>(null);

  // Gallery form
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryImage, setGalleryImage] = useState<any>(null);

  // Testimonial form
  const [testName, setTestName] = useState("");
  const [testCourse, setTestCourse] = useState("");
  const [testRating, setTestRating] = useState("5");
  const [testText, setTestText] = useState("");
  const [testImage, setTestImage] = useState<any>(null);

  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  const onTabPress = (tab: TabKey) => {
    const index = TABS.indexOf(tab);
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const onMomentumEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveTab(TABS[index] || "blog");
  };

  const refreshData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [p, b, g, t] = await Promise.all([
        getPrograms(token),
        getBlogPosts(token),
        getGalleryItems(token),
        getTestimonials(token),
      ]);
      setPrograms(p || []);
      setPosts(b || []);
      setGallery(g || []);
      setTestimonials(t || []);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [token]);

  const pickImage = async (setter: (img: any) => void) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled) {
      setter(res.assets[0]);
    }
  };

  const toUploadFile = (asset: any) => ({
    uri: asset.uri,
    name: asset.fileName || "image.jpg",
    type: asset.type ? `image/${asset.type}` : "image/jpeg",
  });

  const submitBlog = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (blogImage) {
        const uploaded = await uploadImage(token, toUploadFile(blogImage), "blog");
        imageUrl = uploaded.imageUrl;
      }
      await createBlogPost(token, {
        title: blogTitle,
        department: blogDept,
        type: blogType,
        shortDescription: blogShort,
        description: blogDesc,
        image: imageUrl,
        timestamp: blogDate ? new Date(blogDate) : new Date(),
      });
      Alert.alert("Success", "Blog post created");
      setBlogTitle("");
      setBlogDept("");
      setBlogShort("");
      setBlogDesc("");
      setBlogDate("");
      setBlogImage(null);
      refreshData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create blog post");
    } finally {
      setLoading(false);
    }
  };

  const submitGallery = async () => {
    if (!token || !galleryImage) return;
    setLoading(true);
    try {
      const uploaded = await uploadImage(token, toUploadFile(galleryImage), "gallery");
      await createGalleryItem(token, { title: galleryTitle, img: uploaded.imageUrl });
      Alert.alert("Success", "Gallery item created");
      setGalleryTitle("");
      setGalleryImage(null);
      refreshData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create gallery item");
    } finally {
      setLoading(false);
    }
  };

  const submitTestimonial = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (testImage) {
        const uploaded = await uploadImage(token, toUploadFile(testImage), "testimonial");
        imageUrl = uploaded.imageUrl;
      }
      await createTestimonial(token, {
        name: testName,
        course: testCourse,
        rating: parseInt(testRating, 10),
        text: testText,
        image: imageUrl,
      });
      Alert.alert("Success", "Testimonial created");
      setTestName("");
      setTestCourse("");
      setTestRating("5");
      setTestText("");
      setTestImage(null);
      refreshData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create testimonial");
    } finally {
      setLoading(false);
    }
  };

    const departments = Array.from(
        new Set(
        programs
            .map((p) => p?.title || p?.name)
            .filter(Boolean)
        )
    ) as string[];

  if (!token || loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 16, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Media Manager</Text>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "gray" }}>Welcome back, {user?.name || "Media Manager"}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <NotificationBell token={user?.token} />
          <TouchableOpacity onPress={() => logout?.()}>
            <Text style={{ backgroundColor: "#ef4444", color: "#fff", padding: 10, borderRadius: 8, fontWeight: "bold" }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipeable Pages */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ width }} contentContainerStyle={{ padding: 16 }}>
          <BlogTab
            blogTitle={blogTitle}
            setBlogTitle={setBlogTitle}
            blogDept={blogDept}
            setBlogDept={setBlogDept}
            departments={departments}
            blogType={blogType}
            setBlogType={setBlogType}
            blogShort={blogShort}
            setBlogShort={setBlogShort}
            blogDesc={blogDesc}
            setBlogDesc={setBlogDesc}
            blogDate={blogDate}
            setBlogDate={setBlogDate}
            blogImage={blogImage}
            pickImage={pickImage}
            setBlogImage={setBlogImage}
            submitBlog={submitBlog}
            posts={posts}
            blogSearch={blogSearch}
            setBlogSearch={setBlogSearch}
            deleteBlogPost={deleteBlogPost}
            token={token}
            refreshData={refreshData}
            styles={styles}
          />
        </ScrollView>

        <ScrollView style={{ width }} contentContainerStyle={{ padding: 16 }}>
          <GalleryTab
            galleryTitle={galleryTitle}
            setGalleryTitle={setGalleryTitle}
            galleryImage={galleryImage}
            pickImage={pickImage}
            setGalleryImage={setGalleryImage}
            submitGallery={submitGallery}
            gallery={gallery}
            gallerySearch={gallerySearch}
            setGallerySearch={setGallerySearch}
            deleteGalleryItem={deleteGalleryItem}
            token={token}
            refreshData={refreshData}
            styles={styles}
          />
        </ScrollView>

        <ScrollView style={{ width }} contentContainerStyle={{ padding: 16 }}>
          <TestimonialsTab
            testName={testName}
            setTestName={setTestName}
            testCourse={testCourse}
            setTestCourse={setTestCourse}
            testRating={testRating}
            setTestRating={setTestRating}
            testText={testText}
            setTestText={setTestText}
            testImage={testImage}
            pickImage={pickImage}
            setTestImage={setTestImage}
            submitTestimonial={submitTestimonial}
            testimonials={testimonials}
            testimonialSearch={testimonialSearch}
            setTestimonialSearch={setTestimonialSearch}
            deleteTestimonial={deleteTestimonial}
            token={token}
            refreshData={refreshData}
            styles={styles}
          />
        </ScrollView>

        <ScrollView style={{ width }} contentContainerStyle={{ padding: 16 }}>
          <ChatTab />
        </ScrollView>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          backgroundColor: "#fff",
        }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabPress(tab)}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              position: "relative",
            }}
          >
            {/* Top Indicator Line */}
            <View
              style={{
                position: "absolute",
                top: 0,
                height: 3,
                width: "100%",
                backgroundColor: activeTab === tab ? "#2563eb" : "transparent",
              }}
            />
            {tab === "blog" && (
              <Ionicons
                name="newspaper-outline"
                size={24}
                color={activeTab === tab ? "#2563eb" : "#64748b"}
              />
            )}
            {tab === "gallery" && (
              <Ionicons
                name="images-outline"
                size={24}
                color={activeTab === tab ? "#2563eb" : "#64748b"}
              />
            )}
            {tab === "testimonials" && (
              <Ionicons
                name="star-outline"
                size={24}
                color={activeTab === tab ? "#2563eb" : "#64748b"}
              />
            )}
            {tab === "chat" && (
              <Ionicons
                name="chatbubbles-outline"
                size={24}
                color={activeTab === tab ? "#2563eb" : "#64748b"}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = {
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 10, marginBottom: 8 },
  btn: { backgroundColor: "rgba(0, 0, 255, 0.7)", padding: 10, borderRadius: 8, marginBottom: 8, alignItems: "center" },
  btnPrimary: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8, marginBottom: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
  sectionTitle: { fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  card: { padding: 12, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, marginBottom: 8 },
} as const;