import React, { useEffect } from 'react';
import { Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SpinnerProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
  type?: 'dots' | 'pulse' | 'wave' | 'bars';
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 40, 
  color = '#22c55e', 
  style,
  type = 'dots' 
}) => {
  const renderDots = () => {
    const AnimatedDot = ({ index }: { index: number }) => {
      const opacity = useSharedValue(0.3);
      const scale = useSharedValue(0.8);

      useEffect(() => {
        opacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        
        scale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
      }, []);

      const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
      }));

      return (
        <Animated.View
          style={[
            {
              width: size / 4,
              height: size / 4,
              borderRadius: size / 8,
              backgroundColor: color,
              marginHorizontal: size / 16,
            },
            animatedStyle,
          ]}
        />
      );
    };

    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
        {[0, 1, 2].map((index) => (
          <AnimatedDot key={index} index={index} />
        ))}
      </View>
    );
  };

  const renderPulse = () => {
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0.8);

    useEffect(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    return (
      <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
            },
            animatedStyle,
          ]}
        />
      </View>
    );
  };

  const renderWave = () => {
    const AnimatedBar = ({ index }: { index: number }) => {
      const scaleY = useSharedValue(0.3);

      useEffect(() => {
        const delay = index * 100;
        setTimeout(() => {
          scaleY.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
              withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
          );
        }, delay);
      }, [index]);

      const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scaleY: scaleY.value }],
      }));

      return (
        <Animated.View
          style={[
            {
              width: size / 8,
              height: size / 2,
              backgroundColor: color,
              marginHorizontal: 1,
              borderRadius: size / 16,
            },
            animatedStyle,
          ]}
        />
      );
    };

    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, style]}>
        {[0, 1, 2, 3, 4].map((index) => (
          <AnimatedBar key={index} index={index} />
        ))}
      </View>
    );
  };

  const renderBars = () => {
    const AnimatedBar = ({ index }: { index: number }) => {
      const height = useSharedValue(size / 4);

      useEffect(() => {
        const delay = index * 150;
        setTimeout(() => {
          height.value = withRepeat(
            withSequence(
              withTiming(size * 0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
              withTiming(size / 4, { duration: 800, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
          );
        }, delay);
      }, [index]);

      const animatedStyle = useAnimatedStyle(() => ({
        height: height.value,
      }));

      return (
        <Animated.View
          style={[
            {
              width: size / 6,
              backgroundColor: color,
              marginHorizontal: 2,
              borderRadius: size / 12,
            },
            animatedStyle,
          ]}
        />
      );
    };

    return (
      <View style={[{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }, style]}>
        {[0, 1, 2].map((index) => (
          <AnimatedBar key={index} index={index} />
        ))}
      </View>
    );
  };

  switch (type) {
    case 'pulse':
      return renderPulse();
    case 'wave':
      return renderWave();
    case 'bars':
      return renderBars();
    default:
      return renderDots();
  }
};

// Navigation Loading Overlay Component
interface NavigationSpinnerProps {
  visible: boolean;
  message?: string;
  type?: 'dots' | 'pulse' | 'wave' | 'bars';
}

export const NavigationSpinner: React.FC<NavigationSpinnerProps> = ({
  visible,
  message = 'Loading...',
  type = 'dots'
}) => {
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(10);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      cardScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) });
      cardOpacity.value = withTiming(1, { duration: 300 });
      
      setTimeout(() => {
        textOpacity.value = withTiming(1, { duration: 200 });
        textTranslateY.value = withTiming(0, { duration: 200 });
      }, 300);
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.8, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 200 });
      textOpacity.value = withTiming(0, { duration: 100 });
      textTranslateY.value = withTiming(10, { duration: 100 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        },
        overlayStyle,
      ]}
    >
      <Animated.View
        style={[
          {
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          },
          cardStyle,
        ]}
      >
        <Spinner type={type} size={40} color="#22c55e" />
        {message && (
          <Animated.View style={[{ marginTop: 16 }, textStyle]}>
            <Text style={{
              fontSize: 16,
              color: '#374151',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {message}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

export default Spinner;
