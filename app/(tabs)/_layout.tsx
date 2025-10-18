import { listenToUserPlan, UserPlan } from '@app/lib/firebaseHelpers';
import { useAuth } from '@app/providers/AuthProvider';
import { useTokens } from '@app/providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { HeaderAvatar } from '@ui/HeaderAvatar';
import { Tabs, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function TabLayout() {
  const { user } = useAuth();
  const t = useTokens();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const segments = useSegments();

  // Listen to user plan changes
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = listenToUserPlan(user.uid, (plan) => {
      setUserPlan(plan);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Generate dynamic header title based on current route
  const getHeaderTitle = () => {
    const currentRoute = segments[segments.length - 1];
    
    switch (currentRoute) {
      case 'meal':
        return userPlan?.mealPlan ? 'Meal Plan' : 'Meal';
      case 'workout':
        return userPlan?.workoutPlan ? 'Workout Plan' : 'Workout';
      case 'chat':
        return 'Chat';
      case 'Daily':
        return 'Daily';
      case 'progress':
        return 'Progress';
      default:
        return 'Aura';
    }
  };

  // Generate dynamic header component with icon
  const getHeaderComponent = () => {
    const currentRoute = segments[segments.length - 1];
    
    switch (currentRoute) {
      case 'meal':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="fast-food-outline" size={20} color={t.colors.text} />
            <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '600', color: t.colors.text }}>
              {userPlan?.mealPlan ? 'Meal Plan' : 'Meal'}
            </Text>
          </View>
        );
      case 'workout':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="fitness-outline" size={20} color={t.colors.text} />
            <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '600', color: t.colors.text }}>
              {userPlan?.workoutPlan ? 'Workout Plan' : 'Workout'}
            </Text>
          </View>
        );
      case 'chat':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chatbubbles-outline" size={20} color={t.colors.text} />
            <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '600', color: t.colors.text }}>Chat</Text>
          </View>
        );
      case 'Daily':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkbox-outline" size={20} color={t.colors.text} />
            <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '600', color: t.colors.text }}>Daily</Text>
          </View>
        );
      case 'progress':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="stats-chart-outline" size={20} color={t.colors.text} />
            <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '600', color: t.colors.text }}>Progress</Text>
          </View>
        );
      default:
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="sparkles-outline" size={20} color={t.colors.text} />
            <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '600', color: t.colors.text }}>Aura</Text>
          </View>
        );
    }
  };

  // Badge component for tabs
  const TabWithBadge = ({ children, hasPlan }: { children: React.ReactNode; hasPlan: boolean }) => (
    <View style={{ position: 'relative' }}>
      {children}
      {hasPlan && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: t.colors.primary,
            borderWidth: 1,
            borderColor: t.colors.bg,
          }}
        />
      )}
    </View>
  );

  return (
    <Tabs screenOptions={{ headerShown: true, headerRight: () => <HeaderAvatar />, headerTitle: getHeaderComponent }} initialRouteName="chat">
      <Tabs.Screen 
        name="chat" 
        options={{ 
          title: "Chat", 
          tabBarIcon: p => <Ionicons name="chatbubbles-outline" size={20} color={p.focused ? t.colors.primary : t.colors.muted} /> 
        }} 
      />
      <Tabs.Screen 
        name="meal" 
        options={{ 
          title: "Meal", 
          tabBarIcon: p => (
            <TabWithBadge hasPlan={!!userPlan?.mealPlan}>
              <Ionicons name="fast-food-outline" size={20} color={p.focused ? t.colors.primary : t.colors.muted} />
            </TabWithBadge>
          )
        }} 
      />
      <Tabs.Screen 
        name="workout" 
        options={{ 
          title: "Workout", 
          tabBarIcon: p => (
            <TabWithBadge hasPlan={!!userPlan?.workoutPlan}>
              <Ionicons name="fitness-outline" size={20} color={p.focused ? t.colors.primary : t.colors.muted} />
            </TabWithBadge>
          )
        }} 
      />
      <Tabs.Screen 
      name="daily" 
      options={{ 
        title: "Daily", 
        tabBarIcon: p => <Ionicons name="checkbox-outline" size={20} color={p.focused ? t.colors.primary : t.colors.muted} /> 
      }} 
    />
      <Tabs.Screen 
        name="progress" 
        options={{ 
          title: "Progress", 
          tabBarIcon: p => <Ionicons name="stats-chart-outline" size={20} color={p.focused ? t.colors.primary : t.colors.muted} /> 
        }} 
      />
    </Tabs>
  )
}
