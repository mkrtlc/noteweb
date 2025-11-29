import React from 'react';
import { Link } from 'react-router-dom';
import { getAllBlogPosts } from '../data/blogPosts';
import { Network, ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';

const BlogList: React.FC = () => {
  const posts = getAllBlogPosts();

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-700 hover:text-brand-600 transition-colors">
            <Network className="w-5 h-5 text-brand-600" />
            <span className="font-bold">NoteWeb</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">NoteWeb Blog</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tips, tutorials, and insights on note-taking, personal knowledge management, and getting the most out of NoteWeb.
          </p>
        </div>
      </div>

      {/* Posts */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-brand-200 transition-all group"
            >
              <Link to={`/blog/${post.slug}`}>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readingTime}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-slate-900 group-hover:text-brand-600 transition-colors mb-2">
                  {post.title}
                </h2>

                <p className="text-slate-600 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} NoteWeb. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BlogList;
