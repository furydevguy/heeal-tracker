import { useTokens } from "@app/providers/ThemeProvider";
import { useState } from "react";
import { Animated, Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "react-native";    

export default function EnhancedDropdown({
    value,
    options,
    onChange,
    placeholder = "Select an option",
    error = false,
  }: {
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: boolean;
  }) {
    const t = useTokens();
    const [isOpen, setIsOpen] = useState(false);
    const [animationValue] = useState(new Animated.Value(0));
  
    const selectedOption = options.find((option) => option.value === value);
  
    useEffect(() => {
      Animated.timing(animationValue, {
        toValue: isOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, [isOpen]);
  
    const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    };
  
    const toggleDropdown = () => {
      setIsOpen(!isOpen);
    };
  
    const rotateInterpolate = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });
  
    return (
      <View style={{ position: "relative", marginBottom: t.spacing.md }}>
        <TouchableOpacity
          onPress={toggleDropdown}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: error
              ? t.colors.danger
              : isOpen
                ? t.colors.primary
                : t.colors.border,
            borderRadius: t.radius.md,
            backgroundColor: t.colors.card,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.md,
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons
              name="flag-outline"
              size={20}
              color={t.colors.muted}
              style={{ marginRight: 12 }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: 16,
                color: selectedOption ? t.colors.text : t.colors.muted,
                fontWeight: selectedOption ? "500" : "400",
              }}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={isOpen ? t.colors.primary : t.colors.muted}
            />
          </Animated.View>
        </TouchableOpacity>
  
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: t.spacing.lg,
            }}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <View
              style={{
                backgroundColor: t.colors.card,
                borderRadius: t.radius.lg,
                borderWidth: 1,
                borderColor: t.colors.border,
                width: "100%",
                maxHeight: "70%",
                ...t.shadows.medium,
              }}
              onStartShouldSetResponder={() => true}
            >
              <View
                style={{
                  padding: t.spacing.lg,
                  borderBottomWidth: 1,
                  borderBottomColor: t.colors.border,
                }}
              >
  
              </View>
  
              <ScrollView style={{ maxHeight: 300 }}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    style={{
                      padding: t.spacing.lg,
                      borderBottomWidth: index < options.length - 1 ? 1 : 0,
                      borderBottomColor: t.colors.border,
                      backgroundColor:
                        value === option.value
                          ? t.colors.primary + "10"
                          : "transparent",
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          color:
                            value === option.value
                              ? t.colors.primary
                              : t.colors.text,
                          fontWeight: value === option.value ? "600" : "400",
                          flex: 1,
                        }}
                      >
                        {option.label}
                      </Text>
                      {value === option.value && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={t.colors.primary}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }