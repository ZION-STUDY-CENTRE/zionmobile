import React from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";

interface TestimonialsTabProps {
  testName: string;
  setTestName: (v: string) => void;
  testCourse: string;
  setTestCourse: (v: string) => void;
  testRating: string;
  setTestRating: (v: string) => void;
  testText: string;
  setTestText: (v: string) => void;
  testImage: any;
  pickImage: (setter: (img: any) => void) => void;
  setTestImage: (img: any) => void;
  submitTestimonial: () => void;

  testimonials: any[];
  testimonialSearch: string;
  setTestimonialSearch: (v: string) => void;
  deleteTestimonial: (token: string, id: string) => Promise<any>;
  token: string;
  refreshData: () => void;

  styles: any;
}

export default function TestimonialsTab({
  testName, setTestName,
  testCourse, setTestCourse,
  testRating, setTestRating,
  testText, setTestText,
  testImage, pickImage, setTestImage,
  submitTestimonial,
  testimonials, testimonialSearch, setTestimonialSearch,
  deleteTestimonial, token, refreshData,
  styles
}: TestimonialsTabProps) {
  return (
    <View>
      <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Add Testimonial</Text>
      <TextInput placeholder="Name" value={testName} onChangeText={setTestName} style={styles.input} />
      <TextInput placeholder="Course" value={testCourse} onChangeText={setTestCourse} style={styles.input} />
      <TextInput placeholder="Rating (1-5)" value={testRating} onChangeText={setTestRating} style={styles.input} />
      <TextInput placeholder="Testimonial" value={testText} onChangeText={setTestText} style={styles.input} multiline />
      <TouchableOpacity style={styles.btn} onPress={() => pickImage(setTestImage)}>
        <Text style={styles.btnText}>Pick Photo</Text>
      </TouchableOpacity>
      {testImage?.uri && <Image source={{ uri: testImage.uri }} style={{ height: 120, marginBottom: 12 }} />}

      <TouchableOpacity style={styles.btnPrimary} onPress={submitTestimonial}>
        <Text style={styles.btnText}>Create</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Testimonials</Text>
      <TextInput placeholder="Search..." value={testimonialSearch} onChangeText={setTestimonialSearch} style={styles.input} />
      {testimonials
        .filter((t) =>
          (t.name || "").toLowerCase().includes(testimonialSearch.toLowerCase()) ||
          (t.course || "").toLowerCase().includes(testimonialSearch.toLowerCase())
        )
        .map((t) => (
          <View key={t._id} style={styles.card}>
            <Text style={{ fontWeight: "bold" }}>{t.name}</Text>
            <Text style={{ color: "#64748b" }}>{t.course} • {t.rating}★</Text>
            <Text style={{ marginTop: 4 }}>{t.text}</Text>
            <TouchableOpacity onPress={() => deleteTestimonial(token, t._id).then(refreshData)}>
              <Text style={{ color: "#ef4444", marginTop: 6 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
    </View>
  );
}