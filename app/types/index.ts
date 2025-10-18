export type ChatMessage = {
    id?: string;
    role: string;
    text: string;
    createdAt: any;
    meta: any;
}

export type Profile = {
    id?: string,
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    goals: string[];
    fitnessLevel: string;
    preferences: {
        notifications: boolean;
        privacy: string;
        units: string;
    }
    onboarded: boolean;
    onboardingStep: number;
}

export type MealPlanItem = {
    meal: string;
    items: Array<{
        food: string;
        quantity: string;
        calories?: string;
        carbohydrate?: string;
        fat?: string;
        protein?: string;
    }>;
    totals: {
        calories: string;
        carbohydrate: string;
        fat: string;
        protein: string;
    };
}