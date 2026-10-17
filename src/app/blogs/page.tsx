'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
import { Search, Eye, Calendar, ArrowRight, BookOpen, TrendingUp, X, Sparkles, Tag } from 'lucide-react';

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  main_image?: string;
  category: string;
  author: string;
  views: number;
  published_at: string;
  comments_count?: number;
}

interface SidebarBlogItem {
  id: string;
  title: string;
  slug: string;
  featured_image?: string;
  main_image?: string;
  published_at: string;
  views: number;
  category: string;
}

const POPULAR_SEARCH_TAGS = ['Abaya', 'Bridal', 'Kimono', 'Silk', 'Everyday', 'Fabric Guide'];

function BlogsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || 'all';

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [latestBlogs, setLatestBlogs] = useState<SidebarBlogItem[]>([]);
  const [popularBlogs, setPopularBlogs] = useState<SidebarBlogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [activeSort, setActiveSort] = useState<'latest' | 'popular'>('latest');
  const [loading, setLoading] = useState(true);

  // Sync state if URL changes externally
  useEffect(() => {
    const s = searchParams.get('search') || searchParams.get('q') || '';
    if (s !== searchQuery) {
      setSearchQuery(s);
    }
  }, [searchParams]);

  // Fetch dynamic categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/blogs/categories`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSearchSubmit = (text: string) => {
    setSearchQuery(text);
    const params = new URLSearchParams();
    if (text.trim()) params.set('search', text.trim());
    if (selectedCategory && selectedCategory.toLowerCase() !== 'all') {
      params.set('category', selectedCategory);
    }
    const qs = params.toString();
    router.replace(`/blogs${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSidebarSearch('');
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory.toLowerCase() !== 'all') {
      params.set('category', selectedCategory);
    }
    const qs = params.toString();
    router.replace(`/blogs${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  // Fetch blogs when search, category, or sort changes
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
        if (selectedCategory && selectedCategory.toLowerCase() !== 'all') {
          queryParams.set('category', selectedCategory);
        }
        if (activeSort) queryParams.set('sort', activeSort);

        const res = await fetch(`${API_BASE_URL}/blogs?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setBlogs(data);
        }
      } catch (err) {
        console.error('Failed to load blogs:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchBlogs, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, activeSort]);

  // Fetch sidebar widgets
  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const [resLatest, resPop] = await Promise.all([
          fetch(`${API_BASE_URL}/blogs/latest?limit=5`),
          fetch(`${API_BASE_URL}/blogs/popular?limit=5`),
        ]);
        if (resLatest.ok) setLatestBlogs(await resLatest.json());
        if (resPop.ok) setPopularBlogs(await resPop.json());
      } catch (err) {
        console.error('Failed to fetch sidebar widgets:', err);
      }
    };

    fetchSidebar();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top Search Bar & Category Filter Pills */}
        <div className="space-y-5">
          <div className="flex justify-center">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit(searchQuery);
              }}
              className="relative w-full max-w-lg"
            >
              <input
                type="text"
                placeholder="Search articles by title, fabric, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-5 pr-20 py-3 bg-card border border-border rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-xs transition"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
                <button
                  type="submit"
                  className="p-2 rounded-full text-primary hover:bg-primary/10 transition cursor-pointer"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
              </div>
            </form>
          </div>

          {/* Dynamic Category Filter Pills */}
          <div className="flex items-center justify-center flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                const params = new URLSearchParams();
                if (searchQuery.trim()) params.set('search', searchQuery.trim());
                const qs = params.toString();
                router.replace(`/blogs${qs ? `?${qs}` : ''}`, { scroll: false });
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                selectedCategory.toLowerCase() === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const newCat = isActive ? 'all' : cat;
                    setSelectedCategory(newCat);
                    const params = new URLSearchParams();
                    if (searchQuery.trim()) params.set('search', searchQuery.trim());
                    if (newCat !== 'all') params.set('category', newCat);
                    const qs = params.toString();
                    router.replace(`/blogs${qs ? `?${qs}` : ''}`, { scroll: false });
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Left Posts (2-Cols) & Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: All Posts Grid (8 of 12 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active Search Result Alert Banner */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between p-3.5 bg-primary/10 border border-primary/25 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-foreground">
                  <Search size={15} className="text-primary shrink-0" />
                  <span>
                    Showing search results for &ldquo;<strong className="text-primary">{searchQuery.trim()}</strong>&rdquo;
                    {!loading && (
                      <span className="text-muted-foreground ml-1.5 font-normal">
                        ({blogs.length} {blogs.length === 1 ? 'article' : 'articles'} found)
                      </span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer shrink-0 ml-3"
                >
                  <X size={13} />
                  <span>Clear Search</span>
                </button>
              </div>
            )}

            {/* Header: All Posts with sort tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                  {selectedCategory.toLowerCase() === 'all' ? 'All Posts' : `${selectedCategory}`}
                </h1>
                {selectedCategory.toLowerCase() !== 'all' && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      const params = new URLSearchParams();
                      if (searchQuery.trim()) params.set('search', searchQuery.trim());
                      const qs = params.toString();
                      router.replace(`/blogs${qs ? `?${qs}` : ''}`, { scroll: false });
                    }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    (Reset to all)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveSort('latest')}
                  className={`pb-1 transition cursor-pointer ${
                    activeSort === 'latest'
                      ? 'text-primary font-bold border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Latest
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSort('popular')}
                  className={`pb-1 transition cursor-pointer ${
                    activeSort === 'popular'
                      ? 'text-primary font-bold border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>

            {/* Posts Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse space-y-3">
                    <div className="h-48 bg-muted rounded-lg" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-5 bg-muted rounded w-5/6" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl p-8 space-y-3">
                <BookOpen className="mx-auto text-muted-foreground" size={36} />
                <h3 className="font-serif text-lg font-bold">No blog posts found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery
                    ? `No articles matched "${searchQuery}". Try a different keyword.`
                    : selectedCategory.toLowerCase() !== 'all'
                    ? `No articles found in category "${selectedCategory}".`
                    : 'Check back soon for latest modest fashion guides and abaya styling tips.'}
                </p>
                {(searchQuery || selectedCategory.toLowerCase() !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogs.map((blog) => (
                  <article
                    key={blog.id}
                    className="group bg-card border border-border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    {/* Featured / Main Image with category badge */}
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                      {blog.featured_image || blog.main_image ? (
                        <img
                          src={blog.featured_image || blog.main_image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                          Saba Al Wadi
                        </div>
                      )}
                      {/* Clickable Category Badge (top left) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCategory(blog.category || 'Abaya');
                        }}
                        className="absolute top-3 left-3 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full shadow-md transition cursor-pointer"
                        title={`Filter by ${blog.category || 'Abaya'}`}
                      >
                        {blog.category || 'Abaya'}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        {/* Meta row: Date & View Count */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground/80">
                            {formatDate(blog.published_at)}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <Eye size={13} className="text-muted-foreground" />
                            <span>{blog.views}</span>
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="font-serif text-base font-bold text-foreground group-hover:text-primary transition line-clamp-2 leading-snug">
                          <Link href={`/blogs/${blog.slug}`}>{blog.title}</Link>
                        </h2>
                      </div>

                      {/* Read More Link */}
                      <div className="pt-2">
                        <Link
                          href={`/blogs/${blog.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition"
                        >
                          <span>Read More</span>
                          <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sidebar (4 of 12 cols) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* 1. Search Articles Sidebar Widget */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3.5">
              <h2 className="text-base font-serif font-bold text-foreground pb-2 border-b border-border flex items-center justify-between">
                <span>Search Articles</span>
                <Search size={15} className="text-primary" />
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (sidebarSearch.trim()) {
                    handleSearchSubmit(sidebarSearch.trim());
                  }
                }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Keywords (e.g. Silk, Abaya)..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-background border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-primary hover:bg-primary/10 transition cursor-pointer"
                  aria-label="Search articles"
                >
                  <Search size={15} />
                </button>
              </form>

              {/* Popular Search Tag Pills */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-medium text-muted-foreground block flex items-center gap-1">
                  <Tag size={11} className="text-primary" /> Popular Topics:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSidebarSearch(tag);
                        handleSearchSubmit(tag);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border transition font-medium cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Categories Sidebar Card */}
            {categories.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
                <h2 className="text-base font-serif font-bold text-emerald-800 dark:text-emerald-400 pb-2 border-b border-border flex items-center justify-between">
                  <span>Categories</span>
                  <BookOpen size={14} className="text-primary" />
                </h2>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      const params = new URLSearchParams();
                      if (searchQuery.trim()) params.set('search', searchQuery.trim());
                      const qs = params.toString();
                      router.replace(`/blogs${qs ? `?${qs}` : ''}`, { scroll: false });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                      selectedCategory.toLowerCase() === 'all'
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-muted/50 border border-border text-foreground hover:border-primary/40'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => {
                    const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const newCat = isActive ? 'all' : cat;
                          setSelectedCategory(newCat);
                          const params = new URLSearchParams();
                          if (searchQuery.trim()) params.set('search', searchQuery.trim());
                          if (newCat !== 'all') params.set('category', newCat);
                          const qs = params.toString();
                          router.replace(`/blogs${qs ? `?${qs}` : ''}`, { scroll: false });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'bg-muted/50 border border-border text-foreground hover:border-primary/40'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Latest Blogs Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-base font-serif font-bold text-emerald-800 dark:text-emerald-400 pb-2 border-b border-border flex items-center gap-2">
                <span>Latest Blogs</span>
              </h2>

              <div className="divide-y divide-border/60">
                {latestBlogs.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blogs/${item.slug}`}
                    className="py-3 first:pt-0 last:pb-0 flex items-center gap-3.5 group cursor-pointer block"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted border border-border">
                      {item.featured_image || item.main_image ? (
                        <img
                          src={item.featured_image || item.main_image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Post
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition line-clamp-2 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(item.published_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. Popular Blogs Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-base font-serif font-bold text-emerald-800 dark:text-emerald-400 pb-2 border-b border-border flex items-center gap-2">
                <span>Popular Blogs</span>
              </h2>

              <div className="divide-y divide-border/60">
                {popularBlogs.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blogs/${item.slug}`}
                    className="py-3 first:pt-0 last:pb-0 flex items-center gap-3.5 group cursor-pointer block"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted border border-border">
                      {item.featured_image ? (
                        <img
                          src={item.featured_image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Post
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition line-clamp-2 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye size={11} />
                        <span>{item.views} views</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-10" />}>
      <BlogsContent />
    </Suspense>
  );
}
