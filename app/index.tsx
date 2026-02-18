
import SignIn from '@/app/SignIn';
import { createHomeStyles } from '@/assets/styles/home.styles';
import useTheme from '@/hooks/useTheme';
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from 'react-native-safe-area-context';



const index = () => {
  const {toggleDarkMode, colors} = useTheme();
  const homeStyles = createHomeStyles(colors);

  




  

<StatusBar style={colors.statusBarStyle === "light-content" ? "light" : "dark"} />

  return (
    


    
   

   <SafeAreaView style={homeStyles.container}>
    {/* components for the homepages */}
    
    <SignIn />
    
    
    
    

  </SafeAreaView>
  
  )
}

export default index
