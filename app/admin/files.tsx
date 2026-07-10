import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function FilesList() {
  const router = useRouter();
  const files = useQuery(api.disputes.listAllFiles);

  if (files === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stored Files</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.fileCard}>
            <View style={styles.fileHeader}>
              <Text style={styles.fileId}>ID: {item._id.slice(0, 16)}...</Text>
              <Text style={styles.fileSize}>
                {(item.size / 1024).toFixed(2)} KB
              </Text>
            </View>

            <Text style={styles.fileType}>
              Type: {item.contentType || "unknown"}
            </Text>

            {item.url && (
              <>
                <Image
                  source={{ uri: item.url }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <Text style={styles.fileUrl} numberOfLines={1}>
                  URL: {item.url}
                </Text>
              </>
            )}

            <View style={styles.fileFooter}>
              <Text style={styles.fileDate}>
                Uploaded: {new Date(item._creationTime).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#333" />
            <Text style={styles.emptyStateTitle}>No files found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050b1f",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0a1333",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00ffff",
  },
  fileCard: {
    backgroundColor: "#0a1333",
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00ffff",
  },
  fileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  fileId: {
    color: "#aaa",
    fontSize: 12,
    flex: 1,
  },
  fileSize: {
    color: "#00ffff",
    fontSize: 12,
    fontWeight: "600",
  },
  fileType: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00ffff",
    marginBottom: 8,
  },
  fileUrl: {
    color: "#00ffff",
    fontSize: 10,
    marginBottom: 8,
  },
  fileFooter: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 8,
  },
  fileDate: {
    color: "#666",
    fontSize: 10,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: "#fff",
    marginTop: 16,
  },
});
