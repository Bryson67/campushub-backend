import { SquareAd } from "@/components/SquareAd";
import { api } from "@/convex/_generated/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PayTournament() {
  const router = useRouter();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Get tournament details
  const tournament = useQuery(
    api.tournaments.getTournamentById,
    tournamentId ? { tournamentId } : "skip",
  );

  // ✅ Get API URL from environment variables
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // Debug logs
  console.log("🔍 API URL from env:", API_URL);
  console.log("🔍 Full payment URL:", `${API_URL}/api/pay`);

  // Load user data from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoadingUser(true);

        // Get userId from storage
        const storedUserId = await AsyncStorage.getItem("userId");
        const storedEmail = await AsyncStorage.getItem("userEmail");

        console.log("📱 Loaded userId:", storedUserId);
        console.log("📱 Loaded email:", storedEmail);

        if (storedUserId) {
          setUserId(storedUserId);
          // Use email username part as fallback, or you can fetch full name from your users table
          const userDisplayName = storedEmail
            ? storedEmail.split("@")[0]
            : "Player";
          setUsername(userDisplayName);
        } else {
          // No user logged in, redirect to login
          Alert.alert("Not Logged In", "Please log in first");
          router.replace("/SignIn");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        Alert.alert("Error", "Failed to load user data");
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      Alert.alert("Error", "No tournament selected");
      router.back();
    }
  }, [tournamentId]);

  const handlePay = async () => {
    if (loading) return;
    if (!phone) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    if (!tournament) {
      Alert.alert("Error", "Tournament not found");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      router.replace("/SignIn");
      return;
    }
    if (!API_URL) {
      Alert.alert("Error", "API URL not configured");
      console.error("❌ EXPO_PUBLIC_API_URL is not set");
      return;
    }

    // Format phone number (add 254 if starts with 0)
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    setLoading(true);

    try {
      console.log("💳 Processing payment for:", {
        userId,
        username,
        tournamentId,
      });

      const res = await axios.post(`${API_URL}/api/pay`, {
        phone: formattedPhone,
        amount: tournament.fee,
        userId,
        tournamentId,
        username,
      });

      if (res.data.success) {
        Alert.alert(
          "✅ Success",
          "STK push sent! Check your phone to complete payment.",
          [
            {
              text: "OK",
              onPress: () => {
                router.push(`/lobby?tournamentId=${tournamentId}`);
              },
            },
          ],
        );
      } else {
        Alert.alert("Payment failed", res.data.error);
      }
    } catch (e: any) {
      console.error("❌ Payment error:", e);
      Alert.alert(
        "Error",
        e.response?.data?.error || "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading while fetching user data
  if (isLoadingUser || !tournament) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00ffff" />
        <Text style={styles.loadingText}>
          {isLoadingUser ? "Loading user data..." : "Loading tournament..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Tournament Fee</Text>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>Player: {username}</Text>
      </View>

      <View style={styles.tournamentInfo}>
        <Text style={styles.tournamentName}>{tournament.name}</Text>
        <Text style={styles.gameText}>🎮 {tournament.game}</Text>
        <Text style={styles.feeText}>Entry Fee: KES {tournament.fee}</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Phone Number (e.g., 0712345678)"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Text style={styles.hint}>Format: 0712345678 or 254712345678</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePay}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#050b1f" />
        ) : (
          <Text style={styles.buttonText}>PAY NOW</Text>
        )}
      </TouchableOpacity>

      {loading && (
        <Text style={styles.processingText}>
          Processing... Check your phone for STK prompt
        </Text>
      )}

      <View
        style={{
          margin: 16,
          marginTop: 80,
          backgroundColor: "#0a1333",
          borderRadius: 12,
          padding: 10,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#00ffff",
        }}
      >
        <SquareAd />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#050b1f",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050b1f",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#aaa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#00ffff",
    letterSpacing: 1,
  },
  userInfo: {
    backgroundColor: "#0a1333",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#00ffff",
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  tournamentInfo: {
    backgroundColor: "#0a1333",
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#00ffff",
  },
  tournamentName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#fff",
  },
  gameText: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 4,
  },
  feeText: {
    fontSize: 18,
    color: "#00ffff",
    fontWeight: "600",
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#00ffff",
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#0a1333",
    color: "#fff",
    fontSize: 16,
  },
  hint: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 8,
    marginLeft: 5,
  },
  button: {
    backgroundColor: "#00ffff",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    shadowColor: "#00ffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#050b1f",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  processingText: {
    color: "#00ffff",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
});
