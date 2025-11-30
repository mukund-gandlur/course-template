/**
 * Script to seed the database with 50 sample courses
 * Run with: npx tsx scripts/seed-courses.ts
 */

import { createDataTableRecord } from "../lib/memberstack-data-api"

const secretKey = process.env.MEMBERSTACK_SECRET_KEY
const appId = process.env.MEMBERSTACK_APP_ID

if (!secretKey || !appId) {
  console.error("MEMBERSTACK_SECRET_KEY and MEMBERSTACK_APP_ID must be set in .env")
  process.exit(1)
}

// TypeScript now knows these are defined
const SECRET_KEY: string = secretKey
const APP_ID: string = appId

// Sample course data
const courseTemplates = [
  {
    title: "Introduction to Web Development",
    description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript.",
    category: "Web Development",
    tags: ["html", "css", "javascript", "beginner"],
    price: 49.99,
    duration: 120,
  },
  {
    title: "Advanced React Patterns",
    description: "Master advanced React patterns and best practices for building scalable applications.",
    category: "Web Development",
    tags: ["react", "javascript", "advanced"],
    price: 79.99,
    duration: 180,
  },
  {
    title: "Full-Stack Next.js Development",
    description: "Build complete full-stack applications with Next.js, React, and TypeScript.",
    category: "Web Development",
    tags: ["nextjs", "react", "typescript", "fullstack"],
    price: 99.99,
    duration: 240,
  },
  {
    title: "Python for Data Science",
    description: "Learn Python programming and data analysis with pandas, numpy, and matplotlib.",
    category: "Data Science",
    tags: ["python", "data-science", "pandas", "numpy"],
    price: 89.99,
    duration: 200,
  },
  {
    title: "Machine Learning Fundamentals",
    description: "Introduction to machine learning algorithms and their applications.",
    category: "Data Science",
    tags: ["machine-learning", "ai", "python", "scikit-learn"],
    price: 129.99,
    duration: 300,
  },
  {
    title: "UI/UX Design Principles",
    description: "Master the principles of user interface and user experience design.",
    category: "Design",
    tags: ["design", "ui", "ux", "figma"],
    price: 69.99,
    duration: 150,
  },
  {
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile apps using React Native.",
    category: "Mobile Development",
    tags: ["react-native", "mobile", "javascript"],
    price: 94.99,
    duration: 220,
  },
  {
    title: "Docker and Kubernetes",
    description: "Learn containerization and orchestration with Docker and Kubernetes.",
    category: "DevOps",
    tags: ["docker", "kubernetes", "devops", "containers"],
    price: 109.99,
    duration: 250,
  },
  {
    title: "GraphQL API Development",
    description: "Build efficient APIs with GraphQL and Apollo Server.",
    category: "Backend Development",
    tags: ["graphql", "api", "apollo", "nodejs"],
    price: 84.99,
    duration: 190,
  },
  {
    title: "TypeScript Mastery",
    description: "Master TypeScript for building type-safe applications.",
    category: "Programming",
    tags: ["typescript", "javascript", "programming"],
    price: 74.99,
    duration: 160,
  },
]

// Generate 50 courses
async function seedCourses() {
  console.log("Starting to seed 50 courses...")
  
  const courses = []
  const now = new Date().toISOString()
  
  // Generate courses by repeating and varying the templates
  for (let i = 0; i < 50; i++) {
    const template = courseTemplates[i % courseTemplates.length]
    const variation = Math.floor(i / courseTemplates.length)
    
    const course = {
      title: variation > 0 ? `${template.title} - Part ${variation + 1}` : template.title,
      description: template.description,
      owner_id: `owner_${(i % 5) + 1}`, // Distribute across 5 owners
      video_link: `https://example.com/video/course-${i + 1}`,
      thumbnail_url: `https://picsum.photos/seed/course-${i + 1}/800/450`,
      price: template.price + (variation * 10),
      status: i < 40 ? "published" : "draft", // First 40 published, last 10 drafts
      duration: template.duration + (variation * 20),
      category: template.category,
      tags: template.tags,
      created_at: new Date(Date.now() - i * 86400000).toISOString(), // Stagger creation dates
      updated_at: now,
    }
    
    courses.push(course)
  }
  
  let successCount = 0
  let errorCount = 0
  
  // Create courses in batches to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < courses.length; i += batchSize) {
    const batch = courses.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (course, index) => {
        try {
          const record = await createDataTableRecord(APP_ID, SECRET_KEY, "courses", course)
          successCount++
          console.log(`✓ Created course ${i + index + 1}/50: ${course.title}`)
        } catch (error: any) {
          errorCount++
          console.error(`✗ Failed to create course ${i + index + 1}/50: ${course.title}`, error.message)
        }
      })
    )
    
    // Small delay between batches
    if (i + batchSize < courses.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  console.log("\n=== Seeding Complete ===")
  console.log(`Successfully created: ${successCount} courses`)
  console.log(`Errors: ${errorCount} courses`)
  console.log(`Total: ${successCount + errorCount} courses`)
}

// Run the seeding
seedCourses()
  .then(() => {
    console.log("\nDone!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })

