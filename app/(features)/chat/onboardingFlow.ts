import { db } from "@lib/firebase"
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { sendAura } from "./data"
import { TOTAL_ONBOARDING_STEPS, onboardingQuestions } from "./onboardingQuestions"

/**
 * Check if question for current step has already been sent by looking at existing messages
 */
export function hasQuestionBeenSent(messages: any[], currentStep: number): boolean {
  return messages.some(
    (m) => m.role === "assistant" && m.meta?.onboardingStep === currentStep
  )
}


/**
 * Send the next onboarding question based on user's current step
 */
export async function sendNextOnboardingQuestion(uid: string, currentStep: number, existingMessages: any[] = []) {
  
  // Check if we've completed all onboarding steps
  if (currentStep >= TOTAL_ONBOARDING_STEPS) {
    await completeOnboarding(uid)
    return
  }

  // Only get questions from current step forward (filter out previous steps)
  const availableQuestions = onboardingQuestions.filter(q => q.step >= currentStep)
  if (availableQuestions.length === 0) {
    return
  }

  // Get the question for current step (should be the first one after filtering)
  const questionData = availableQuestions.find(q => q.step === currentStep)
  
  if (!questionData) {
    console.error('❌ No question found for step:', currentStep)
    return
  }

  // Check if question has already been sent
  if (hasQuestionBeenSent(existingMessages, currentStep)) {
    console.log('⏭️  Question for step', currentStep, 'already sent, skipping')
    return
  }

  // Send the question
  await sendAura(uid, questionData.question, { 
    onboardingStep: currentStep,
    answerRequired: questionData.answerRequired 
  })

  // If answer is not required, automatically progress after a delay
  if (!questionData.answerRequired) {
    setTimeout(() => {
      progressOnboardingStep(uid, currentStep).catch(console.error)
    }, 2000) // 2 second delay to let user read the message
  }
}

/**
 * Progress to next onboarding step
 */
export async function progressOnboardingStep(uid: string, currentStep: number) {
  const nextStep = currentStep + 1
  console.log(`📈 Progressing onboarding: ${currentStep} → ${nextStep}`)

  const userRef = doc(db, "users", uid)
  try {
    await updateDoc(userRef, {
      onboardingStep: nextStep,
      lastOnboardingUpdate: serverTimestamp(),
    })
    console.log(`✅ onboardingStep set to ${nextStep}`)

    const updatedDoc = await getDoc(userRef)
    console.log(`🔍 Verified step:`, updatedDoc.data()?.onboardingStep)

    setTimeout(() => {
      // pass fresh messages if you have them; otherwise rely on hasQuestionBeenSent meta
      sendNextOnboardingQuestion(uid, nextStep).catch(console.error)
    }, 1500)
  } catch (err) {
    console.error("❌ Failed to update onboardingStep:", err)
    throw err
  }
}

/**
 * Complete the onboarding process
 */
export async function completeOnboarding(uid: string) {
  console.log('🎉 Completing onboarding for user:', uid)
  
  const userRef = doc(db, "users", uid)
  await updateDoc(userRef, {
    onboarded: true,
    onboardingStep: TOTAL_ONBOARDING_STEPS,
    onboardingCompletedAt: serverTimestamp()
  })

}

/**
 * Check if current question requires an answer
 */
export function doesCurrentStepRequireAnswer(step: number): boolean {
  const questionData = onboardingQuestions.find(q => q.step === step)
  return questionData?.answerRequired || false
}

/**
 * Get current onboarding question
 */

