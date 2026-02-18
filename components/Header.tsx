import { Orbitron_700Bold, useFonts } from '@expo-google-fonts/orbitron';
import { Oxanium_400Regular } from '@expo-google-fonts/oxanium';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';




export default function Header() {

const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Oxanium_400Regular,
  });
  if (!fontsLoaded) return null;


  return (
    <SafeAreaView style={{borderBottomRightRadius: 100,}}>
      <StatusBar style="light"translucent={false}hidden={false}/>    
      
        
      <LinearGradient colors={['#62d317ad', '#243113ad']} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", paddingVertical: 10 }}>
        <Ionicons name="logo-playstation" size={50} color="#ff0000ff" />
        <View style={styles.header}>
          <Text style={styles.text}>GAMING HUB</Text>
        </View>
        <Ionicons name="logo-xbox" size={45} color="#ff0000ff" />
      </LinearGradient>




    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  header: {
      paddingHorizontal: 24,
      paddingVertical: 30,
      paddingBottom: 50,
      borderRadius: 5,
      padding:20
    
  },
  safe: {
  flex: 1,
  backgroundColor: '#050b1f',
},

  Headercontainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#254e7eff',
    
    
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  button: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 5,
  },
  

    
    text: {
    fontFamily: 'Orbitron_700Bold', // Futuristic / Esports vibe
    fontSize: 45,
    color: '#00ffff',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Body / Description
  body: {
    fontFamily: 'Oxanium_400Regular', // Clean readable text
    fontSize: 16,
    color: '#ccc',
    marginTop: 12,
    textAlign: 'center',
  

    
  },
});
