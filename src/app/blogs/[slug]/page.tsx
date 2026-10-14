'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/api';
import {
  Calendar,
  Eye,
  User,
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Share2,
  Bookmark,
} from 'lucide-react';

interface CommentItem {
  id: string;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
}

interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  main_image?: string;
  category: string;
  author: string;
  views: number;
  published_at: string;
  comments: CommentItem[];
}

interface SidebarBlogItem {
  id: string;
  title: string;
  slug: string;
  featured_image?: string;
  main_image?: string;
  published_at: string;
  views: number;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<BlogPostDetail | null>(null);
  const [latestBlogs, setLatestBlogs] = useState<SidebarBlogItem[]>([]);
  const [popularBlogs, setPopularBlogs] = useState<SidebarBlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment Form state
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccessMsg, setCommentSuccessMsg] = useState<string | null>(null);
  const [commentErrorMsg, setCommentErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/blogs/${slug}`);
        if (!res.ok) {
          throw new Error('Article not found');
        }
        const data = await res.json();
        setBlog(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

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

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog || !commentName.trim() || !commentEmail.trim() || !commentText.trim()) {
      setCommentErrorMsg('Please fill in your name, email, and comment text.');
      return;
    }

    setSubmittingComment(true);
    setCommentErrorMsg(null);
    setCommentSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/blogs/${blog.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: commentName.trim(),
          author_email: commentEmail.trim(),
          content: commentText.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to submit comment');
      }

      setCommentText('');
      setCommentSuccessMsg('Thank you! Your comment has been submitted and is awaiting approval by admin.');
    } catch (err: any) {
      setCommentErrorMsg(err.message || 'Failed to submit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-16 px-4 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-48" />
        <div className="h-10 bg-muted rounded w-3/4" />
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-background py-20 px-4 max-w-xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">Article Not Found</h1>
        <p className="text-sm text-muted-foreground">{error || 'The requested blog post could not be found.'}</p>
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs"
        >
          <ArrowLeft size={14} /> Back to All Posts
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <Link href="/blogs" className="hover:text-primary transition">Blogs</Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-medium truncate max-w-xs sm:max-w-md">{blog.title}</span>
        </nav>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Article & Comments (8 of 12) */}
          <article className="lg:col-span-8 space-y-8">
            {/* Header info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-emerald-800 text-white text-xs font-semibold rounded-full">
                  {blog.category || 'Abaya'}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={13} />
                  <span>{formatDate(blog.published_at)}</span>
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye size={13} />
                  <span>{blog.views} views</span>
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User size={13} />
                  <span>By {blog.author}</span>
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {blog.title}
              </h1>

              {blog.excerpt && (
                <p className="text-base text-muted-foreground leading-relaxed italic border-l-4 border-primary/60 pl-4 py-1">
                  {blog.excerpt}
                </p>
              )}
            </div>

            {/* Main Cover Banner (Uses main_image or featured_image fallback) */}
            {(blog.main_image || blog.featured_image) && (
              <div className="w-full rounded-2xl overflow-hidden bg-muted shadow-md border border-border">
                <img
                  src={blog.main_image || blog.featured_image}
                  alt={blog.title}
                  className="w-full max-h-[520px] object-cover"
                />
              </div>
            )}

            {/* Rich Article Body */}
            <div
              className="prose prose-stone dark:prose-invert max-w-none text-foreground leading-relaxed space-y-4 text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Divider */}
            <div className="pt-6 border-t border-border" />

            {/* ==================================================== */}
            {/* COMMENTS SECTION (Matches Screenshot 2 Exactly!)    */}
            {/* ==================================================== */}
            <section className="space-y-8 pt-2">
              {/* Comments Title */}
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-emerald-800 dark:text-emerald-400">
                  Comments ({blog.comments?.length || 0})
                </h2>

                {/* If No Comments */}
                {(!blog.comments || blog.comments.length === 0) ? (
                  <p className="text-sm italic text-muted-foreground mt-3">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  /* Comments List */
                  <div className="mt-6 space-y-4 divide-y divide-border">
                    {blog.comments.map((comment) => (
                      <div key={comment.id} className="pt-4 first:pt-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-foreground">
                            {comment.author_name}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leave a Comment Box Card (Matches Screenshot 2) */}
              <div className="bg-card border border-border/80 rounded-xl p-6 sm:p-8 shadow-xs space-y-5">
                <h3 className="text-base sm:text-lg font-serif font-bold text-emerald-900 dark:text-emerald-400">
                  Leave a Comment
                </h3>

                {commentSuccessMsg && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{commentSuccessMsg}</span>
                  </div>
                )}

                {commentErrorMsg && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{commentErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handlePostComment} className="space-y-4">
                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={commentEmail}
                        onChange={(e) => setCommentEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Comment
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-y"
                    />
                  </div>

                  {/* Post Comment Button (Green/Emerald Matching Screenshot 2) */}
                  <div>
                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {submittingComment ? 'Posting Comment...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </article>

          {/* Right Column: Sidebar (4 of 12) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* 1. Latest Blogs Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-base font-serif font-bold text-emerald-800 dark:text-emerald-400 pb-2 border-b border-border">
                Latest Blogs
              </h2>

              <div className="divide-y divide-border/60">
                {latestBlogs.map((item) => (
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
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(item.published_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 2. Popular Blogs Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-base font-serif font-bold text-emerald-800 dark:text-emerald-400 pb-2 border-b border-border">
                Popular Blogs
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
