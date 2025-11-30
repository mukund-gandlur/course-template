/**
 * Hardcoded course categories
 * These categories will always be available in the filter sidebar
 */
export const COURSE_CATEGORIES = [
  "Web Development",
  "Data Science",
  "Design",
  "Mobile Development",
  "DevOps",
  "Backend Development",
  "Programming",
  "Business",
  "Marketing",
  "Photography",
] as const

export type CourseCategory = typeof COURSE_CATEGORIES[number]

