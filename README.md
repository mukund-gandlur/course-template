# Memberstack Course Boilerplate

A complete course offering platform built with Next.js 16, Memberstack authentication, and data tables.

## Features

- Course management with full CRUD operations
- Memberstack authentication and user management
- Data tables for course storage
- REST API for course operations
- Modern UI with shadcn/ui components
- TypeScript support

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Create `.env` file:**

```env
NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY=pk_live_your_public_key
MEMBERSTACK_SECRET_KEY=sk_live_your_secret_key
MEMBERSTACK_APP_ID=app_your_app_id
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important:** Use LIVE API keys (`pk_live_`/`sk_live_`) to access data tables. Sandbox keys (`pk_sb_`/`sk_sb_`) query SANDBOX data, while data tables always use LIVE mode.

3. **Create a Memberstack account and app:**

   - Go to [https://app.memberstack.com](https://app.memberstack.com)
   - Sign up for a free account if you don't have one
   - Create a new app or select an existing app
   - Get your API keys from the app settings:
     - Public Key: Found in the app dashboard
     - Secret Key: Found in Dev Tools → Admin Keys (keep this secret!)
     - App ID: Found in the app URL or settings

4. **Create the data tables:**

   You need to create the `courses` data table in your Memberstack dashboard. The Admin REST API doesn't support creating tables programmatically, so you have two options:

   **Option A: Using MCP (Memberstack Control Panel) - Recommended**

   If you're using an AI assistant with MCP (Model Context Protocol) support, you can ask it to create the tables automatically:

   ```
   "Create the courses table using MCP"
   ```

   The AI assistant will:

   - Create the `courses` table with the correct configuration
   - Add all required fields with their proper types
   - Set the access rules correctly

   This is the fastest and most reliable method.

   **Option B: Manual creation in dashboard**

   **Step-by-step instructions:**

   1. Go to [https://app.memberstack.com](https://app.memberstack.com)
   2. Sign in to your Memberstack account (create an account if you don't have one)
   3. Select your app (the one matching your `MEMBERSTACK_APP_ID`)
   4. Navigate to **"Tables (Beta)"** in the sidebar
   5. Click **"Create Table"**
   6. Configure the table:
      - **Name:** `Courses`
      - **Key:** `courses` (lowercase, must match exactly)
      - **Access Rules:**
        - **Create:** `ADMIN_ONLY`
        - **Read:** `PUBLIC` (so courses can be viewed by anyone)
        - **Update:** `ADMIN_ONLY`
        - **Delete:** `ADMIN_ONLY`
   7. Add the following fields with their exact types and requirements:

   **Courses table fields:**

   | Field Key      | Name          | Type   | Required | Description                           |
   | -------------- | ------------- | ------ | -------- | ------------------------------------- |
   | `title`        | Title         | TEXT   | ✅ Yes   | Course title                          |
   | `description`  | Description   | TEXT   | ✅ Yes   | Course description                    |
   | `priceCents`   | Price (cents) | NUMBER | ✅ Yes   | Price in cents (e.g., 9999 = $99.99)  |
   | `thumbnailUrl` | Thumbnail URL | TEXT   | ❌ No    | URL to course thumbnail image         |
   | `lessons`      | Lessons       | TEXT   | ❌ No    | Comma-separated list of lesson titles |

   **Note:** The table schema shown in the "Create Data Tables" button popup will display all field details when the table doesn't exist.

   8. Click **"Create"** to save the table
   9. Return to your app and click **"Create Data Tables"** again to verify the table was created successfully

   **Using MCP to create tables:**

   If you have access to an AI assistant with MCP (Memberstack Control Panel) support, you can simply ask:

   - "Create the courses table using MCP" - This will automatically create the table with all fields
   - "Create the lessons table using MCP" - For the optional lessons table

   The MCP tools will handle all the configuration automatically, including:

   - Table name and key
   - Access rules (PUBLIC read, ADMIN_ONLY for create/update/delete)
   - All required fields with correct types
   - Field ordering and requirements

   This is the recommended approach as it's faster and eliminates manual errors.

   **Optional: Lessons table** (for future use):

   If you want to create a separate lessons table:

   - **Name:** `Lessons`
   - **Key:** `lessons`
   - **Access Rules:** Same as courses table
   - **Fields:**
     - `course_id` (TEXT, required) - Reference to course
     - `title` (TEXT, required)
     - `description` (TEXT, optional)
     - `video_url` (TEXT, optional)
     - `duration` (NUMBER, optional)
     - `order` (NUMBER, required) - Lesson order in course

5. **Seed sample courses (optional):**

```bash
# Get your auth token first, then:
curl -X POST http://localhost:3000/api/seed-courses?count=50 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Or use the API endpoint programmatically after authentication.

5. **Run the development server:**

```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Environment Variables

| Variable                             | Description            | Required                               |
| ------------------------------------ | ---------------------- | -------------------------------------- |
| `NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY` | Memberstack public key | Yes                                    |
| `MEMBERSTACK_SECRET_KEY`             | Memberstack secret key | Yes                                    |
| `MEMBERSTACK_APP_ID`                 | Memberstack app ID     | Yes                                    |
| `NEXT_PUBLIC_BASE_URL`               | Base URL for API calls | No (defaults to http://localhost:3000) |

## API Endpoints

### Courses

- `GET /api/courses` - List all courses (optional: `?owner_id=xxx`)
- `POST /api/courses` - Create a course (requires auth)
- `GET /api/courses/[id]` - Get a course
- `PUT /api/courses/[id]` - Update a course (requires auth, owner only)
- `DELETE /api/courses/[id]` - Delete a course (requires auth, owner only)

### Seeding

- `POST /api/seed-courses?count=50` - Create sample courses (requires auth, max 200)

### Authentication

- `POST /api/auth/verify-token` - Verify Memberstack token

## Pages

- `/` - Homepage with featured courses
- `/courses` - Browse all courses
- `/courses/[id]` - View course details
- `/courses/new` - Create a new course (requires authentication)

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Start production server
npm run lint   # Run linter
```

## License

MIT
