import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { getAllSettings } from '../services/siteSettingsService';
import { COMPANY_INFO } from '../constants';

const BlogPost = () => {
  const { id } = useParams();
  const [settings, setSettings] = useState(null);
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getAllSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const branding = settings?.branding || COMPANY_INFO;

  useEffect(() => {
    // In real app, this would be an API call
    // For now, using sample data
    const samplePost = {
      id: parseInt(id),
      title: 'Benefits of Home Physiotherapy: Why Treatment at Home is More Effective',
      excerpt: 'Discover the numerous advantages of receiving physiotherapy treatment in the comfort of your own home, from better compliance to personalized care.',
      content: `
        <h2>Introduction</h2>
        <p>Home physiotherapy has revolutionized the way we approach rehabilitation and recovery. By bringing professional treatment directly to patients' homes, we've discovered numerous benefits that traditional clinic-based therapy simply cannot match.</p>
        
        <h2>The Comfort Factor</h2>
        <p>One of the most significant advantages of home physiotherapy is the comfort and familiarity of your own environment. Patients feel more relaxed and confident in their own space, which directly translates to better treatment outcomes.</p>
        
        <h3>Key Benefits Include:</h3>
        <ul>
          <li><strong>Reduced Anxiety:</strong> Being in a familiar environment reduces stress and anxiety levels</li>
          <li><strong>Better Focus:</strong> Without the distractions of a busy clinic, patients can focus entirely on their treatment</li>
          <li><strong>Personalized Environment:</strong> Treatment can be adapted to the patient's specific living situation</li>
        </ul>
        
        <h2>Improved Compliance and Consistency</h2>
        <p>Studies have shown that patients who receive home physiotherapy demonstrate significantly higher compliance rates compared to those attending clinic sessions. The convenience factor eliminates common barriers such as transportation issues, scheduling conflicts, and mobility limitations.</p>
        
        <blockquote>
          "Home physiotherapy has transformed my recovery journey. I no longer have to worry about traveling to appointments, and my therapist can see exactly how I move in my daily environment." - Sarah M., Patient
        </blockquote>
        
        <h2>Functional Assessment and Training</h2>
        <p>Home physiotherapy allows therapists to assess and treat patients in their actual living environment. This means exercises and interventions can be specifically tailored to the patient's daily activities and home setup.</p>
        
        <h3>Real-World Applications</h3>
        <p>Therapists can observe and improve:</p>
        <ul>
          <li>How patients navigate stairs in their own home</li>
          <li>Kitchen mobility and ergonomics</li>
          <li>Bedroom and bathroom safety</li>
          <li>Garden or outdoor space utilization</li>
        </ul>
        
        <h2>Family Involvement and Support</h2>
        <p>Home sessions naturally involve family members and caregivers, creating a strong support system that extends beyond the therapy session. Family members can learn proper techniques and become active participants in the recovery process.</p>
        
        <h2>Technology Integration</h2>
        <p>Modern home physiotherapy leverages technology to enhance treatment outcomes. Digital progress tracking, video consultations, and mobile apps ensure continuous monitoring and support between sessions.</p>
        
        <h2>Cost-Effectiveness</h2>
        <p>While the hourly rate for home physiotherapy might be higher, the overall cost is often lower due to:</p>
        <ul>
          <li>Reduced travel expenses</li>
          <li>No parking fees</li>
          <li>Less time off work</li>
          <li>Fewer missed appointments</li>
          <li>Faster recovery times</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>Home physiotherapy represents the future of rehabilitation care. By combining professional expertise with the comfort and convenience of home treatment, patients achieve better outcomes while enjoying a more personalized and supportive recovery experience.</p>
        
        <p>If you're considering physiotherapy treatment, explore the benefits of home-based care. Contact our team to learn how we can bring professional physiotherapy services directly to your door.</p>
      `,
      category: 'Treatment Tips',
      author: 'Dr. Rajavi Dixit',
      authorBio: 'Founder & Chief Neurological Physiotherapist at PhysioWay. Specializes in home-based neurological rehabilitation with 8+ years of experience.',
      date: '2024-11-15',
      readTime: '8 min read',
      image: '🏠',
      tags: ['Home Care', 'Benefits', 'Treatment', 'Recovery'],
      featured: true
    };

    setPost(samplePost);
    document.title = `${samplePost.title} - ${branding.company_name || 'PhysioWay'} Blog`;
  }, [id, branding]);

  const relatedPosts = [
    {
      id: 2,
      title: 'Post-Surgery Recovery: Essential Guidelines',
      excerpt: 'Learn the essential steps for effective post-surgical rehabilitation.',
      image: '🏥',
      readTime: '5 min read'
    },
    {
      id: 3,
      title: 'Managing Chronic Pain with Physiotherapy',
      excerpt: 'Effective strategies for managing chronic pain through physiotherapy.',
      image: '💪',
      readTime: '6 min read'
    },
    {
      id: 4,
      title: 'Neurological Rehabilitation After Stroke',
      excerpt: 'Understanding the journey of neurological rehabilitation.',
      image: '🧠',
      readTime: '7 min read'
    }
  ];

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-32 pb-32 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-2xl font-bold text-slate-400 mb-4">Loading Article...</h1>
          </div>
        </div>
        <Footer branding={branding} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Article Header */}
      <article>
        <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Background with overlay */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-slate-900/70 z-10" />
            <img
              src="https://images.unsplash.com/photo-1576091160550-2187d80aeff2?auto=format&fit=crop&q=80"
              alt="Background"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-fade-in text-center lg:text-left">
              {/* Breadcrumb */}
              <nav className="mb-8 flex justify-center lg:justify-start">
                <div className="flex items-center text-sm text-slate-300">
                  <Link to="/" className="hover:text-white transition-colors">Home</Link>
                  <span className="mx-3 text-slate-500">/</span>
                  <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
                  <span className="mx-3 text-slate-500">/</span>
                  <span className="text-brand-orange">{post.category}</span>
                </div>
              </nav>

              {/* Category Badge */}
              <div className="mb-6 flex justify-center lg:justify-start">
                <span className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-bold tracking-wide uppercase">
                  <span className="mr-2">{post.image}</span>
                  {post.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-5xl font-heading font-bold text-white leading-tight mb-8">
                {post.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-slate-300">
                <div className="flex items-center bg-white/5 rounded-full pl-1 pr-4 py-1 border border-white/10">
                  <span className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white text-xs mr-3 font-bold">DR</span>
                  <div className="font-medium text-white">{post.author}</div>
                </div>
                <div className="flex items-center">
                  <span className="text-brand-orange mr-2">📅</span>
                  <span>{new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-brand-orange mr-2">⏱️</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="relative">
          {/* Main Content Container - pulling up into header */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-20">
            <div className="glass-card p-6 lg:p-12 rounded-3xl animate-slide-up">

              {/* Article Content */}
              <div className="prose prose-lg max-w-none prose-slate prose-headings:font-heading prose-headings:font-bold prose-headings:text-brand-dark prose-a:text-brand-blue prose-img:rounded-2xl">
                <div
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>

              {/* Tags */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Topic Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors cursor-default border border-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Share Section */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-brand-dark mb-3">Share this article</h3>
                    <div className="flex space-x-3">
                      <button className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-110 transition-transform">
                        f
                      </button>
                      <button className="w-10 h-10 rounded-full bg-sky-400 text-white flex items-center justify-center hover:scale-110 transition-transform">
                        t
                      </button>
                      <button className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:scale-110 transition-transform">
                        in
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <Link to="/blog" className="inline-flex items-center text-brand-blue font-bold hover:text-brand-orange transition-colors">
                      ← Back to All Articles
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-brand-dark">Related Articles</h2>
            <p className="text-slate-600 mt-4">
              Continue reading with these related health insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost, index) => (
              <article key={relatedPost.id} className="glass-panel p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-2xl mb-4">
                  {relatedPost.image}
                </div>
                <h3 className="text-lg font-bold text-brand-dark mb-2 line-clamp-2">
                  <Link to={`/blog/${relatedPost.id}`} className="hover:text-brand-blue transition-colors">
                    {relatedPost.title}
                  </Link>
                </h3>
                <p className="text-slate-500 mb-4 line-clamp-2 text-sm">{relatedPost.excerpt}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-slate-400 font-medium">{relatedPost.readTime}</span>
                  <Link
                    to={`/blog/${relatedPost.id}`}
                    className="text-brand-blue text-sm font-bold hover:text-brand-orange transition-colors"
                  >
                    Read More →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-dark -z-10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-blue/10 blur-3xl"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-6">
            Ready to Experience Home Physiotherapy?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light">
            Book a free consultation and discover how our expert physiotherapists can help you recover in the comfort of your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-consultation" className="px-8 py-4 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/25 transition-all hover:-translate-y-1">
              Book Free Consultation
            </Link>
            <a href={`tel:${branding.phone || COMPANY_INFO.phone}`} className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-bold hover:bg-white hover:text-brand-dark transition-all hover:-translate-y-1">
              Call {branding.phone || COMPANY_INFO.phone}
            </a>
          </div>
        </div>
      </section>

      <Footer branding={branding} />
    </div>
  );
};

export default BlogPost;
