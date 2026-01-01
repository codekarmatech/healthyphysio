import React from 'react';
import { motion } from 'framer-motion';

const PageHeader = ({ title, subtitle, bgImage }) => {
    return (
        <div className="relative pt-20 lg:pt-24 overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/50 to-emerald-50/30">
            {/* Luxury pastel background elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Soft gradient orbs */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-teal-200/40 to-emerald-100/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-100/40 to-teal-50/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full blur-3xl -translate-y-1/2" />
                
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%230d9488' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` 
                }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center py-16 lg:py-20">
                    {/* Text Content */}
                    <div className="text-center lg:text-left order-2 lg:order-1">
                        {/* Premium badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-teal-100 shadow-sm mb-6"
                        >
                            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-teal-700">Premium Healthcare</span>
                        </motion.div>
                        
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-slate-800 mb-6 leading-tight"
                        >
                            {title}
                        </motion.h1>
                        {subtitle && (
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg lg:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed"
                            >
                                {subtitle}
                            </motion.p>
                        )}
                        
                        {/* Trust indicators */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-8"
                        >
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                    <span className="text-teal-600">✓</span>
                                </div>
                                <span>Certified Experts</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600">★</span>
                                </div>
                                <span>5000+ Patients</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Image */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="order-1 lg:order-2 flex justify-center lg:justify-end"
                    >
                        <div className="relative">
                            {/* Decorative elements */}
                            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-emerald-300/20 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-cyan-300/20 to-teal-200/20 rounded-full blur-2xl" />
                            
                            {/* Main image container */}
                            <div className="relative w-full max-w-md lg:max-w-lg">
                                {/* Floating accent shapes */}
                                <div className="absolute -top-3 -right-3 w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl rotate-12 opacity-80" />
                                <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl -rotate-12 opacity-80" />
                                
                                {/* Image frame */}
                                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-white p-2 shadow-2xl shadow-slate-200/50">
                                    <div className="w-full h-full rounded-2xl overflow-hidden">
                                        <img
                                            src={bgImage || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80"}
                                            alt={title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Elegant bottom curve */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
                    <path d="M0 80V50C360 20 720 0 1080 20C1260 30 1380 50 1440 60V80H0Z" fill="white" fillOpacity="0.5"/>
                    <path d="M0 80V60C360 30 720 20 1080 40C1260 50 1380 65 1440 70V80H0Z" fill="#f8fafc"/>
                </svg>
            </div>
        </div>
    );
};

export default PageHeader;
