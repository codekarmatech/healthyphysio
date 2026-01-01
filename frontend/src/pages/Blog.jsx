import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/common/PageHeader';
import { getAllSettings } from '../services/siteSettingsService';
import { BLOG_CATEGORIES, COMPANY_INFO } from '../constants';

const Blog = () => {
  const [settings, setSettings] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getAllSettings();
      setSettings(data);
      document.title = `Blog - ${data?.branding?.company_name || 'PhysioWay'}`;
    };
    fetchSettings();
  }, []);

  const branding = settings?.branding || COMPANY_INFO;
  const services = settings?.services || [];
  const pageSettings = settings?.page_settings?.blog || {};

  // Sample blog posts - in real app, this would come from API/CMS
  const blogPosts = [
    {
      id: 1,
      title: 'Benefits of Home Physiotherapy: Why Treatment at Home is More Effective',
      excerpt: 'Discover the numerous advantages of receiving physiotherapy treatment in the comfort of your own home, from better compliance to personalized care.',
      content: 'Full article content would be here...',
      category: 'Treatment Tips',
      author: 'Dr. Rajavi Dixit',
      date: '2024-11-15',
      readTime: '5 min read',
      image: '🏠',
      tags: ['Home Care', 'Benefits', 'Treatment'],
      featured: true
    },
    {
      id: 2,
      title: 'Post-Surgery Recovery: Essential Guidelines for Faster Healing',
      excerpt: 'Learn the essential steps and techniques for effective post-surgical rehabilitation and recovery through physiotherapy.',
      content: 'Full article content would be here...',
      category: 'Recovery Stories',
      author: 'Dr. Sarah Johnson',
      date: '2024-11-12',
      readTime: '7 min read',
      image: '🏥',
      tags: ['Surgery', 'Recovery', 'Rehabilitation'],
      featured: false
    },
    {
      id: 3,
      title: 'Managing Chronic Pain with Physiotherapy: A Comprehensive Guide',
      excerpt: 'Effective strategies and techniques for managing chronic pain through physiotherapy and lifestyle modifications.',
      content: 'Full article content would be here...',
      category: 'Health & Wellness',
      author: 'Dr. Michael Chen',
      date: '2024-11-10',
      readTime: '6 min read',
      image: '💪',
      tags: ['Chronic Pain', 'Management', 'Wellness'],
      featured: true
    },
    {
      id: 4,
      title: 'Neurological Rehabilitation: Hope and Recovery After Stroke',
      excerpt: 'Understanding the journey of neurological rehabilitation and how specialized physiotherapy can help stroke patients regain independence.',
      content: 'Full article content would be here...',
      category: 'Treatment Tips',
      author: 'Dr. Rajavi Dixit',
      date: '2024-11-08',
      readTime: '8 min read',
      image: '🧠',
      tags: ['Neurology', 'Stroke', 'Recovery'],
      featured: false
    },
    {
      id: 5,
      title: 'Exercise Therapy for Seniors: Staying Active and Healthy',
      excerpt: 'Discover safe and effective exercise routines designed specifically for senior citizens to maintain mobility and independence.',
      content: 'Full article content would be here...',
      category: 'Exercise Guides',
      author: 'Dr. Emily Rodriguez',
      date: '2024-11-05',
      readTime: '5 min read',
      image: '👴',
      tags: ['Seniors', 'Exercise', 'Mobility'],
      featured: false
    },
    {
      id: 6,
      title: 'Technology in Physiotherapy: Digital Health Revolution',
      excerpt: 'How modern technology is transforming physiotherapy treatment and improving patient outcomes through digital innovation.',
      content: 'Full article content would be here...',
      category: 'Technology in Healthcare',
      author: 'Dr. James Wilson',
      date: '2024-11-03',
      readTime: '6 min read',
      image: '📱',
      tags: ['Technology', 'Digital Health', 'Innovation'],
      featured: true
    }
  ];

  const categories = ['all', ...BLOG_CATEGORIES];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <PageHeader
        title={pageSettings.hero_title || "Health & Wellness Blog"}
        subtitle={pageSettings.hero_subtitle || "Stay informed with the latest insights, tips, and expert advice on physiotherapy, health, and wellness."}
        bgImage={pageSettings.hero_background_image_url || "https://images.unsplash.com/photo-1576091160550-2187d80aeff2?auto=format&fit=crop&q=80"}
      />

      {/* Search and Filter */}
      <section className="py-12 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-16 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in">
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all shadow-sm"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">
                  🔍
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${selectedCategory === category
                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                >
                  {category === 'all' ? 'All Articles' : category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {selectedCategory === 'all' && searchTerm === '' && (
        <section className="py-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-blue/5 to-transparent -z-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl font-heading font-bold text-brand-dark">Featured Articles</h2>
              <p className="text-xl text-slate-600 mt-4 font-light">
                Don't miss these essential reads from our experts
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <article key={post.id} className="glass-card group rounded-3xl overflow-hidden hover:-translate-y-2 transition-all duration-500 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-brand-blue/10 to-brand-orange/10 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
                    {post.image}
                  </div>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-bold uppercase tracking-wider">
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark mb-3 line-clamp-2 group-hover:text-brand-blue transition-colors">{post.title}</h3>
                    <p className="text-slate-600 mb-6 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <span className="mr-2">👨‍⚕️</span>
                        <span>{post.author}</span>
                      </div>
                      <Link
                        to={`/blog/${post.id}`}
                        className="inline-flex items-center text-brand-orange font-bold hover:text-brand-orange/80 transition-colors"
                      >
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

      {/* All Articles */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 animate-fade-in">
            <h2 className="text-3xl font-heading font-bold text-brand-dark">
              {selectedCategory === 'all' ? 'All' : selectedCategory} Articles
            </h2>
            <p className="text-slate-600 mt-4">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <article key={post.id} className="glass-panel p-0 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="aspect-w-16 aspect-h-9 bg-slate-50 flex items-center justify-center text-5xl">
                    {post.image}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-brand-light/50 text-brand-dark rounded-full text-xs font-bold">
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-400">{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-bold text-brand-dark mb-3 line-clamp-2 hover:text-brand-blue transition-colors">
                      <Link to={`/blog/${post.id}`}>{post.title}</Link>
                    </h3>
                    <p className="text-slate-500 mb-4 line-clamp-2 text-sm">{post.excerpt}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <span className="text-sm font-medium text-slate-600">{post.author}</span>
                      <span className="text-xs text-slate-400">{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="text-6xl mb-6">📝</div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">No articles found</h3>
              <p className="text-slate-600 mb-8">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>



      <Footer branding={branding} services={services} />
    </div>
  );
};

export default Blog;
