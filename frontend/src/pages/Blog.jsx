import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { BLOG_CATEGORIES, CSS_CLASSES } from '../constants';

const Blog = () => {
  const [isVisible, setIsVisible] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = 'Blog - PhysioWay | Health Tips & Physiotherapy Insights';
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section id="hero" className="relative pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-100/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className={`${isVisible.hero ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-8">
                <span className="text-primary-500 mr-2">📚</span>
                <span className="text-sm font-medium text-gray-700">Health & Wellness Insights</span>
              </div>
              
              <h1 className={CSS_CLASSES.heading.h1}>
                Health <span className={CSS_CLASSES.heading.gradient}>Blog</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
                Stay informed with the latest insights, tips, and expert advice on physiotherapy, 
                health, and wellness from our team of certified professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section id="search-filter" className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${isVisible['search-filter'] ? 'animate-fade-in' : 'opacity-0'}`}>
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <section id="featured" className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-16 ${isVisible.featured ? 'animate-fade-in' : 'opacity-0'}`}>
              <h2 className={CSS_CLASSES.heading.h2}>
                Featured <span className={CSS_CLASSES.heading.gradient}>Articles</span>
              </h2>
              <p className="text-xl text-gray-600 mt-4">
                Don't miss these essential reads from our experts
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <article key={post.id} className={`${CSS_CLASSES.card.base} overflow-hidden ${isVisible.featured ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-6xl">
                    {post.image}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">{post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👨‍⚕️</span>
                        <span>{post.author}</span>
                      </div>
                      <span className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <Link 
                      to={`/blog/${post.id}`}
                      className="mt-4 inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
                    >
                      Read More →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Articles */}
      <section id="articles" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`mb-12 ${isVisible.articles ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className={CSS_CLASSES.heading.h2}>
              {selectedCategory === 'all' ? 'All' : selectedCategory} <span className={CSS_CLASSES.heading.gradient}>Articles</span>
            </h2>
            <p className="text-gray-600 mt-4">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <article key={post.id} className={`${CSS_CLASSES.card.base} overflow-hidden ${isVisible.articles ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-5xl">
                    {post.image}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👨‍⚕️</span>
                        <span>{post.author}</span>
                      </div>
                      <span className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    
                    <Link 
                      to={`/blog/${post.id}`}
                      className={`${CSS_CLASSES.button.primary} w-full text-center text-sm`}
                    >
                      Read Full Article
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className={CSS_CLASSES.button.secondary}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Stay Updated with Health Tips
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Subscribe to our newsletter for the latest physiotherapy insights and health tips delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
