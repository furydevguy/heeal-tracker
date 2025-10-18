export default function isProfileComplete(u: any): boolean {
  // Check fields that match the profile form structure
  return Boolean(
    u?.displayName &&
    u?.age &&
    u?.gender &&
    u?.height &&
    u?.weight &&
    u?.goals &&
    u?.activityPreference &&
    u?.daysPerWeek &&
    u?.injuries &&
    u?.foodDislikes &&
    u?.profileCompleted === true
  )
}
