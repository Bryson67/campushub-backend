import Header from "@/components/Header";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "convex/react";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignIn() {
  const router = useRouter();
  const login = useMutation(api.users.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      const user = await login({ email, password });

      console.log("✅ Login successful - user data:", user);

      // Store BOTH email and userId
      await AsyncStorage.setItem("userEmail", user.email);
      await AsyncStorage.setItem("userId", user._id);

      // Verify they were stored
      const storedUserId = await AsyncStorage.getItem("userId");
      console.log("📱 Stored userId in AsyncStorage:", storedUserId);

      router.replace("/(tabs)/gamertag");
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert("Login Failed", "Invalid email or password");
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Google Sign-In",
      "Google Sign-In integration will be added soon. Please use email/password for now.",
    );
  };

  return (
    <>
      <Header />
      <KeyboardAvoidingView
        style={styles.SignIncontainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <BlurView intensity={40} tint="dark" style={styles.card}>
          {/* TITLE */}
          <Text style={styles.title}>SIGN IN</Text>

          {/* EMAIL */}
          <View style={styles.inputBox}>
            <Ionicons name="mail" size={18} color="#00ffff" />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#aaa"
              style={styles.input}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          {/* PASSWORD with visibility toggle */}
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed" size={18} color="#00ffff" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword} // Toggle secure entry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#00ffff"
              />
            </TouchableOpacity>
          </View>

          {/* BUTTON */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>LOGIN</Text>
          </TouchableOpacity>

          {/* OR DIVIDER */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* GOOGLE SIGN IN BUTTON */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* FOOTER */}
          <Text style={styles.footerText}>
            Don’t have an account?{" "}
            <Text style={styles.link} onPress={() => router.push("/Register")}>
              Register
            </Text>
          </Text>
        </BlurView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  SignIncontainer: {
    flex: 1,
    backgroundColor: "#050b1f",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: -30,
    borderTopRightRadius: 400,
  },

  card: {
    width: "85%",
    padding: 26,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.35)",
    backgroundColor: "rgba(10,15,30,0.6)",
    shadowColor: "#00ffff",
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 12,
  },

  title: {
    textAlign: "center",
    fontSize: 24,
    marginBottom: 26,
    color: "#00ffff",
    letterSpacing: 3,
    fontWeight: "700",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.3)",
    marginBottom: 18,
  },

  input: {
    flex: 1,
    height: 48,
    marginLeft: 12,
    color: "#fff",
    fontSize: 14,
  },

  button: {
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: "#00ffff",
    alignItems: "center",
    shadowColor: "#00ffff",
    shadowOpacity: 0.9,
    shadowRadius: 18,
  },

  buttonText: {
    color: "#001018",
    fontWeight: "800",
    letterSpacing: 1,
    fontSize: 14,
  },

  footerText: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 20,
    color: "#bbb",
  },

  link: {
    color: "#00ffff",
    fontWeight: "600",
    fontSize: 30,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "#aaa",
    paddingHorizontal: 10,
    fontSize: 12,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 10,
    marginBottom: 20,
  },
  googleButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
