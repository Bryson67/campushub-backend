import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface DisputeModalProps {
  visible: boolean;
  onClose: () => void;
  match: any;
  currentUserId: string;
  player1Name: string;
  player2Name: string;
  proposedPlayer1Score: number;
  proposedPlayer2Score: number;
  gameType?: string;
}

export default function DisputeModal({
  visible,
  onClose,
  match,
  currentUserId,
  player1Name,
  player2Name,
  proposedPlayer1Score,
  proposedPlayer2Score,
  gameType = "default",
}: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewableImageUrl, setViewableImageUrl] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createDispute = useMutation(api.disputes.createDispute);

  // Get the viewable image URL when storageId changes
  const imageUrlResult = useQuery(
    api.disputes.getImageUrl,
    storageId ? { storageId: storageId as any } : "skip",
  );

  // Update viewable URL when we get it from Convex
  useEffect(() => {
    if (imageUrlResult?.url) {
      console.log("✅ Got viewable URL:", imageUrlResult.url);
      setViewableImageUrl(imageUrlResult.url);
    }
  }, [imageUrlResult]);

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: false,
      });

      if (result.canceled) return;

      setSelectedImage(result.assets[0].uri);
      setStorageId(null);
      setViewableImageUrl(null);
      await uploadImage(result.assets[0].uri);
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please grant camera permissions");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled) return;

      setSelectedImage(result.assets[0].uri);
      setStorageId(null);
      setViewableImageUrl(null);
      await uploadImage(result.assets[0].uri);
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      // Step 1: Get upload URL
      console.log("📤 Getting upload URL...");
      const postUrl = await generateUploadUrl();

      // Step 2: Convert image to blob
      console.log("📤 Converting to blob...");
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log("📤 Blob size:", blob.size, "type:", blob.type);

      // Step 3: Upload blob directly
      console.log("📤 Uploading blob...");
      const uploadResult = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": blob.type || "image/jpeg",
        },
        body: blob,
      });

      if (!uploadResult.ok) {
        throw new Error(`Upload failed: ${uploadResult.status}`);
      }

      // Step 4: Get storage ID
      const result = await uploadResult.json();
      console.log("✅ Upload result:", result);

      if (!result.storageId) {
        throw new Error("No storageId in response");
      }

      setStorageId(result.storageId);
      console.log("✅ Storage ID set:", result.storageId);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert(
        "Error",
        "Failed to upload screenshot: " + (error.message || "Unknown error"),
      );
      setSelectedImage(null);
      setStorageId(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!reason.trim()) {
      Alert.alert("Error", "Please provide a reason");
      return;
    }

    if (!storageId) {
      Alert.alert("Error", "Please upload a screenshot");
      return;
    }

    setLoading(true);

    try {
      console.log("📝 Creating dispute with storage ID:", storageId);

      const result = await createDispute({
        matchId: match._id,
        initiatedBy: currentUserId,
        reason: reason.trim(),
        disputedScore: {
          player1Score: proposedPlayer1Score,
          player2Score: proposedPlayer2Score,
        },
        player1Screenshot: storageId,
        player2Screenshot: undefined,
      });

      if (result.success === false) {
        Alert.alert("Notice", result.message || "A dispute is already pending");
      } else {
        Alert.alert("Success", "Dispute submitted", [
          { text: "OK", onPress: onClose },
        ]);
        // Reset form
        setReason("");
        setSelectedImage(null);
        setStorageId(null);
        setViewableImageUrl(null);
      }
    } catch (error: any) {
      console.error("Error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="alert-circle" size={28} color="#ff9800" />
              <Text style={styles.title}>Report Dispute</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#aaa" />
              </TouchableOpacity>
            </View>

            {/* Match Info */}
            <View style={styles.matchInfo}>
              <Text style={styles.matchInfoTitle}>Match Details</Text>
              <View style={styles.playersContainer}>
                <View style={styles.playerColumn}>
                  <Text style={styles.playerName}>{player1Name}</Text>
                  <Text style={styles.playerScore}>{proposedPlayer1Score}</Text>
                </View>
                <Text style={styles.vsText}>VS</Text>
                <View style={styles.playerColumn}>
                  <Text style={styles.playerName}>{player2Name}</Text>
                  <Text style={styles.playerScore}>{proposedPlayer2Score}</Text>
                </View>
              </View>
            </View>

            {/* Reason Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Reason *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Explain why the scores are incorrect..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={setReason}
              />
            </View>

            {/* Image Upload */}
            <View style={styles.uploadContainer}>
              <Text style={styles.label}>Screenshot Evidence *</Text>

              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                  />

                  {uploading && (
                    <View style={styles.overlay}>
                      <ActivityIndicator size="large" color="#00ffff" />
                      <Text style={styles.overlayText}>Uploading...</Text>
                    </View>
                  )}

                  {viewableImageUrl && !uploading && (
                    <View style={[styles.overlay, styles.successOverlay]}>
                      <Ionicons
                        name="checkmark-circle"
                        size={40}
                        color="#10b981"
                      />
                      <Text style={styles.overlayText}>Uploaded!</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      setSelectedImage(null);
                      setStorageId(null);
                      setViewableImageUrl(null);
                    }}
                    disabled={uploading}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.uploadButton, styles.galleryButton]}
                    onPress={pickImage}
                    disabled={uploading}
                  >
                    <Ionicons name="images" size={24} color="#00ffff" />
                    <Text style={styles.uploadButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadButton, styles.cameraButton]}
                    onPress={takePhoto}
                    disabled={uploading}
                  >
                    <Ionicons name="camera" size={24} color="#00ffff" />
                    <Text style={styles.uploadButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!storageId || !reason.trim() || loading || uploading) &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmitDispute}
              disabled={!storageId || !reason.trim() || loading || uploading}
            >
              {loading ? (
                <ActivityIndicator color="#050b1f" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#050b1f" />
                  <Text style={styles.submitButtonText}>Submit Dispute</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Debug Info */}
            {storageId && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>Storage ID: {storageId}</Text>
                {viewableImageUrl && (
                  <Text style={styles.debugText} numberOfLines={1}>
                    URL: {viewableImageUrl}
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: "#0a1333",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#ff9800",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff9800",
  },
  matchInfo: {
    backgroundColor: "#1a2555",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  matchInfoTitle: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 12,
  },
  playersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerColumn: {
    flex: 1,
    alignItems: "center",
  },
  playerName: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
  },
  playerScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00ffff",
  },
  vsText: {
    fontSize: 16,
    color: "#666",
    marginHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#1a2555",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 100,
    textAlignVertical: "top",
  },
  uploadContainer: {
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: "#1a2555",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00ffff",
  },
  galleryButton: {
    borderColor: "#00ffff",
  },
  cameraButton: {
    borderColor: "#00ffff",
  },
  uploadButtonText: {
    color: "#00ffff",
    marginTop: 4,
    fontSize: 12,
  },
  imagePreviewContainer: {
    position: "relative",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#00ffff",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  successOverlay: {
    backgroundColor: "rgba(16,185,129,0.3)",
  },
  overlayText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 16,
  },
  removeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff9800",
    borderRadius: 8,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#050b1f",
    fontSize: 16,
    fontWeight: "600",
  },
  debugContainer: {
    backgroundColor: "#1a2555",
    padding: 10,
    borderRadius: 8,
  },
  debugText: {
    color: "#aaa",
    fontSize: 10,
    marginBottom: 4,
  },
});
