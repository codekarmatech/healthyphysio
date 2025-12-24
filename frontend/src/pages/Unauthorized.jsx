import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-brand-orange/5 mix-blend-multiply"></div>
      <div className="max-w-md w-full space-y-8 text-center relative z-10 glass-panel p-12 rounded-[2rem] shadow-xl border border-white/50">
        <div>
          <h1 className="text-9xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-brand-orange">403</h1>
          <h2 className="mt-6 text-3xl font-heading font-bold text-brand-dark">Access Denied</h2>
          <p className="mt-2 text-lg text-slate-600">
            Sorry, you don't have permission to access this page.
          </p>
        </div>
        <div className="mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-bold rounded-xl shadow-lg text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all hover:-translate-y-1"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;