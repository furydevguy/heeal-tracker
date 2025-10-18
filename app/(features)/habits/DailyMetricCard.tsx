import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View, Animated } from 'react-native';
import ProgressRing from './ProgressRing';
import { Habit } from '@app/types/habit';
import { useTokens } from "../../providers/ThemeProvider";
import { Spinner } from "@components/ui/Spinner";

/**
 * DailyMetricCard Component
 * 
 * Displays a metric habit with progress ring and increment/decrement buttons.
 * 
 * Features implemented:
 * - Progress ring shows current value vs goal
 * - + and - buttons increment/decrement by 20% of goal
 * - Buttons are disabled at boundaries (0% and 100%)
 * - Visual feedback for disabled state (opacity and color changes)
 * - Loading spinner overlay during Firestore operations
 * - Real-time UI updates when values change
 */

export default function DailyMetricCard({
  habit, value = 0, onInc, onDec, canIncrement = true, canDecrement = true, isLoading = false
}: { 
  habit: Habit; 
  value: number; 
  onInc:()=>void; 
  onDec:()=>void;
  canIncrement?: boolean;
  canDecrement?: boolean;
  isLoading?: boolean;
}) {
  const goal = habit.goal ?? 1
  const progress = Math.min(1, value/goal)
  const t = useTokens();
  
  // Animation for loading spinner fade in/out
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim]);
  return (
    <View style={{ backgroundColor:t.colors.card, borderRadius:t.radius.lg, padding:t.spacing.lg, width:220, gap:t.spacing.lg, shadowOpacity:0.06, shadowRadius:8, marginRight:t.spacing.lg , borderWidth:1, borderColor:t.colors.border, alignItems:'center', justifyContent:'center', position: 'relative', opacity: isLoading ? 0.5 : 1 }}>
      {/* Loading spinner overlay with fade transition */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        borderRadius: t.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        opacity: fadeAnim,
        pointerEvents: isLoading ? 'auto' : 'none',
      }}>
        <Spinner size={24} color={t.colors.primary} type="dots" />
      </Animated.View>
      
      <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
        <Text style={{ fontSize:18 }}>{habit.icon ?? '💧'}</Text>
        <Text style={[{ fontSize:t.fontSize.lg }, { fontFamily:t.fontFamily.bold }, {color:t.colors.text}]}>{habit.name}</Text>
      </View>

      <ProgressRing
        progress={progress}
        color={t.colors.primary}
        center={
          <View style={{ alignItems:'center' }}>
            <Text style={[{ fontSize:t.fontSize.md }, {color : t.colors.text}]}>{value}</Text>
            <Text style={{ fontSize:t.fontSize.sm, color:t.colors.text }}>{habit.unit ?? ''}</Text>
          </View>
        }
      />

      <View style={{ flexDirection:'row', justifyContent:'space-between', gap:t.spacing.lg }}>
        {/* Decrement button - disabled when at 0% or loading */}
        <Pressable 
          onPress={() => { if (canDecrement && !isLoading) onDec() }} 
          style={{ 
            borderWidth:1, 
            borderColor: (canDecrement && !isLoading) ? t.colors.border : t.colors.muted, 
            borderRadius:t.radius.lg, 
            paddingVertical:t.spacing.lg, 
            paddingHorizontal:t.spacing.lg,
            opacity: (canDecrement && !isLoading) ? 1 : 0.5
          }}
        >
          <Text style={{ fontSize:t.fontSize.lg, color: (canDecrement && !isLoading) ? t.colors.text : t.colors.muted }}>−</Text>
        </Pressable>
        
        {/* Increment button - disabled when at 100% or loading */}
        <Pressable 
          onPress={() => { if (canIncrement && !isLoading) onInc() }} 
          style={{ 
            borderWidth:1, 
            borderColor: (canIncrement && !isLoading) ? t.colors.border : t.colors.muted, 
            borderRadius:t.radius.lg, 
            paddingVertical:t.spacing.lg, 
            paddingHorizontal:t.spacing.lg,
            opacity: (canIncrement && !isLoading) ? 1 : 0.5
          }}
        >
          <Text style={{ fontSize:t.fontSize.lg, color: (canIncrement && !isLoading) ? t.colors.text : t.colors.muted }}>＋</Text>
        </Pressable>
      </View>
    </View>
  )
}