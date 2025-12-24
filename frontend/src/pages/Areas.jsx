import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import areaService from '../services/areaService';
import { COMPANY_INFO } from '../constants';

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAreas, setFilteredAreas] = useState([]);

  useEffect(() => {
    document.title = 'Service Areas - PhysioWay | Ahmedabad, Gujarat';
    fetchAreas();
  }, []);

  useEffect(() => {
    // Filter areas based on search query
    if (searchQuery.trim() === '') {
      setFilteredAreas(areas);
    } else {
      const filtered = areas.filter(area =>
        area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.state.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAreas(filtered);
    }
  }, [searchQuery, areas]);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      // Use the areas API endpoint to get all areas
      const response = await areaService.getAll();
      
      // Filter for Ahmedabad, Gujarat areas only
      const ahmedabadAreas = (response.data || []).filter(area => 
        area.city?.toLowerCase() === 'ahmedabad' && 
        area.state?.toLowerCase() === 'gujarat'
      );
      
      setAreas(ahmedabadAreas);
      setError(null);
    } catch (err) {
      console.error('Error fetching areas:', err);
      setError('Failed to load service areas. Please try again later.');
      
      // Fallback: Show some default Ahmedabad areas if API fails
      setAreas([
        {
          id: 1,
          name: 'Satellite',
          city: 'Ahmedabad',
          state: 'Gujarat',
          zip_code: '380015',
          description: 'Premium residential area with excellent connectivity',
          therapist_count: 5,
          patient_count: 25,
          doctor_count: 3
        },
        {
          id: 2,
          name: 'Vastrapur',
          city: 'Ahmedabad',
          state: 'Gujarat',
          zip_code: '380015',
          description: 'Well-developed area with modern amenities',
          therapist_count: 4,
          patient_count: 18,
          doctor_count: 2
        },
        {
          id: 3,
          name: 'Bopal',
          city: 'Ahmedabad',
          state: 'Gujarat',
          zip_code: '380058',
          description: 'Growing residential hub with good infrastructure',
          therapist_count: 3,
          patient_count: 12,
          doctor_count: 1
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getAreaStats = (area) => {
    return {
      therapists: area.therapist_count || 0,
      patients: area.patient_count || 0,
      doctors: area.doctor_count || 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
        {/* Dynamic Background Pattern */}
        <div className="absolute inset-0 pattern-grid opacity-25"></div>
        
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="font-sans text-gray-600">Loading service areas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 relative overflow-hidden">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 pattern-grid opacity-25"></div>
      
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Dynamic Light Color Effects */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-gradient-to-br from-emerald-400/15 via-teal-400/20 to-cyan-400/15 blur-2xl opacity-60" style={{ animation: 'colorShift 13s ease-in-out infinite 1s' }}></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-gradient-to-br from-violet-400/20 via-purple-400/25 to-indigo-400/20 blur-xl opacity-70" style={{ animation: 'colorShift 11s ease-in-out infinite 3s' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full mb-6 shadow-lg">
              <span className="text-green-500 mr-2">📍</span>
              <span className="text-sm font-medium text-gray-700">Currently Serving Ahmedabad, Gujarat</span>
            </div>
            
            <h1 className="font-display text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight overflow-visible">
              Our Service 
              <span className="block bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-700 bg-clip-text text-transparent overflow-visible">
                Areas
              </span>
            </h1>
            
            <p className="font-sans text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Professional physiotherapy services delivered to your doorstep across Ahmedabad, Gujarat. 
              <span className="text-primary-600 font-semibold">Quality care, wherever you are.</span>
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none font-sans text-lg"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Areas Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Error Loading Areas</h3>
              <p className="font-sans text-gray-600 mb-6">{error}</p>
              <button
                onClick={fetchAreas}
                className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No Areas Found' : 'No Service Areas Available'}
              </h3>
              <p className="font-sans text-gray-600 mb-6">
                {searchQuery 
                  ? `No areas match "${searchQuery}". Try a different search term.`
                  : 'We are expanding our service areas. Check back soon!'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAreas.map((area, index) => {
                const stats = getAreaStats(area);
                return (
                  <div
                    key={area.id}
                    className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Area Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                          {area.name}
                        </h3>
                        <p className="font-sans text-gray-600">
                          {area.city}, {area.state}
                        </p>
                        {area.zip_code && (
                          <p className="font-sans text-sm text-gray-500">
                            PIN: {area.zip_code}
                          </p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white text-xl">📍</span>
                      </div>
                    </div>

                    {/* Description */}
                    {area.description && (
                      <p className="font-sans text-gray-600 text-sm mb-6 leading-relaxed">
                        {area.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{stats.therapists}</div>
                        <div className="text-xs text-gray-500 font-medium">Therapists</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary-600">{stats.patients}</div>
                        <div className="text-xs text-gray-500 font-medium">Patients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.doctors}</div>
                        <div className="text-xs text-gray-500 font-medium">Doctors</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to="/book-consultation"
                      className="block w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-heading font-semibold text-center rounded-2xl transition-all duration-300 transform group-hover:scale-105"
                    >
                      Book Consultation
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-20 text-center">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
              <h3 className="font-display text-3xl font-bold text-gray-900 mb-4">
                Don't See Your Area?
              </h3>
              <p className="font-sans text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                We're rapidly expanding our services across Gujarat. Contact us to check if we can serve your area or to request service in your location.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href={`tel:${COMPANY_INFO.phone}`}
                  className="px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-heading font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  📞 Call {COMPANY_INFO.phone}
                </a>
                <Link
                  to="/contact"
                  className="px-8 py-4 bg-white border-2 border-primary-200 text-primary-600 font-heading font-semibold rounded-2xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-300 transform hover:scale-105"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Areas;
