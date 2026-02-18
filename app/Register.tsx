import Header from "@/components/Header";
import { router } from "expo-router";
import { api } from "../convex/_generated/api";

import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { BlurView } from "expo-blur";
import { Link } from "expo-router";
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

export default function Register() {
  const register = useMutation(api.users.register);

  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (): Promise<void> => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length <= 8) {
      Alert.alert("Error", "Password must be more than eight characters");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Error", "Email must have @ symbol");
      return;
    }
    try {
      await register({ username, email, password });

      Alert.alert("Success", "Account created", [
        {
          text: "OK",
          onPress: () => router.push("/SignIn"),
        },
      ]);
    } catch (error: unknown) {
      let message = "Something went wrong";

      if (error instanceof Error) {
        if ((error as any).cause instanceof Error) {
          message = (error as any).cause.message;
        } else {
          message = error.message;
        }
      }

      Alert.alert("Error", "Email already registered");
    }

    console.log({
      username,
      email,
      password,
      confirmPassword,
    });
  };

  const handleGoogleSignUp = () => {
    Alert.alert(
      "Google Sign-Up",
      "Google Sign-Up integration will be added soon. Please use email/password for now.",
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
          <Text style={styles.title}>CREATE ACCOUNT</Text>

          {/* UserName */}
          <View style={styles.inputBox}>
            <Ionicons name="person" size={18} color="#00ffff" />
            <TextInput
              placeholder="Username"
              placeholderTextColor="#aaa"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="words"
              value={username}
              onChangeText={(text: string) => setUsername(text)}
            />
          </View>

          {/* EMAIL */}
          <View style={styles.inputBox}>
            <Ionicons name="mail" size={18} color="#00ffff" />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={(text: string) => setEmail(text)}
              placeholderTextColor="#aaa"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* PASSWORD with visibility toggle */}
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed" size={18} color="#00ffff" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={(text: string) => setPassword(text)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#00ffff"
              />
            </TouchableOpacity>
          </View>

          {/* CONFIRM PASSWORD with visibility toggle */}
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed" size={18} color="#00ffff" />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              value={confirmPassword}
              onChangeText={(text: string) => setConfirmPassword(text)}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#00ffff"
              />
            </TouchableOpacity>
          </View>

          {/* REGISTER BUTTON */}
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>REGISTER</Text>
          </TouchableOpacity>

          {/* OR DIVIDER */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* GOOGLE SIGN UP BUTTON */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* FOOTER */}
          <Text style={styles.footerText}>
            Have an account?{" "}
            <Link href="/SignIn" style={styles.link}>
              Login
            </Link>
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
    borderTopLeftRadius: 380,
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
