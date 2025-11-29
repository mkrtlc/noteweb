import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { getBlogPost } from '../data/blogPosts';
import { Network, ArrowLeft, Calendar, Clock, Tag, User } from 'lucide-react';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Simple markdown-like rendering (basic)
  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Headings
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold text-slate-900 mt-6 mb-3">{line.slice(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold text-slate-900 mt-8 mb-4">{line.slice(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-slate-900 mt-8 mb-4">{line.slice(2)}</h1>;
      }

      // Horizontal rule
      if (line.startsWith('---')) {
        return <hr key={index} className="my-8 border-slate-200" />;
      }

      // Code blocks
      if (line.startsWith('```')) {
        return null; // Skip code fence markers
      }

      // List items
      if (line.startsWith('- ')) {
        const content = line.slice(2);
        return (
          <li key={index} className="ml-6 text-slate-700 mb-1">
            {renderInlineStyles(content)}
          </li>
        );
      }
      if (/^\d+\. /.test(line)) {
        const content = line.replace(/^\d+\. /, '');
        return (
          <li key={index} className="ml-6 text-slate-700 mb-1 list-decimal">
            {renderInlineStyles(content)}
          </li>
        );
      }

      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-4" />;
      }

      // Regular paragraphs
      return (
        <p key={index} className="text-slate-700 leading-relaxed mb-4">
          {renderInlineStyles(line)}
        </p>
      );
    });
  };

  // Handle inline styles (bold, italic, code)
  const renderInlineStyles = (text: string) => {
    // This is a simplified renderer - in production, use a proper markdown library
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
        }
        parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Italic
      const italicMatch = remaining.match(/\*(.+?)\*/);
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
        }
        parts.push(<em key={key++}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // Inline code
      const codeMatch = remaining.match(/`(.+?)`/);
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
        }
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
        continue;
      }

      // No more matches, add remaining text
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    return parts;
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-700 hover:text-brand-600 transition-colors">
            <Network className="w-5 h-5 text-brand-600" />
            <span className="font-bold">NoteWeb</span>
          </Link>
          <Link
            to="/blog"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Posts
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex-1">
        <article className="bg-white rounded-xl border border-slate-200 p-8 md:p-12">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6">
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
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {post.author}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {post.title}
          </h1>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-8 pb-8 border-b border-slate-200">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="prose prose-slate max-w-none">
            {renderContent(post.content)}
          </div>
        </article>

        {/* CTA */}
        <div className="mt-8 bg-brand-50 rounded-xl border border-brand-100 p-8 text-center">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to try NoteWeb?</h3>
          <p className="text-slate-600 mb-4">Start building your personal knowledge graph today.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Network className="w-5 h-5" />
            Open NoteWeb
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} NoteWeb. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPostPage;
