import React, { useState, useMemo, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

type BlogType = "upcoming-event" | "ongoing-activity";

interface BlogTabProps {
  blogTitle: string;
  setBlogTitle: (v: string) => void;

  blogDept: string;
  setBlogDept: (v: string) => void;
  departments: string[];

  blogType: BlogType;
  setBlogType: (v: BlogType) => void;

  blogShort: string;
  setBlogShort: (v: string) => void;
  blogDesc: string;
  setBlogDesc: (v: string) => void;

  blogDate: string; // ISO string
  setBlogDate: (v: string) => void;

  blogImage: any;
  pickImage: (setter: (img: any) => void) => void;
  setBlogImage: (img: any) => void;
  submitBlog: () => void;

  posts: any[];
  blogSearch: string;
  setBlogSearch: (v: string) => void;
  deleteBlogPost: (token: string, id: string) => Promise<any>;
  token: string;
  refreshData: () => void;

  styles: any;
}

export default function BlogTab({
  blogTitle, setBlogTitle,
  blogDept, setBlogDept, departments,
  blogType, setBlogType,
  blogShort, setBlogShort,
  blogDesc, setBlogDesc,
  blogDate, setBlogDate,
  blogImage, pickImage, setBlogImage,
  submitBlog,
  posts, blogSearch, setBlogSearch,
  deleteBlogPost, token, refreshData,
  styles
}: BlogTabProps) {
  const [showDate, setShowDate] = useState(false);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const filteredPosts = useMemo(
    () => posts.filter((p) => p.title?.toLowerCase().includes(blogSearch.toLowerCase())),
    [posts, blogSearch]
  );

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const pagedPosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [blogSearch]);


  return (
    <View>
      <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Create Blog Post</Text>

      <TextInput placeholder="Title" value={blogTitle} onChangeText={setBlogTitle} style={styles.input} />

      {/* Department Dropdown */}
      <View style={styles.input}>
        <Picker selectedValue={blogDept} onValueChange={(v) => setBlogDept(v)}>
          {departments.map((d) => (
            <Picker.Item key={d} label={d} value={d} />
          ))}
        </Picker>
      </View>

      {/* Type Dropdown */}
      <View style={styles.input}>
        <Picker selectedValue={blogType} onValueChange={(v) => setBlogType(v)}>
          <Picker.Item label="Upcoming Event" value="upcoming-event" />
          <Picker.Item label="Ongoing Activity" value="ongoing-activity" />
        </Picker>
      </View>

      <TextInput placeholder="Short Description" value={blogShort} onChangeText={setBlogShort} style={styles.input} />
      <TextInput placeholder="Full Description" value={blogDesc} onChangeText={setBlogDesc} style={styles.input} multiline />

      {/* Date Picker */}
      <TouchableOpacity style={styles.btn} onPress={() => setShowDate(true)}>
        <Text style={styles.btnText}>
          {blogDate ? `Date: ${new Date(blogDate).toLocaleDateString()}` : "Pick Date"}
        </Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker
          value={blogDate ? new Date(blogDate) : new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowDate(false);
            if (date) setBlogDate(date.toISOString()); // standard ISO for backend
          }}
        />
      )}

      <TouchableOpacity style={styles.btn} onPress={() => pickImage(setBlogImage)}>
        <Text style={styles.btnText}>Pick Cover Image</Text>
      </TouchableOpacity>
      {blogImage?.uri && <Image source={{ uri: blogImage.uri }} style={{ height: 120, marginBottom: 12 }} />}

      <TouchableOpacity style={styles.btnPrimary} onPress={submitBlog}>
        <Text style={styles.btnText}>Create Post</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Blog Posts</Text>
      <TextInput placeholder="Search..." value={blogSearch} onChangeText={setBlogSearch} style={styles.input} />
        {pagedPosts.map((p) => (
        <View key={p._id} style={styles.card}>
            {p.image && <Image source={{ uri: p.image }} style={{ height: 120, marginBottom: 12 }} />}
          <Text style={{ fontWeight: "bold" }}>{p.title}</Text>
          <Text style={{ color: "#64748b" }}>{p.department} • {p.type}</Text>
          <TouchableOpacity onPress={() => deleteBlogPost(token, p._id).then(refreshData)}>
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