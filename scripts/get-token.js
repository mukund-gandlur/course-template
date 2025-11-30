/**
 * Helper script to get the authentication token
 * 
 * Usage:
 * 1. Log in to the app in your browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this code, or run: localStorage.getItem("memberstack_token")
 */

if (typeof window !== "undefined") {
  const token = localStorage.getItem("memberstack_token");
  if (token) {
    console.log("Your token:", token);
    console.log("\nUse it like this:");
    console.log(`curl -X POST http://localhost:3000/api/seed-courses?count=50 \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json"`);
  } else {
    console.log("No token found. Please log in first.");
  }
} else {
  console.log("This script must be run in the browser console.");
}

