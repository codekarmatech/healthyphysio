import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { COMPANY_INFO, CSS_CLASSES } from '../constants';

const BlogPost = () => {
  const { id } = useParams();
  const [isVisible, setIsVisible] = useState({});
  const [post, setPost] = useState(null);

  useEffect(() => {
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
    document.title = `${samplePost.title} - PhysioWay Blog`;
  }, [id]);

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
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 pb-32 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Loading Article...</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Article Header */}
      <article className="pt-20">
        <header className="relative py-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`${isVisible.header ? 'animate-fade-in' : 'opacity-0'}`}>
              {/* Breadcrumb */}
              <nav className="mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
                  <span className="mx-2">›</span>
                  <Link to="/blog" className="hover:text-primary-600 transition-colors">Blog</Link>
                  <span className="mx-2">›</span>
                  <span className="text-gray-900">{post.category}</span>
                </div>
              </nav>
              
              {/* Category Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  <span className="mr-2">{post.image}</span>
                  {post.category}
                </span>
              </div>
              
              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                {post.title}
              </h1>
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👨‍⚕️</span>
                  <div>
                    <div className="font-medium text-gray-900">{post.author}</div>
                    <div className="text-sm">{post.authorBio}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-primary-500 mr-2">📅</span>
                  <span>{new Date(post.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-secondary-500 mr-2">⏱️</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>
        
        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className={`prose prose-lg max-w-none ${isVisible.content ? 'animate-fade-in' : 'opacity-0'}`}>
            <div 
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-ul:my-6 prose-li:mb-2 prose-strong:text-gray-900 prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-primary-50 prose-blockquote:p-6 prose-blockquote:my-8 prose-blockquote:italic prose-blockquote:text-gray-700"
            />
          </div>
          
          {/* Share Section */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Share this article</h3>
                <div className="flex space-x-4">
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    📘 Facebook
                  </button>
                  <button className="flex items-center px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors">
                    🐦 Twitter
                  </button>
                  <button className="flex items-center px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors">
                    💼 LinkedIn
                  </button>
                </div>
              </div>
              <div className="text-right">
                <Link to="/blog" className={CSS_CLASSES.button.secondary}>
                  ← Back to Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
      
      {/* Related Articles */}
      <section id="related" className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${isVisible.related ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className={CSS_CLASSES.heading.h2}>
              Related <span className={CSS_CLASSES.heading.gradient}>Articles</span>
            </h2>
            <p className="text-xl text-gray-600 mt-4">
              Continue reading with these related health insights
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost, index) => (
              <article key={relatedPost.id} className={`${CSS_CLASSES.card.base} overflow-hidden ${isVisible.related ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-5xl">
                  {relatedPost.image}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">{relatedPost.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{relatedPost.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{relatedPost.readTime}</span>
                    <Link 
                      to={`/blog/${relatedPost.id}`}
                      className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
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
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Experience Home Physiotherapy?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Book a free consultation and discover how our expert physiotherapists can help you recover in the comfort of your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-consultation" className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-300">
              Book Free Consultation
            </Link>
            <a href={`tel:${COMPANY_INFO.phone}`} className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300">
              Call {COMPANY_INFO.phone}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPost;
