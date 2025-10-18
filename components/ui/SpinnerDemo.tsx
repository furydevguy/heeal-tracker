import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigationContext } from './NavigationWrapper';
import { NavigationSpinner, Spinner } from './Spinner';

const SpinnerDemo: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const { showSpinner, hideSpinner } = useNavigationContext();

  const spinnerTypes: Array<'dots' | 'pulse' | 'wave' | 'bars'> = ['dots', 'pulse', 'wave', 'bars'];

  const demoSpinner = (type: 'dots' | 'pulse' | 'wave' | 'bars', message: string) => {
    showSpinner(message, type);
    setTimeout(() => hideSpinner(), 3000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Spinner Components Demo</Text>
      
      {/* Individual Spinners */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Individual Spinners</Text>
        <View style={styles.spinnerGrid}>
          {spinnerTypes.map((type) => (
            <View key={type} style={styles.spinnerItem}>
              <Text style={styles.spinnerLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              <View style={styles.spinnerContainer}>
                <Spinner type={type} size={40} color="#22c55e" />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Different Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Different Colors</Text>
        <View style={styles.colorRow}>
          <Spinner type="dots" size={30} color="#ef4444" />
          <Spinner type="pulse" size={30} color="#3b82f6" />
          <Spinner type="wave" size={30} color="#f59e0b" />
          <Spinner type="bars" size={30} color="#8b5cf6" />
        </View>
      </View>

      {/* Navigation Spinner Demos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation Spinners</Text>
        <View style={styles.buttonGrid}>
          {spinnerTypes.map((type) => (
            <Pressable
              key={type}
              style={styles.demoButton}
              onPress={() => demoSpinner(type, `Loading with ${type} spinner...`)}
            >
              <Text style={styles.buttonText}>Show {type}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Local Overlay Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Local Overlay Demo</Text>
        <Pressable
          style={styles.demoButton}
          onPress={() => {
            setShowOverlay(true);
            setTimeout(() => setShowOverlay(false), 2000);
          }}
        >
          <Text style={styles.buttonText}>Show Local Overlay</Text>
        </Pressable>
        
        <NavigationSpinner 
          visible={showOverlay} 
          message="Processing..." 
          type="wave" 
        />
      </View>

      {/* Different Sizes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Different Sizes</Text>
        <View style={styles.sizeRow}>
          <Spinner type="dots" size={20} color="#22c55e" />
          <Spinner type="dots" size={30} color="#22c55e" />
          <Spinner type="dots" size={40} color="#22c55e" />
          <Spinner type="dots" size={60} color="#22c55e" />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 15,
  },
  spinnerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  spinnerItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  spinnerLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  spinnerContainer: {
    height: 60,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  demoButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
});

export default SpinnerDemo;
