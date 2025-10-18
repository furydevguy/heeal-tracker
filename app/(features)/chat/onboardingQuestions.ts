
export interface OnboardingQuestion {
  question: string
  answerRequired: boolean
  shortQuestion: string
  step: number
}

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    step: 0,
    question: "In your own words, what's the #1 feeling or achievement you're chasing? (e.g., 'boundless energy to play with my kids,' 'unstoppable confidence').",
    shortQuestion: "feeling or achievement you're chasing?",
    answerRequired: true
  },
  {
    step: 1,
    question: "Powerful. We'll use that as your anchor. Now, on a scale of 1-10, how confident are you about sticking to a new routine? And what's the single biggest thing that you think might get in your way?",
    shortQuestion: "confidence level and main obstacle?",
    answerRequired: true
  },
  {
    step: 2,
    question: "Thanks for that honesty. Now, for your nutrition: what does a real, satisfying 'treat' or favourite meal look like for you? I believe in a plan that includes your real life.",
    shortQuestion: "real, satisfying 'treat' or favourite meal?",
    answerRequired: true
  },
  {
    step: 3,
    question: "Love it. My goal is to make your nutrition sustainable, not restrictive. Finally, what does a 'win' look like for you at the end of a successful day? Is it ticking off all your habits, having more energy, or something else?",
    shortQuestion: "what does a 'win' look like for you at the end of a successful day?",
    answerRequired: true
  },
  {
    step: 4,
    question: "Perfect. I now have a deep understanding of you, both your goals and your motivation. I'm creating your fully personalized plan now—check the Plan tab for it in a moment! Remember, you can chat with me here anytime for advice. Let's begin!",
    shortQuestion: "",
    answerRequired: true
  }
];

export const TOTAL_ONBOARDING_STEPS = onboardingQuestions.length
