import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AdminDisputes() {
  const router = useRouter();
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const disputes = useQuery(api.disputes.getPendingDisputesWithScreenshots);

  const handleViewScreenshot = (dispute: any) => {
    setSelectedDispute(dispute);
    setModalVisible(true);
  };

  if (disputes === undefined) {
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
        <Text style={styles.headerTitle}>Pending Disputes</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={disputes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.disputeCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.matchId}>
                Match: {item.matchId.slice(0, 8)}...
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>PENDING</Text>
              </View>
            </View>

            <Text style={styles.reason}>Reason: {item.reason}</Text>

            <View style={styles.scoreContainer}>
              <Text style={styles.score}>
                Proposed: {item.disputedScore.player1Score} -{" "}
                {item.disputedScore.player2Score}
              </Text>
            </View>

            {item.screenshotUrl && (
              <TouchableOpacity
                style={styles.screenshotButton}
                onPress={() => handleViewScreenshot(item)}
              >
                <Ionicons name="image" size={20} color="#00ffff" />
                <Text style={styles.screenshotButtonText}>View Screenshot</Text>
              </TouchableOpacity>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#333" />
            <Text style={styles.emptyStateTitle}>No Pending Disputes</Text>
            <Text style={styles.emptyStateText}>
              All disputes have been resolved
            </Text>
          </View>
        }
      />

      {/* Screenshot Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDispute?.screenshotUrl && (
              <Image
                source={{ uri: selectedDispute.screenshotUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#050b1f",
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#00ffff",
  },
  disputeCard: {
    backgroundColor: "#0a1333",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00ffff",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  matchId: {
    fontSize: 14,
    color: "#aaa",
  },
  statusBadge: {
    backgroundColor: "rgba(255,152,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: "#ff9800",
    fontWeight: "600",
  },
  reason: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
  },
  scoreContainer: {
    backgroundColor: "#1a2555",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  score: {
    fontSize: 14,
    color: "#00ffff",
    fontWeight: "600",
    textAlign: "center",
  },
  screenshotButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a2555",
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  screenshotButtonText: {
    color: "#00ffff",
    fontSize: 14,
    fontWeight: "500",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
  },
  date: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  closeModalButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
});
