import { api } from "@/convex/_generated/api";
import axios from "axios";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function PayTournament() {
  const router = useRouter();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Get tournament details
  const tournament = useQuery(
    api.tournaments.getTournamentById,
    tournamentId ? { tournamentId } : "skip",
  );

  const userId = "user123"; // This should come from your auth system
  const username = "Bryson"; // This should come from your auth system

  useEffect(() => {
    if (!tournamentId) {
      Alert.alert("Error", "No tournament selected");
      router.back();
    }
  }, [tournamentId]);

  const handlePay = async () => {
    if (loading) return;
    if (!phone) {
      Alert.alert("Error", "Enter phone number");
      return;
    }
    if (!tournament) {
      Alert.alert("Error", "Tournament not found");
      return;
    }

    let formattedPhone = phone;
    if (phone.startsWith("0")) {
      formattedPhone = "254" + phone.slice(1);
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "https://untrotted-ivanna-pinkly.ngrok-free.dev/api/pay",
        {
          phone: phone.trim(),
          amount: tournament.fee,
          userId,
          tournamentId,
          username,
        },
      );

      if (res.data.success) {
        Alert.alert(
          "Success",
          "STK push sent. Check your phone to complete payment.",
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
      Alert.alert("Error", e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tournament) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading tournament...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Tournament Fee</Text>

      <View style={styles.tournamentInfo}>
        <Text style={styles.tournamentName}>{tournament.name}</Text>
        <Text style={styles.gameText}>🎮 {tournament.game}</Text>
        <Text style={styles.feeText}>Fee: KES {tournament.fee}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Phone Number (e.g., 0712345678)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Button
        title={loading ? "Processing..." : "Pay Now"}
        onPress={handlePay}
        disabled={loading}
      />

      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  tournamentInfo: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  gameText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  feeText: {
    fontSize: 16,
    color: "#4f46e5",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "white",
  },
});
