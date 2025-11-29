/**
 * Sitemap Generator for NoteWeb
 *
 * Run with: node scripts/generate-sitemap.js
 *
 * This script reads blog posts from data/blogPosts.ts and generates
 * a sitemap.xml file in the public directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://noteweb.co';
const TODAY = new Date().toISOString().split('T')[0];

// Static pages configuration
const staticPages = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/help', changefreq: 'monthly', priority: '0.7' },
];

// Read and parse blog posts from the TypeScript file
function getBlogPosts() {
  const blogPostsPath = path.join(__dirname, '../data/blogPosts.ts');
  const content = fs.readFileSync(blogPostsPath, 'utf-8');

  // Extract blog post data using regex
  const posts = [];
  const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
  const dateRegex = /publishedAt:\s*['"]([^'"]+)['"]/g;

  const slugs = [...content.matchAll(slugRegex)].map(m => m[1]);
  const dates = [...content.matchAll(dateRegex)].map(m => m[1]);

  slugs.forEach((slug, index) => {
    posts.push({
      slug,
      publishedAt: dates[index] || TODAY,
    });
  });

  return posts;
}

// Generate sitemap XML
function generateSitemap() {
  const blogPosts = getBlogPosts();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
`;

  // Add static pages
  staticPages.forEach(page => {
    xml += `  <url>
    <loc>${DOMAIN}${page.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  xml += `
  <!-- Blog Posts (Dynamic) -->
`;

  // Add blog posts
  blogPosts.forEach(post => {
    xml += `  <url>
    <loc>${DOMAIN}/blog/${post.slug}</loc>
    <lastmod>${post.publishedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  });

  xml += `</urlset>
`;

  return xml;
}

// Write sitemap to file
function writeSitemap() {
  const sitemap = generateSitemap();
  const outputPath = path.join(__dirname, '../public/sitemap.xml');

  fs.writeFileSync(outputPath, sitemap);
  console.log(`✅ Sitemap generated at: ${outputPath}`);
  console.log(`   - ${staticPages.length} static pages`);
  console.log(`   - ${getBlogPosts().length} blog posts`);
}

writeSitemap();
