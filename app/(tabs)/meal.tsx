import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { UserPlan, getUserPlan } from "../lib/firebaseHelpers";
import { useTokens } from "../providers/ThemeProvider";

const { width } = Dimensions.get('window');


export default function Meal() {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTokens();

  useEffect(() => {
    if (!userPlan) fetchUserPlan();
  }, [userPlan]);

  const fetchUserPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const plan = await getUserPlan();
      setUserPlan(plan);
    } catch (err) {
      console.error("Error fetching user plan:", err);
      setError("Failed to load meal plan");
    } finally {
      setLoading(false);
    }
  };

  const renderMealPlan = () => {
    if (!userPlan?.mealPlan) {
      return (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={[t.colors.primary, '#2E7D32']}
            style={styles.emptyStateGradient}
          >
            <View style={styles.emptyStateContent}>
              <Ionicons name="restaurant-outline" size={64} color="white" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No Meal Plan Available</Text>
              <Text style={styles.emptySubtext}>
                Complete onboarding to generate your personalized meal plan
              </Text>
            </View>
          </LinearGradient>
        </View>
      );
    }

    const { strategy, dailyCalorieTarget, macronutrientSplit, meals, dailyTotals, coachingTips } = userPlan.mealPlan;

    return (
      <ScrollView style={styles.mealContainer} showsVerticalScrollIndicator={false}>
        {/* Strategy Overview Card */}
        <View style={[styles.strategyCard, { backgroundColor: t.colors.card }]}>
          <LinearGradient
            colors={[t.colors.primary + '20', t.colors.primary + '10']}
            style={styles.strategyGradient}
          >
            <View style={styles.strategyHeader}>
              <View style={[styles.strategyIconContainer, { backgroundColor: t.colors.primary + '30' }]}>
                <Ionicons name="bulb" size={24} color={t.colors.primary} />
              </View>
              <Text style={[styles.strategyTitle, { color: t.colors.text }]}>Your Nutrition Strategy</Text>
            </View>
            <Text style={[styles.strategyText, { color: t.colors.text }]}>{strategy}</Text>
            <View style={styles.targetRow}>
              <View style={[styles.targetItem, styles.dailyCalorieTarget, { backgroundColor: t.colors.bg }]}>
                <Text style={[styles.targetValue, { color: t.colors.primary }]}>{dailyCalorieTarget}</Text>
                <Text style={[styles.targetLabel, { color: t.colors.muted }]}>Daily Calories</Text>
              </View>
              <View style={[styles.targetItem, { backgroundColor: t.colors.bg }]}>
                <Text style={[styles.targetValue, { color: t.colors.primary }]}>{macronutrientSplit}</Text>
                <Text style={[styles.targetLabel, { color: t.colors.muted }]}>Macro Split</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Meals Section */}
        {meals?.map((meal, index) => (
          <View key={index} style={[styles.mealCard, { backgroundColor: t.colors.card }, t.shadows.medium]}>
            <View style={[styles.mealCardGradient, { backgroundColor: t.colors.card }]}>
              <View style={styles.mealHeader}>
                <View style={[styles.mealIconContainer, { backgroundColor: t.colors.primary + '20' }]}>
                  <Ionicons name="fast-food" size={24} color={t.colors.primary} />
                </View>
                <Text style={[styles.mealName, { color: t.colors.text }]}>{meal.meal} (choose one)</Text>
              </View>

              <View style={styles.itemsContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="list" size={16} color={t.colors.muted} />
                  <Text style={[styles.itemsLabel, { color: t.colors.text }]}>Ingredients</Text>
                </View>
                {meal.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={[styles.itemRow, { backgroundColor: t.colors.bg }]}>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: t.colors.text }]}>{item.food}</Text>
                      <Text style={[styles.itemQuantity, { color: t.colors.muted }]}>{item.quantity}</Text>
                    </View>
                    {/* <View style={styles.itemNutrition}>
                      <Text style={[styles.itemCalories, { color: t.colors.secondary }]}>{item.calories} cal</Text>
                    </View> */}
                  </View>
                ))}
              </View>
              {meal.totals && (
                <View style={[styles.nutritionTotals, { backgroundColor: t.colors.bg }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="analytics" size={16} color={t.colors.muted} />
                    <Text style={[styles.nutritionLabel, { color: t.colors.text }]}>Nutrition Facts</Text>
                  </View>
                  <View style={styles.nutritionGrid}>
                    <View style={[styles.nutritionItem, { backgroundColor: t.colors.card }]}>
                      <Text style={[styles.nutritionValue, { color: t.colors.text }]}>{meal?.totals?.protein}g</Text>
                      <Text style={[styles.nutritionUnit, { color: t.colors.muted }]}>Protein</Text>
                    </View>
                    <View style={[styles.nutritionItem, { backgroundColor: t.colors.card }]}>
                      <Text style={[styles.nutritionValue, { color: t.colors.text }]}>{meal?.totals?.fat}g</Text>
                      <Text style={[styles.nutritionUnit, { color: t.colors.muted }]}>Fat</Text>
                    </View>
                    <View style={[styles.nutritionItem, { backgroundColor: t.colors.card }]}>
                      <Text style={[styles.nutritionValue, { color: t.colors.text }]}>{meal?.totals?.carbohydrate}g</Text>
                      <Text style={[styles.nutritionUnit, { color: t.colors.muted }]}>Carbs</Text>
                    </View>
                    <View style={[styles.nutritionItem, { backgroundColor: t.colors.card }]}>
                      <Text style={[styles.nutritionValue, { color: t.colors.text }]}>{meal?.totals?.calories}</Text>
                      <Text style={[styles.nutritionUnit, { color: t.colors.muted }]}>Calories</Text>
                    </View>
                  </View>
                </View>)
              }
            </View>
          </View>
        ))}
        {/* Daily Totals */}
        {dailyTotals && (
          <View style={styles.dailyTotalsCard}>
            <LinearGradient
              colors={[t.colors.primary, '#2E7D32']}
              style={styles.dailyTotalsGradient}
            >
              <View style={styles.dailyTotalsHeader}>
                <Ionicons name="trophy" size={24} color="white" />
                <Text style={styles.dailyTotalsTitle}>Daily Total</Text>
              </View>
              <View style={styles.dailyTotalsGrid}>
                <View style={styles.dailyTotalsItem}>
                  <Text style={styles.dailyTotalsValue}>{dailyTotals.protein}g</Text>
                  <Text style={styles.dailyTotalsUnit}>Protein</Text>
                </View>
                <View style={styles.dailyTotalsItem}>
                  <Text style={styles.dailyTotalsValue}>{dailyTotals.fat}g</Text>
                  <Text style={styles.dailyTotalsUnit}>Fat</Text>
                </View>
                <View style={styles.dailyTotalsItem}>
                  <Text style={styles.dailyTotalsValue}>{dailyTotals.carbohydrates}g</Text>
                  <Text style={styles.dailyTotalsUnit}>Carbs</Text>
                </View>
                <View style={styles.dailyTotalsItem}>
                  <Text style={styles.dailyTotalsValue}>{dailyTotals.calories}</Text>
                  <Text style={styles.dailyTotalsUnit}>Calories</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Coaching Tips */}
        {coachingTips && coachingTips.length > 0 && (
          <View style={[styles.tipsCard, { backgroundColor: t.colors.card }]}>
            <View style={styles.tipsHeader}>
              <View style={[styles.tipsIconContainer, { backgroundColor: '#FF9800' + '20' }]}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#FF9800" />
              </View>
              <Text style={[styles.tipsTitle, { color: t.colors.text }]}>Coaching Tips</Text>
            </View>
            <View style={styles.tipsContainer}>
              {coachingTips.map((tip, index) => (
                <View key={index} style={[styles.tipItem, { backgroundColor: t.colors.bg }]}>
                  <View style={[styles.tipBullet, { backgroundColor: '#FF9800' }]} />
                  <Text style={[styles.tipText, { color: t.colors.text }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={[t.colors.primary, '#2E7D32']} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading your meal plan...</Text>
          <Text style={styles.loadingSubtext}>Preparing your personalized nutrition guide</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={[t.colors.danger, '#ee5a24']} style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle" size={48} color="white" />
          <Text style={styles.errorText}>Oops! Something went wrong</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {renderMealPlan()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContent: {
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    margin: 24,
  },
  emptyStateContent: {
    alignItems: "center",
    padding: 48,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    marginBottom: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  mealContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    // paddingBottom: 40,
  },
  mealCard: {
    marginBottom: 24,
    borderRadius: 20,
  },
  mealCardGradient: {
    borderRadius: 20,
    padding: 24,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  mealName: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsContainer: {
    margin: 0,
  },
  itemsLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
  },
  itemNutrition: {
    alignItems: "flex-end",
  },
  itemCalories: {
    fontSize: 14,
    fontWeight: "600",
  },
  nutritionTotals: {
    borderRadius: 16,
    padding: 13,
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  nutritionGrid: {
    maxWidth: width - 40,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 0.5
  },
  nutritionItem: {
    width: (width - 200) / 4,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  nutritionUnit: {
    fontSize: 12,
    fontWeight: "500",
  },
  dailyTotalsCard: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 20,
  },
  dailyTotalsGradient: {
    borderRadius: 20,
    padding: 24,
  },
  dailyTotalsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
  },
  dailyTotalsTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    marginLeft: 12,
  },
  dailyTotalsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dailyTotalsItem: {
    width: (width - 140) / 4,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dailyTotalsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  dailyTotalsUnit: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  // Strategy Card Styles
  strategyCard: {
    marginBottom: 24,
    borderRadius: 20,
    padding: 0,
  },
  strategyGradient: {
    borderRadius: 20,
    padding: 20,
  },
  strategyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  strategyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  strategyTitle: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },
  strategyText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  targetItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  dailyCalorieTarget: {
    maxWidth: "30%"
  },
  targetValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Food Items Styles
  foodItemsContainer: {
    marginTop: 0,
  },
  foodItem: {
    paddingVertical: 4,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 10,
  },
  foodText: {
    fontSize: 16,
    fontWeight: "500",
  },
  // Tips Card Styles
  tipsCard: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 20,
    padding: 20,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tipsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  tipsTitle: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },
  tipsContainer: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 10,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 14,
  },
  tipText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
});