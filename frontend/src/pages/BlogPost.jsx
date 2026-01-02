import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { getAllSettings } from '../services/siteSettingsService';
import { getBlogPostBySlug, getRelatedBlogPosts } from '../services/blogService';
import { COMPANY_INFO } from '../constants';

const BlogPost = () => {
  const { slug } = useParams();
  const [settings, setSettings] = useState(null);
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [settingsData, postData] = await Promise.all([
        getAllSettings(),
        getBlogPostBySlug(slug)
      ]);
      setSettings(settingsData);
      setPost(postData);
      
      if (postData) {
        const related = await getRelatedBlogPosts(slug);
        setRelatedPosts(related);
      }
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  const branding = settings?.branding || COMPANY_INFO;
  const services = settings?.services || [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-32 pb-32 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-medium text-slate-500">Loading Article...</h1>
          </div>
        </div>
        <Footer branding={branding} services={services} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-32 pb-32 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-6">📄</div>
            <h1 className="text-2xl font-bold text-slate-700 mb-4">Article Not Found</h1>
            <p className="text-slate-500 mb-8">The article you're looking for doesn't exist or has been removed.</p>
            <Link to="/blog" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
              ← Back to Blog
            </Link>
          </div>
        </div>
        <Footer branding={branding} services={services} />
      </div>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareOnTwitter = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post.title)}`, '_blank');
  const shareOnFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
  const shareOnLinkedIn = () => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(post.title)}`, '_blank');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{post.meta_title_computed || post.title} | {branding.company_name || 'PhysioWay'} Blog</title>
        <meta name="description" content={post.meta_description_computed || post.excerpt} />
        <meta name="keywords" content={post.meta_keywords || post.tags_list?.join(', ')} />
        <meta name="author" content={post.author_name} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.meta_title_computed || post.title} />
        <meta property="og:description" content={post.meta_description_computed || post.excerpt} />
        <meta property="og:image" content={post.featured_image_url} />
        <meta property="og:url" content={currentUrl} />
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:author" content={post.author_name} />
        <meta property="article:section" content={post.category_display} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.meta_title_computed || post.title} />
        <meta name="twitter:description" content={post.meta_description_computed || post.excerpt} />
        <meta name="twitter:image" content={post.featured_image_url} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={currentUrl} />
      </Helmet>

      <Navbar />

      {/* Article */}
      <article itemScope itemType="https://schema.org/BlogPosting">
        {/* Hero Section */}
        <header className="relative pt-24 lg:pt-28 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Background Image */}
          {post.featured_image_url && (
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60 z-10" />
              <img
                src={post.featured_image_url}
                alt={post.featured_image_alt || post.title}
                className="w-full h-full object-cover opacity-40"
              />
            </div>
          )}

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            {/* Breadcrumb - SEO friendly */}
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex items-center text-sm text-slate-400" itemScope itemType="https://schema.org/BreadcrumbList">
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link to="/" itemProp="item" className="hover:text-white transition-colors">
                    <span itemProp="name">Home</span>
                  </Link>
                  <meta itemProp="position" content="1" />
                </li>
                <span className="mx-3 text-slate-600">/</span>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link to="/blog" itemProp="item" className="hover:text-white transition-colors">
                    <span itemProp="name">Blog</span>
                  </Link>
                  <meta itemProp="position" content="2" />
                </li>
                <span className="mx-3 text-slate-600">/</span>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <span itemProp="name" className="text-blue-400">{post.category_display}</span>
                  <meta itemProp="position" content="3" />
                </li>
              </ol>
            </nav>

            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 rounded-full text-sm font-semibold">
                {post.category_display}
              </span>
            </div>

            {/* Title */}
            <h1 itemProp="headline" className="text-3xl lg:text-5xl font-heading font-bold text-white leading-tight mb-8">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p itemProp="description" className="text-lg text-slate-300 mb-8 max-w-3xl leading-relaxed">
              {post.excerpt}
            </p>

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Author */}
              <div className="flex items-center" itemProp="author" itemScope itemType="https://schema.org/Person">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold mr-3 overflow-hidden">
                  {post.author_image_url ? (
                    <img src={post.author_image_url} alt={post.author_name} className="w-full h-full object-cover" />
                  ) : (
                    post.author_name?.charAt(0) || 'P'
                  )}
                </div>
                <div>
                  <div itemProp="name" className="font-semibold text-white">{post.author_name}</div>
                  {post.author_title && <div className="text-sm text-slate-400">{post.author_title}</div>}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-400">
                <time itemProp="datePublished" dateTime={post.published_at} className="flex items-center">
                  <span className="mr-2">📅</span>
                  {formatDate(post.published_at)}
                </time>
                <span className="flex items-center">
                  <span className="mr-2">⏱️</span>
                  {post.read_time_minutes} min read
                </span>
                {post.view_count > 0 && (
                  <span className="flex items-center">
                    <span className="mr-2">👁️</span>
                    {post.view_count.toLocaleString()} views
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 60V30C360 10 720 0 1080 20C1260 30 1380 45 1440 50V60H0Z" fill="#f8fafc"/>
            </svg>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Featured Image */}
          {post.featured_image_url && (
            <figure className="mb-12 -mt-20 relative z-10">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100">
                <img
                  itemProp="image"
                  src={post.featured_image_url}
                  alt={post.featured_image_alt || post.title}
                  className="w-full h-auto"
                />
              </div>
              {post.featured_image_alt && (
                <figcaption className="text-center text-sm text-slate-500 mt-3">{post.featured_image_alt}</figcaption>
              )}
            </figure>
          )}

          {/* Article Body */}
          <div 
            itemProp="articleBody"
            className="prose prose-lg max-w-none prose-slate 
              prose-headings:font-heading prose-headings:font-bold prose-headings:text-slate-800
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-slate-100
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-slate-600 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-800
              prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-slate-700
              prose-ul:my-6 prose-li:text-slate-600
              prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags_list && post.tags_list.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Related Topics</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags_list.map((tag, index) => (
                  <span key={index} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio */}
          {post.author_bio && (
            <div className="mt-12 p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
                  {post.author_image_url ? (
                    <img src={post.author_image_url} alt={post.author_name} className="w-full h-full object-cover" />
                  ) : (
                    post.author_name?.charAt(0) || 'P'
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">About {post.author_name}</h4>
                  {post.author_title && <p className="text-sm text-blue-600 mb-2">{post.author_title}</p>}
                  <p className="text-slate-600 leading-relaxed">{post.author_bio}</p>
                </div>
              </div>
            </div>
          )}

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Share this article</h3>
                <div className="flex gap-3">
                  <button 
                    onClick={shareOnFacebook}
                    className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all shadow-lg shadow-blue-600/25"
                    aria-label="Share on Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
                  </button>
                  <button 
                    onClick={shareOnTwitter}
                    className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 hover:scale-110 transition-all shadow-lg shadow-slate-800/25"
                    aria-label="Share on X (Twitter)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button 
                    onClick={shareOnLinkedIn}
                    className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 hover:scale-110 transition-all shadow-lg shadow-blue-700/25"
                    aria-label="Share on LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </button>
                </div>
              </div>
              <Link to="/blog" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                ← Back to All Articles
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="py-16 lg:py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-bold text-slate-800">Related Articles</h2>
              <p className="text-slate-500 mt-3">Continue reading with these related health insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <article key={relatedPost.id || relatedPost.slug} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {relatedPost.featured_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={relatedPost.featured_image_url} 
                        alt={relatedPost.featured_image_alt || relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{relatedPost.category_display}</span>
                    <h3 className="text-lg font-bold text-slate-800 mt-2 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      <Link to={`/blog/${relatedPost.slug}`}>
                        {relatedPost.title}
                      </Link>
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">{relatedPost.excerpt}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{relatedPost.read_time_minutes} min read</span>
                      <Link to={`/blog/${relatedPost.slug}`} className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-300/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-3xl" />
        </div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-slate-800 mb-6">
            Ready to Start Your Recovery Journey?
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Book a free consultation and discover how our expert physiotherapists can help you recover in the comfort of your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-consultation" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-1">
              Book Free Consultation
            </Link>
            <a href={`tel:${branding.phone || COMPANY_INFO.phone}`} className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-white hover:border-blue-300 transition-all hover:-translate-y-1 shadow-sm">
              Call {branding.phone || COMPANY_INFO.phone}
            </a>
          </div>
        </div>
      </section>

      <Footer branding={branding} services={services} />
    </div>
  );
};

export default BlogPost;
