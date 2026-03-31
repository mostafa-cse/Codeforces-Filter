# CF Filter - Comprehensive Feature Analysis

## Project Overview

**CF Filter** is a professional web application designed for competitive programmers to filter, search, and explore Codeforces problems with advanced filtering capabilities. The application provides a clean, responsive interface that allows users to find problems based on various criteria and track their solving progress.

**Live URL:** https://36svddt7oqaza.ok.kimi.link

---

## Table of Contents

1. [Core Features](#core-features)
2. [Filter System](#filter-system)
3. [User Tracking](#user-tracking)
4. [Problem Display](#problem-display)
5. [Sorting & Pagination](#sorting--pagination)
6. [Responsive Design](#responsive-design)
7. [Technical Implementation](#technical-implementation)
8. [Data Flow](#data-flow)
9. [Performance Optimizations](#performance-optimizations)
10. [Future Enhancements](#future-enhancements)

---

## Core Features

### 1. Problem Filtering
The application provides comprehensive filtering options to help users find specific problems:

- **Division Filter**: Filter by contest division (Div 1, Div 2, Div 3, Div 4, Div 1+2, Educational, Global, Other)
- **Problem Index Filter**: Filter by problem index (A, B, C, D, E, F, G, H, I, J, K, L)
- **Rating Range Filter**: Filter by problem rating with customizable min/max range
- **Solved Count Range Filter**: Filter by number of users who solved the problem
- **Year Filter**: Filter by contest year
- **Tags Filter**: Filter by problem tags with AND/OR mode
- **Status Filter**: Filter by solved/unsolved status for tracked users
- **Search**: Search by problem name, ID, or contest ID

### 2. User Tracking
Track multiple users to see their solving status:

- Add up to 7 user handles
- Each user gets a unique color identifier
- View solved/attempted status for each problem
- Status indicators show verdict (OK, WA, TLE, MLE, RTE)

### 3. Problem Bookmarking
Save problems for quick access:

- Click bookmark icon to save/remove problems
- Bookmarks persist in localStorage
- Visual indicator for bookmarked problems

### 4. Export Functionality
Export filtered problems to CSV format:

- Download all filtered problems as CSV
- Includes ID, Index, Name, Rating, Solved Count, Category, Date, and Tags

---

## Filter System

### Division Filter

**Implementation:**
```typescript
const getCategoryFromContestName = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  // Check for Educational first (before Div checks)
  if (lowerName.includes('educational')) {
    return 'Educational';
  }
  
  // Check for Global
  if (lowerName.includes('global')) {
    return 'Global';
  }
  
  // Check for combined Div 1 + Div 2
  if (lowerName.includes('div. 1 + div. 2')) {
    return 'Div. 1 + Div. 2';
  }
  
  // Check for individual Divisions
  if (lowerName.includes('div. 4')) return 'Div. 4';
  if (lowerName.includes('div. 3')) return 'Div. 3';
  if (lowerName.includes('div. 2')) return 'Div. 2';
  if (lowerName.includes('div. 1')) return 'Div. 1';
  
  return 'Other';
};
```

**Available Divisions:**
- Div 1: Codeforces Round #xxx (Div. 1)
- Div 2: Codeforces Round #xxx (Div. 2)
- Div 3: Codeforces Round #xxx (Div. 3)
- Div 4: Codeforces Round #xxx (Div. 4)
- Div 1+2: Codeforces Round #xxx (Div. 1 + Div. 2)
- Educational: Educational Codeforces Round
- Global: Global Codeforces Round
- Other: All other contest types

**Behavior:**
- Multiple divisions can be selected simultaneously
- Problems matching ANY selected division are shown

### Problem Index Filter

**Implementation:**
- Grid of buttons for indices A through L
- Multi-select enabled
- Filter checks the first character of the problem index

**Behavior:**
- Multiple indices can be selected
- Problems matching ANY selected index are shown

### Rating Range Filter

**Implementation:**
- Min/Max input fields for rating range
- Default range: 0-5000
- Shows unrated problems as rating 0

**UI:**
```
Min: [____] - Max: [____]
```

**Behavior:**
- Problems with rating >= min AND <= max are shown
- Unrated problems have rating 0

### Solved Count Range Filter

**Implementation:**
- Min/Max input fields for solved count
- Step increment of 50
- Default range: 0-10,000,000

**UI:**
```
Min: [____] - Max: [____]
```

**Behavior:**
- Problems with solvedCount >= min AND <= max are shown

### Year Filter

**Implementation:**
- Dynamically generates years from available contests
- Grid of year buttons
- Multi-select enabled

**Behavior:**
- Multiple years can be selected
- Problems from ANY selected year are shown

### Tags Filter

**Implementation:**
- List of all 35+ Codeforces tags
- Checkbox for each tag
- AND/OR mode toggle

**Available Tags:**
- 2-sat, binary search, bitmasks, brute force
- chinese remainder theorem, combinatorics
- constructive algorithms, data structures
- dfs and similar, divide and conquer, dp
- dsu, expression parsing, fft, flows
- games, geometry, graph matchings, graphs
- greedy, hashing, implementation, interactive
- math, matrices, meet-in-the-middle
- number theory, probabilities, schedules
- shortest paths, sortings
- string suffix structures, strings
- ternary search, trees, two pointers

**AND Mode:**
- Problem must have ALL selected tags
- Use case: Find problems with specific combination of techniques

**OR Mode:**
- Problem must have AT LEAST ONE selected tag
- Use case: Find problems from a set of related topics

### Status Filter

**Implementation:**
- Three options: All, Solved, Unsolved
- Only works when users are tracked

**Behavior:**
- All: Show all problems
- Solved: Show only problems solved by at least one tracked user
- Unsolved: Show only problems not solved by any tracked user

---

## User Tracking

### Adding Users

**Process:**
1. Enter Codeforces handle in input field
2. Click + button or press Enter
3. Application fetches user's submissions from Codeforces API
4. User is added with a unique color

**API Endpoint:**
```
GET https://codeforces.com/api/user.status?handle={handle}
```

**Data Structure:**
```typescript
interface TrackedUser {
  handle: string;
  color: string;
  submissions: Map<string, string>; // key: "contestId-index", value: verdict
}
```

### Verdict Colors

| Verdict | Icon | Color | Description |
|---------|------|-------|-------------|
| OK | CheckCircle2 | #238636 | Accepted |
| WRONG_ANSWER | XCircle | #da3633 | Wrong Answer |
| TIME_LIMIT_EXCEEDED | Timer | #d29922 | Time Limit Exceeded |
| MEMORY_LIMIT_EXCEEDED | Cpu | #8957e5 | Memory Limit Exceeded |
| RUNTIME_ERROR | AlertCircle | #f778ba | Runtime Error |
| Other | MoreHorizontal | #6e7681 | Other verdicts |

### User Colors

Each user gets a unique color from the palette:
```typescript
const USER_COLORS = [
  '#58a6ff', '#238636', '#d29922', 
  '#f778ba', '#8957e5', '#3fb950', '#79c0ff'
];
```

---

## Problem Display

### Table Columns

| Column | Description | Mobile |
|--------|-------------|--------|
| # | Bookmark toggle | ✓ |
| Idx | Problem index (A, B, C...) | ✓ |
| Problem | Problem name with status icon | ✓ |
| Rating | Problem rating with color badge | ✓ |
| Solved | Number of users who solved | ✓ |
| Category | Contest division type | Hidden |
| Date | Contest date | Hidden |
| Tags | Problem tags (first 2 + count) | Hidden |
| Users | Tracked users who solved | ✓ |
| Actions | External links | ✓ |

### Rating Colors

| Rating Range | Color | Background Class |
|--------------|-------|------------------|
| < 1200 | Gray | bg-[#cccccc] |
| 1200-1399 | Green | bg-[#77ff77] |
| 1400-1599 | Cyan | bg-[#77ddbb] |
| 1600-1899 | Blue | bg-[#aaaaff] |
| 1900-2099 | Purple | bg-[#ff88ff] |
| 2100-2299 | Yellow | bg-[#ffcc88] |
| 2300-2399 | Orange | bg-[#ffbb55] |
| 2400-2599 | Red | bg-[#ff7777] |
| 2600-2999 | Dark Red | bg-[#ff3333] |
| >= 3000 | Very Dark Red | bg-[#aa0000] |

### Problem Name Link

Each problem name is a clickable link that opens the Codeforces problem page:
```
https://codeforces.com/problemset/problem/{contestId}/{index}
```

---

## Sorting & Pagination

### Sorting Options

| Field | Description | Default |
|-------|-------------|---------|
| Date | Contest date | ✓ (desc) |
| Rating | Problem rating | - |
| Solved | Solved count | - |
| ID | Contest ID | - |

**Toggle Direction:**
- Click column header to sort
- Click again to toggle asc/desc

### Pagination

**Page Size Options:**
- 10, 25, 50, 100 problems per page

**Navigation:**
- Previous/Next buttons
- Page number buttons (max 5 visible)
- Shows range: "Showing X-Y of Z problems"

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Collapsible sidebar, simplified table |
| Tablet | 768-1024px | Fixed sidebar, full table |
| Desktop | > 1024px | Adjustable sidebar, full table |

### Mobile Optimizations

1. **Sidebar:**
   - Fixed position overlay
   - Slide-in animation
   - Close on outside click
   - Menu button in navbar

2. **Table:**
   - Horizontal scroll
   - Hide less important columns (Category, Date, Tags)
   - Touch-friendly buttons

3. **Navbar:**
   - Compact design
   - Essential actions only
   - Hamburger menu

---

## Technical Implementation

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.18 | React framework |
| React | 18.3.1 | UI library |
| TypeScript | 5.5.2 | Type safety |
| Tailwind CSS | 3.4.4 | Styling |
| Axios | 1.7.2 | HTTP requests |
| Lucide React | 0.460.0 | Icons |

### API Integration

**Codeforces API Endpoints:**

1. **Problemset Problems:**
   ```
   GET https://codeforces.com/api/problemset.problems
   ```
   Returns: Problems and problem statistics

2. **Contest List:**
   ```
   GET https://codeforces.com/api/contest.list
   ```
   Returns: All contests with dates

3. **User Status:**
   ```
   GET https://codeforces.com/api/user.status?handle={handle}
   ```
   Returns: User's submissions

### Data Flow

```
┌─────────────────┐
│  Codeforces API │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fetch Problems │
│  & Contests     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Enrich Data    │
│  - Add category │
│  - Add date     │
│  - Add solved   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Apply Filters  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sort & Paginate│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Render Table   │
└─────────────────┘
```

### State Management

**React Hooks Used:**
- `useState`: Local component state
- `useEffect`: Side effects (API calls, localStorage)
- `useMemo`: Computed values (filter count, pagination)
- `useCallback`: Memoized callbacks

**State Structure:**
```typescript
// Problems
const [problems, setProblems] = useState<Problem[]>([]);
const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);

// Filters
const [filters, setFilters] = useState<Filters>({...});

// User tracking
const [trackedUsers, setTrackedUsers] = useState<TrackedUser[]>([]);

// UI
const [sidebarOpen, setSidebarOpen] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(25);
```

### localStorage Persistence

**Keys:**
- `cf-bookmarks`: Saved problem IDs
- `cf-filters`: Active filter settings
- `cf-users`: Tracked users with submissions

---

## Performance Optimizations

### 1. Memoization
- `useMemo` for expensive computations (filter count, pagination)
- `useCallback` for event handlers

### 2. Pagination
- Only render visible problems (25 max per page)
- Reduces DOM size and improves scrolling

### 3. Lazy Loading
- Sidebar sections are collapsible
- Tags list is scrollable (not all rendered at once)

### 4. Efficient Filtering
- Single pass through problems for all filters
- Early termination where possible

### 5. Debouncing
- Search input could benefit from debouncing (not currently implemented)

---

## Future Enhancements

### 1. Advanced Filtering
- Filter by problem points
- Filter by contest phase
- Custom date range picker

### 2. User Features
- User profile page with statistics
- Compare multiple users side-by-side
- Progress tracking over time

### 3. Problem Features
- Problem difficulty estimation
- Similar problem recommendations
- Problem notes/comments

### 4. UI Improvements
- Dark/light theme toggle
- Customizable table columns
- Keyboard shortcuts

### 5. Performance
- Virtual scrolling for large lists
- Service worker for offline access
- API response caching

### 6. Social Features
- Share filter configurations
- Public problem lists
- Community ratings

---

## File Structure

```
cf-filter/
├── src/
│   └── app/
│       ├── page.tsx          # Main application component
│       ├── layout.tsx        # Root layout
│       └── globals.css       # Global styles
├── dist/                     # Build output
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── next.config.js            # Next.js config
├── tailwind.config.js        # Tailwind config
└── postcss.config.js         # PostCSS config
```

---

## Conclusion

CF Filter provides a comprehensive solution for competitive programmers to find and track Codeforces problems. With its advanced filtering system, user tracking capabilities, and responsive design, it offers a professional-grade tool for problem discovery and progress monitoring.

The application is built with modern web technologies and follows best practices for performance and maintainability. Future enhancements will continue to improve the user experience and add valuable features for the competitive programming community.

---

**Author:** @m0stafa  
**GitHub:** https://github.com/mostafa-cse/  
**LinkedIn:** https://www.linkedin.com/in/m0stafa-kamal/  
**Codeforces:** https://codeforces.com/profile/m0stafa
