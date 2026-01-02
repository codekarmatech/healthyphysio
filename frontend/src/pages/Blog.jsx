import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/common/PageHeader';
import { getAllSettings } from '../services/siteSettingsService';
import { getAllBlogPosts, getFeaturedBlogPosts, getBlogCategories } from '../services/blogService';
import { COMPANY_INFO } from '../constants';

const Blog = () => {
  const [settings, setSettings] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [settingsData, postsData, featuredData, categoriesData] = await Promise.all([
        getAllSettings(),
        getAllBlogPosts(),
        getFeaturedBlogPosts(),
        getBlogCategories()
      ]);
      setSettings(settingsData);
      setBlogPosts(postsData);
      setFeaturedPosts(featuredData);
      setCategories(categoriesData);
      document.title = `Blog - ${settingsData?.branding?.company_name || 'PhysioWay'}`;
      setLoading(false);
    };
    fetchData();
  }, []);

  const branding = settings?.branding || COMPANY_INFO;
  const services = settings?.services || [];
  const pageSettings = settings?.page_settings?.blog || {};

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags_list || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${selectedCategory === 'all'
                  ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30 scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
              >
                All Articles
              </button>
              {categories.map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setSelectedCategory(value)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${selectedCategory === value
                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {selectedCategory === 'all' && searchTerm === '' && featuredPosts.length > 0 && (
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
                <article key={post.slug} className="glass-card group rounded-3xl overflow-hidden hover:-translate-y-2 transition-all duration-500 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="aspect-video bg-gradient-to-br from-brand-blue/10 to-brand-orange/10 flex items-center justify-center overflow-hidden">
                    {post.featured_image_url ? (
                      <img src={post.featured_image_url} alt={post.featured_image_alt || post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="text-6xl">📝</span>
                    )}
                  </div>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-bold uppercase tracking-wider">
                        {post.category_display}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{post.read_time_minutes} min read</span>
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark mb-3 line-clamp-2 group-hover:text-brand-blue transition-colors">{post.title}</h3>
                    <p className="text-slate-600 mb-6 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <span className="mr-2">👨‍⚕️</span>
                        <span>{post.author_name}</span>
                      </div>
                      <Link
                        to={`/blog/${post.slug}`}
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
              {selectedCategory === 'all' ? 'All' : categories.find(c => c[0] === selectedCategory)?.[1] || selectedCategory} Articles
            </h2>
            <p className="text-slate-600 mt-4">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <article key={post.slug} className="glass-panel p-0 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="aspect-video bg-slate-50 flex items-center justify-center overflow-hidden">
                    {post.featured_image_url ? (
                      <img src={post.featured_image_url} alt={post.featured_image_alt || post.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">📝</span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-brand-light/50 text-brand-dark rounded-full text-xs font-bold">
                        {post.category_display}
                      </span>
                      <span className="text-xs text-slate-400">{post.read_time_minutes} min read</span>
                    </div>
                    <h3 className="text-lg font-bold text-brand-dark mb-3 line-clamp-2 hover:text-brand-blue transition-colors">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-slate-500 mb-4 line-clamp-2 text-sm">{post.excerpt}</p>

                    {/* Tags */}
                    {post.tags_list && post.tags_list.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags_list.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <span className="text-sm font-medium text-slate-600">{post.author_name}</span>
                      <span className="text-xs text-slate-400">{formatDate(post.published_at)}</span>
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
