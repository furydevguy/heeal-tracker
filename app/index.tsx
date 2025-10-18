import { useTheme } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from "expo-router";
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get('window');

export default function Index() {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#3d9a64ff', '#60c84bff', '#f4a561']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Floating Elements */}
      <View style={styles.floatingElement1} />
      <View style={styles.floatingElement2} />
      <View style={styles.floatingElement3} />
      
      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@assets/images/logo.png")}
              style={styles.logo}
            />
            <View style={styles.logoGlow} />
          </View>
          
          <Text style={styles.title}>Aura</Text>
          <Text style={styles.subtitle}>Your AI Wellness Coach</Text>
        </View>
        
        {/* Action Section */}
        <View style={styles.actionSection}>
          <Link href="./signin" asChild>
            <Pressable style={styles.signInButton}>
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <Text style={styles.buttonSubtext}>Sign in to continue</Text>
              </LinearGradient>
            </Pressable>
          </Link>
          
          <Text style={styles.copyright}>
            © 2025 Aura Wellness Coach
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d9a42ff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: height * 0.1,
    paddingBottom: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 5,
  },
  title: {
    fontSize: 56,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 1,
  },
  actionSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  signInButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 30,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 50,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  copyright: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '300',
  },
  floatingElement1: {
    position: 'absolute',
    top: height * 0.15,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  floatingElement2: {
    position: 'absolute',
    top: height * 0.3,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  floatingElement3: {
    position: 'absolute',
    bottom: height * 0.3,
    right: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
});
