import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  User,
  Plus,
  Trash2,
  Bookmark,
  Menu,
  CheckCircle2,
  XCircle,
  Timer,
  Cpu,
  AlertCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react';
import './app/globals.css';

// Types
interface Problem {
  contestId: number;
  index: string;
  name: string;
  type: string;
  points?: number;
  rating?: number;
  tags: string[];
  solvedCount: number;
  contestName: string;
  contestStartTimeSeconds?: number;
  category: string;
}

interface TrackedUser {
  handle: string;
  color: string;
  submissions: Map<string, string>;
}

interface Filters {
  divisions: string[];
  indices: string[];
  ratings: number[];
  solvedMin: number;
  solvedMax: number;
  yearMin: number;
  yearMax: number;
  tags: string[];
  tagMode: 'AND' | 'OR';
  status: 'all' | 'solved' | 'unsolved';
  search: string;
}

// Constants
const DIVISIONS = [
  { id: 'Div. 1', label: 'Div 1' },
  { id: 'Div. 2', label: 'Div 2' },
  { id: 'Div. 3', label: 'Div 3' },
  { id: 'Div. 4', label: 'Div 4' },
  { id: 'Div. 1 + Div. 2', label: 'Div 1+2' },
  { id: 'Educational', label: 'Educational' },
  { id: 'Global', label: 'Global' },
  { id: 'Other', label: 'Other' },
];

const INDICES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const RATINGS = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500];

const USER_COLORS = [
  '#58a6ff', '#238636', '#d29922', '#f778ba', '#8957e5', '#3fb950', '#79c0ff'
];

const ALL_TAGS = [
  '2-sat', 'binary search', 'bitmasks', 'brute force', 'chinese remainder theorem',
  'combinatorics', 'constructive algorithms', 'data structures', 'dfs and similar',
  'divide and conquer', 'dp', 'dsu', 'expression parsing', 'fft', 'flows',
  'games', 'geometry', 'graph matchings', 'graphs', 'greedy', 'hashing',
  'implementation', 'interactive', 'math', 'matrices', 'meet-in-the-middle',
  'number theory', 'probabilities', 'schedules', 'shortest paths', 'sortings',
  'string suffix structures', 'strings', 'ternary search', 'trees', 'two pointers'
];

// Helper functions - FIXED DIVISION DETECTION
const getCategoryFromContestName = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  // Check for Global first (most specific)
  if (lowerName.includes('global round') || lowerName.includes('global')) {
    return 'Global';
  }
  
  // Check for Educational
  if (lowerName.includes('educational')) {
    return 'Educational';
  }
  
  // Check for combined Div 1 + Div 2 - must check BEFORE individual divs
  // Patterns: "Div. 1 + Div. 2", "Div.1+Div.2", "div1+div2", "Div. 1+Div. 2"
  if (lowerName.includes('div. 1 + div. 2') || 
      lowerName.includes('div.1+div.2') || 
      lowerName.includes('div1+div2') ||
      lowerName.includes('div. 1+div. 2') ||
      lowerName.includes('(div. 1 + div. 2)') ||
      lowerName.includes('div.2, div.1') ||
      lowerName.includes('div.1, div.2')) {
    return 'Div. 1 + Div. 2';
  }
  
  // Check for individual Divisions - order matters (check higher divs first to avoid partial matches)
  // Use word boundaries to avoid matching "div. 1" inside "div. 10" or "div. 12"
  if (lowerName.match(/\bdiv\.\s*4\b/) || lowerName.includes('(div. 4)')) return 'Div. 4';
  if (lowerName.match(/\bdiv\.\s*3\b/) || lowerName.includes('(div. 3)')) return 'Div. 3';
  if (lowerName.match(/\bdiv\.\s*2\b/) || lowerName.includes('(div. 2)')) return 'Div. 2';
  if (lowerName.match(/\bdiv\.\s*1\b/) || lowerName.includes('(div. 1)')) return 'Div. 1';
  
  return 'Other';
};

const getRatingBgColor = (rating?: number): string => {
  if (!rating) return 'bg-gray-500';
  if (rating < 1200) return 'bg-gray-400';
  if (rating < 1400) return 'bg-green-400';
  if (rating < 1600) return 'bg-cyan-400';
  if (rating < 1900) return 'bg-blue-400';
  if (rating < 2100) return 'bg-purple-400';
  if (rating < 2300) return 'bg-orange-400';
  if (rating < 2400) return 'bg-amber-400';
  if (rating < 2600) return 'bg-red-400';
  if (rating < 3000) return 'bg-red-600';
  return 'bg-red-800';
};

const getVerdictIcon = (verdict: string) => {
  switch (verdict) {
    case 'OK':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'WRONG_ANSWER':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'TIME_LIMIT_EXCEEDED':
      return <Timer className="w-4 h-4 text-yellow-500" />;
    case 'MEMORY_LIMIT_EXCEEDED':
      return <Cpu className="w-4 h-4 text-purple-500" />;
    case 'RUNTIME_ERROR':
      return <AlertCircle className="w-4 h-4 text-pink-500" />;
    default:
      return <MoreHorizontal className="w-4 h-4 text-gray-500" />;
  }
};

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Custom hook for resizable sidebar
function useResizableSidebar(minWidth: number = 280, maxWidth: number = 450, defaultWidth: number = 320) {
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing, minWidth, maxWidth]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, resize, stopResizing]);

  return { sidebarWidth, sidebarRef, startResizing, isResizing };
}

// Main Component
export default function CodeforcesFilter() {
  // State
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Resizable sidebar
  const { sidebarWidth, sidebarRef, startResizing, isResizing } = useResizableSidebar(280, 450, 320);
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    divisions: [],
    indices: [],
    ratings: [],
    solvedMin: 0,
    solvedMax: 10000000,
    yearMin: 2010,
    yearMax: new Date().getFullYear(),
    tags: [],
    tagMode: 'OR',
    status: 'all',
    search: '',
  });
  
  // User tracking
  const [trackedUsers, setTrackedUsers] = useState<TrackedUser[]>([]);
  const [newHandle, setNewHandle] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  
  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Sorting
  const [sortField, setSortField] = useState<'date' | 'rating' | 'solved' | 'id'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load saved data
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('cf-bookmarks');
    if (savedBookmarks) {
      setBookmarks(new Set(JSON.parse(savedBookmarks)));
    }
    
    const savedFilters = localStorage.getItem('cf-filters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
    
    const savedUsers = localStorage.getItem('cf-users');
    if (savedUsers) {
      const users = JSON.parse(savedUsers);
      setTrackedUsers(users.map((u: any) => ({
        ...u,
        submissions: new Map(Object.entries(u.submissions))
      })));
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('cf-bookmarks', JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('cf-filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    const usersToSave = trackedUsers.map(u => ({
      ...u,
      submissions: Object.fromEntries(u.submissions)
    }));
    localStorage.setItem('cf-users', JSON.stringify(usersToSave));
  }, [trackedUsers]);

  // Fetch problems
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const problemsRes = await axios.get('https://codeforces.com/api/problemset.problems');
        const problemData = problemsRes.data.result.problems;
        
        const statsRes = await axios.get('https://codeforces.com/api/problemset.problems');
        const problemStats = statsRes.data.result.problemStatistics;
        
        const statsMap = new Map();
        problemStats.forEach((stat: any) => {
          const key = `${stat.contestId}-${stat.index}`;
          statsMap.set(key, stat.solvedCount);
        });
        
        const contestsRes = await axios.get('https://codeforces.com/api/contest.list');
        const contests = contestsRes.data.result;
        
        const contestMap = new Map();
        contests.forEach((contest: any) => {
          contestMap.set(contest.id, {
            name: contest.name,
            startTimeSeconds: contest.startTimeSeconds,
          });
        });
        
        const enrichedProblems: Problem[] = problemData.map((p: any) => {
          const contest = contestMap.get(p.contestId);
          const key = `${p.contestId}-${p.index}`;
          
          return {
            ...p,
            solvedCount: statsMap.get(key) || 0,
            contestName: contest?.name || 'Unknown Contest',
            contestStartTimeSeconds: contest?.startTimeSeconds,
            category: getCategoryFromContestName(contest?.name || ''),
          };
        });
        
        enrichedProblems.sort((a, b) => 
          (b.contestStartTimeSeconds || 0) - (a.contestStartTimeSeconds || 0)
        );
        
        setProblems(enrichedProblems);
        setFilteredProblems(enrichedProblems);
      } catch (err) {
        setError('Failed to fetch data from Codeforces API');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...problems];
    
    // Division filter
    if (filters.divisions.length > 0) {
      result = result.filter(p => filters.divisions.includes(p.category));
    }
    
    // Index filter
    if (filters.indices.length > 0) {
      result = result.filter(p => filters.indices.includes(p.index[0]));
    }
    
    // Rating filter - multiple ratings selected
    if (filters.ratings.length > 0) {
      result = result.filter(p => {
        if (!p.rating) return false;
        return filters.ratings.some(r => p.rating === r);
      });
    }
    
    // Solved count range filter
    result = result.filter(p => 
      p.solvedCount >= filters.solvedMin && p.solvedCount <= filters.solvedMax
    );
    
    // Year range filter
    result = result.filter(p => {
      if (!p.contestStartTimeSeconds) return false;
      const year = new Date(p.contestStartTimeSeconds * 1000).getFullYear();
      return year >= filters.yearMin && year <= filters.yearMax;
    });
    
    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter(p => {
        if (filters.tagMode === 'AND') {
          return filters.tags.every(tag => p.tags.includes(tag));
        } else {
          return filters.tags.some(tag => p.tags.includes(tag));
        }
      });
    }
    
    // Status filter
    if (filters.status !== 'all' && trackedUsers.length > 0) {
      result = result.filter(p => {
        const key = `${p.contestId}-${p.index}`;
        const isSolved = trackedUsers.some(u => u.submissions.get(key) === 'OK');
        return filters.status === 'solved' ? isSolved : !isSolved;
      });
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        `${p.contestId}${p.index}`.toLowerCase().includes(searchLower) ||
        p.contestId.toString().includes(searchLower)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = (a.contestStartTimeSeconds || 0) - (b.contestStartTimeSeconds || 0);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'solved':
          comparison = a.solvedCount - b.solvedCount;
          break;
        case 'id':
          comparison = a.contestId - b.contestId;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredProblems(result);
    setCurrentPage(1);
  }, [problems, filters, sortField, sortDirection, trackedUsers]);

  // Add user
  const addUser = async () => {
    if (!newHandle.trim()) return;
    if (trackedUsers.length >= 7) {
      alert('Maximum 7 users can be tracked');
      return;
    }
    
    setUserLoading(true);
    try {
      const res = await axios.get(`https://codeforces.com/api/user.status?handle=${newHandle.trim()}`);
      const submissions = res.data.result;
      
      const submissionMap = new Map<string, string>();
      submissions.forEach((sub: any) => {
        const key = `${sub.contestId}-${sub.problem.index}`;
        if (!submissionMap.has(key) || sub.verdict === 'OK') {
          submissionMap.set(key, sub.verdict);
        }
      });
      
      const newUser: TrackedUser = {
        handle: newHandle.trim(),
        color: USER_COLORS[trackedUsers.length % USER_COLORS.length],
        submissions: submissionMap,
      };
      
      setTrackedUsers([...trackedUsers, newUser]);
      setNewHandle('');
    } catch (err) {
      alert('Failed to fetch user data. Please check the handle.');
    } finally {
      setUserLoading(false);
    }
  };

  // Remove user
  const removeUser = (handle: string) => {
    setTrackedUsers(trackedUsers.filter(u => u.handle !== handle));
  };

  // Toggle bookmark
  const toggleBookmark = (problemId: string) => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(problemId)) {
      newBookmarks.delete(problemId);
    } else {
      newBookmarks.add(problemId);
    }
    setBookmarks(newBookmarks);
  };

  // Toggle division
  const toggleDivision = (divId: string) => {
    const newDivs = filters.divisions.includes(divId)
      ? filters.divisions.filter(d => d !== divId)
      : [...filters.divisions, divId];
    setFilters({ ...filters, divisions: newDivs });
  };

  // Toggle index
  const toggleIndex = (idx: string) => {
    const newIndices = filters.indices.includes(idx)
      ? filters.indices.filter(i => i !== idx)
      : [...filters.indices, idx];
    setFilters({ ...filters, indices: newIndices });
  };

  // Toggle rating
  const toggleRating = (rating: number) => {
    const newRatings = filters.ratings.includes(rating)
      ? filters.ratings.filter(r => r !== rating)
      : [...filters.ratings, rating];
    setFilters({ ...filters, ratings: newRatings });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      divisions: [],
      indices: [],
      ratings: [],
      solvedMin: 0,
      solvedMax: 10000000,
      yearMin: 2010,
      yearMax: new Date().getFullYear(),
      tags: [],
      tagMode: 'OR',
      status: 'all',
      search: '',
    });
  };

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.divisions.length > 0) count++;
    if (filters.indices.length > 0) count++;
    if (filters.ratings.length > 0) count++;
    if (filters.solvedMin > 0 || filters.solvedMax < 10000000) count++;
    if (filters.yearMin > 2010 || filters.yearMax < new Date().getFullYear()) count++;
    if (filters.tags.length > 0) count++;
    if (filters.status !== 'all') count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  // Pagination
  const totalPages = Math.ceil(filteredProblems.length / pageSize);
  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    problems.forEach(p => {
      if (p.contestStartTimeSeconds) {
        years.add(new Date(p.contestStartTimeSeconds * 1000).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [problems]);

  const minAvailableYear = availableYears.length > 0 ? Math.min(...availableYears) : 2010;
  const maxAvailableYear = availableYears.length > 0 ? Math.max(...availableYears) : new Date().getFullYear();

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Index', 'Name', 'Rating', 'Solved', 'Category', 'Date', 'Tags'];
    const rows = filteredProblems.map(p => [
      p.contestId,
      p.index,
      p.name,
      p.rating || 'Unrated',
      p.solvedCount,
      p.category,
      formatDate(p.contestStartTimeSeconds),
      p.tags.join('; '),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codeforces-problems.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex p-2 hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              CF
            </div>
            <span className="font-semibold text-lg text-white hidden sm:inline">Filter</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <a 
            href="https://codeforces.com/problemset" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Problemset
          </a>
          <a 
            href="https://codeforces.com/contests" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Contests
          </a>
          <a
            href="https://github.com/mostafa-cse"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside 
          ref={sidebarRef}
          style={{ width: sidebarOpen ? sidebarWidth : 0 }}
          className={`
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            ${sidebarOpen ? 'md:block' : 'hidden'}
            fixed md:relative
            top-14 md:top-0
            left-0
            h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]
            bg-[#161b22] border-r border-[#30363d]
            z-50 md:z-auto
            transition-transform duration-300 flex-shrink-0
          `}
        >
          {/* Scrollable Content */}
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search problems..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{activeFilterCount} filter(s) active</span>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              </div>
            )}

            {/* Track Users */}
            <div className="border border-[#30363d] rounded-lg overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center gap-2 bg-[#0d1117]">
                <User className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-white">Track Users</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter handle"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addUser()}
                    className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={addUser}
                    disabled={userLoading}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {userLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
                
                {trackedUsers.length > 0 && (
                  <div className="space-y-2">
                    {trackedUsers.map((user) => (
                      <div key={user.handle} className="flex items-center justify-between p-2 bg-[#0d1117] rounded-lg">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: user.color }}
                          />
                          <span className="text-sm font-medium text-white">{user.handle}</span>
                        </div>
                        <button
                          onClick={() => removeUser(user.handle)}
                          className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Year Filter */}
            <div className="border border-[#30363d] rounded-lg overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between bg-[#0d1117]">
                <span className="font-medium text-white">Year</span>
                {(filters.yearMin > minAvailableYear || filters.yearMax < maxAvailableYear) && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {filters.yearMin}-{filters.yearMax}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.yearMin}
                    onChange={(e) => setFilters({ ...filters, yearMin: Math.max(minAvailableYear, Math.min(parseInt(e.target.value) || minAvailableYear, filters.yearMax)) })}
                    className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white text-center focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={filters.yearMax}
                    onChange={(e) => setFilters({ ...filters, yearMax: Math.min(maxAvailableYear, Math.max(parseInt(e.target.value) || maxAvailableYear, filters.yearMin)) })}
                    className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white text-center focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Division Filter */}
            <div className="border border-[#30363d] rounded-lg overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between bg-[#0d1117]">
                <span className="font-medium text-white">Division</span>
                {filters.divisions.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {filters.divisions.length}
                  </span>
                )}
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {DIVISIONS.map((div) => (
                  <button
                    key={div.id}
                    onClick={() => toggleDivision(div.id)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                      filters.divisions.includes(div.id)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {div.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Index Filter */}
            <div className="border border-[#30363d] rounded-lg overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between bg-[#0d1117]">
                <span className="font-medium text-white">Problem Index</span>
                {filters.indices.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {filters.indices.length}
                  </span>
                )}
              </div>
              <div className="p-3 grid grid-cols-4 gap-2">
                {INDICES.map((idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleIndex(idx)}
                    className={`px-2 py-2 text-sm rounded-lg border transition-all ${
                      filters.indices.includes(idx)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {idx}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="border border-[#30363d] rounded-lg overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between bg-[#0d1117]">
                <span className="font-medium text-white">Rating</span>
                {filters.ratings.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {filters.ratings.length}
                  </span>
                )}
              </div>
              <div className="p-3 grid grid-cols-4 gap-1.5">
                {RATINGS.map((rating) => (
                  <button
                    key={rating}
                    onClick={() => toggleRating(rating)}
                    className={`px-1.5 py-1.5 text-xs rounded border transition-all ${
                      filters.ratings.includes(rating)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Solved Count Filter */}
            <div className="border border-[#30363d] rounded-lg overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between bg-[#0d1117]">
                <span className="font-medium text-white">Solved Count</span>
                {(filters.solvedMin > 0 || filters.solvedMax < 10000000) && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {formatNumber(filters.solvedMin)}-{formatNumber(filters.solvedMax)}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.solvedMin}
                    onChange={(e) => setFilters({ ...filters, solvedMin: Math.max(0, Math.min(parseInt(e.target.value) || 0, filters.solvedMax)) })}
                    className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white text-center focus:border-blue-500 focus:outline-none"
                    placeholder="Min"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={filters.solvedMax}
                    onChange={(e) => setFilters({ ...filters, solvedMax: Math.min(10000000, Math.max(parseInt(e.target.value) || 10000000, filters.solvedMin)) })}
                    className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white text-center focus:border-blue-500 focus:outline-none"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            <div className="border border-[#30363d] rounded-lg overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between bg-[#0d1117]">
                <span className="font-medium text-white">Tags</span>
                {filters.tags.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {filters.tags.length}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, tagMode: 'OR' })}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                      filters.tagMode === 'OR'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    OR
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, tagMode: 'AND' })}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                      filters.tagMode === 'AND'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    AND
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {ALL_TAGS.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center gap-2 p-2 hover:bg-[#21262d] rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag)}
                        onChange={() => {
                          const newTags = filters.tags.includes(tag)
                            ? filters.tags.filter(t => t !== tag)
                            : [...filters.tags, tag];
                          setFilters({ ...filters, tags: newTags });
                        }}
                        className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-gray-300">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="border border-[#30363d] rounded-lg overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between bg-[#0d1117]">
                <span className="font-medium text-white">Status</span>
                {filters.status !== 'all' && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full capitalize">
                    {filters.status}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                {['all', 'solved', 'unsolved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilters({ ...filters, status: status as any })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all capitalize ${
                      filters.status === status
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-[#0d1117] border-[#30363d] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className={`
              absolute top-0 right-0 w-1 h-full cursor-col-resize
              hover:bg-blue-500/50 active:bg-blue-500
              transition-colors z-10
              ${isResizing ? 'bg-blue-500' : 'bg-transparent'}
            `}
            title="Drag to resize sidebar"
          >
            <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-8 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-gray-500" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
          {/* Toolbar - Fixed */}
          <div className="h-14 border-b border-[#30363d] flex items-center justify-between px-4 bg-[#161b22] flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Showing <span className="text-white font-medium">{Math.min((currentPage - 1) * pageSize + 1, filteredProblems.length)}-{Math.min(currentPage * pageSize, filteredProblems.length)}</span> of <span className="text-white font-medium">{filteredProblems.length.toLocaleString()}</span> problems
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={15}>15 / page</option>
                <option value={20}>20 / page</option>
                <option value={25}>25 / page</option>
                <option value={30}>30 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          {/* Problem Table - Scrollable */}
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="sticky top-0 z-10">
                <tr className="text-left bg-[#161b22]">
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-10 border-b border-[#30363d]"></th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-16 border-b border-[#30363d]">ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-16 border-b border-[#30363d]">Index</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#30363d]">Problem</th>
                  <th 
                    className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors border-b border-[#30363d]"
                    onClick={() => {
                      if (sortField === 'rating') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('rating');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Rating
                      {sortField === 'rating' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors border-b border-[#30363d]"
                    onClick={() => {
                      if (sortField === 'solved') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('solved');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Solved
                      {sortField === 'solved' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#30363d]">Category</th>
                  <th 
                    className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors border-b border-[#30363d]"
                    onClick={() => {
                      if (sortField === 'date') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('date');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#30363d]">Tags</th>
                  {trackedUsers.length > 0 && (
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#30363d]">Users</th>
                  )}
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-20 border-b border-[#30363d]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProblems.map((problem) => {
                  const problemId = `${problem.contestId}-${problem.index}`;
                  const isBookmarked = bookmarks.has(problemId);
                  
                  return (
                    <tr key={problemId} className="group hover:bg-[#161b22]/50">
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        <button
                          onClick={() => toggleBookmark(problemId)}
                          className={`transition-colors ${isBookmarked ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        <span className="font-mono text-sm text-gray-400">{problem.contestId}</span>
                      </td>
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        <span className="font-mono text-sm text-gray-400">{problem.index}</span>
                      </td>
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        <div className="flex items-center gap-2">
                          {trackedUsers.length > 0 && (
                            (() => {
                              const key = `${problem.contestId}-${problem.index}`;
                              const solvedUser = trackedUsers.find(u => u.submissions.get(key) === 'OK');
                              const attemptedUser = trackedUsers.find(u => {
                                const verdict = u.submissions.get(key);
                                return verdict && verdict !== 'OK';
                              });
                              
                              if (solvedUser) {
                                return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
                              } else if (attemptedUser) {
                                const verdict = attemptedUser.submissions.get(key) || '';
                                return <span className="flex-shrink-0">{getVerdictIcon(verdict)}</span>;
                              }
                              return <div className="w-4 h-4 flex-shrink-0" />;
                            })()
                          )}
                          
                          <a
                            href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-white hover:text-blue-400 transition-colors line-clamp-1"
                          >
                            {problem.name}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        {problem.rating ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRatingBgColor(problem.rating)} text-black`}>
                            {problem.rating}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Unrated</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        <span className="text-sm text-gray-400">{formatNumber(problem.solvedCount)}</span>
                      </td>
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        <span className="text-xs px-2 py-1 bg-[#0d1117] rounded text-gray-400 border border-[#30363d]">{problem.category}</span>
                      </td>
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        <span className="text-sm text-gray-400">{formatDate(problem.contestStartTimeSeconds)}</span>
                      </td>
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        <div className="flex flex-wrap gap-1">
                          {problem.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-[#0d1117] rounded text-gray-400 border border-[#30363d]">
                              {tag}
                            </span>
                          ))}
                          {problem.tags.length > 2 && (
                            <span className="text-xs px-2 py-0.5 bg-[#0d1117] rounded text-gray-400 border border-[#30363d]">
                              +{problem.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      {trackedUsers.length > 0 && (
                        <td className="px-4 py-3 border-b border-[#21262d]">
                          <div className="flex gap-1">
                            {trackedUsers.map((user) => {
                              const key = `${problem.contestId}-${problem.index}`;
                              const verdict = user.submissions.get(key);
                              if (!verdict) return null;
                              
                              return (
                                <div
                                  key={user.handle}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                                  style={{ backgroundColor: user.color }}
                                  title={`${user.handle}: ${verdict}`}
                                >
                                  {user.handle[0].toUpperCase()}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 border-b border-[#21262d]">
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-[#21262d] rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Open problem"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {paginatedProblems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Filter className="w-12 h-12 text-gray-500 mb-4" />
                <p className="text-gray-400">No problems match your filters</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination - Fixed at bottom */}
          {totalPages > 1 && (
            <div className="h-14 border-t border-[#30363d] flex items-center justify-center gap-2 px-4 bg-[#161b22] flex-shrink-0">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 hover:bg-[#21262d] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-300 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-[#21262d] text-gray-400'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 hover:bg-[#21262d] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-300 flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="h-10 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>CF Filter</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Powered by Codeforces API</span>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="https://codeforces.com/profile/m0stafa" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            @m0stafa
          </a>
        </div>
      </footer>
    </div>
  );
}
