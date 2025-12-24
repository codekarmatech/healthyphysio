import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/common/PageHeader';
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
      <div className="min-h-screen bg-slate-50 relative overflow-hidden">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p className="text-slate-600">Loading service areas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <PageHeader
        title="Our Service Areas"
        subtitle="Professional physiotherapy services delivered to your doorstep across Ahmedabad, Gujarat."
        bgImage="https://images.unsplash.com/photo-1576091160550-2187d80aeff2?auto=format&fit=crop&q=80"
      />

      {/* Search Bar - overlapping header */}
      <section className="relative px-4 sm:px-6 lg:px-8 -mt-8 z-20 mb-12">
        <div className="max-w-md mx-auto">
          <div className="relative shadow-xl rounded-2xl">
            <input
              type="text"
              placeholder="Search areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-lg text-slate-700 shadow-sm"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl">
              🔍
            </div>
          </div>
        </div>
      </section>

      {/* Areas Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="text-center py-12 bg-red-50 rounded-3xl border border-red-100">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-dark">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">Error Loading Areas</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <button
                onClick={fetchAreas}
                className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">
                {searchQuery ? 'No Areas Found' : 'No Service Areas Available'}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchQuery
                  ? `No areas match "${searchQuery}". Try a different search term.`
                  : 'We are expanding our service areas. Check back soon!'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 transition-colors"
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
                    className="glass-card group p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Area Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="font-heading text-xl font-bold text-brand-dark mb-1 group-hover:text-brand-blue transition-colors">
                          {area.name}
                        </h3>
                        <p className="text-slate-600 font-medium">
                          {area.city}, {area.state}
                        </p>
                        {area.zip_code && (
                          <p className="text-sm text-slate-400 mt-1">
                            PIN: {area.zip_code}
                          </p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">⚡</span>
                      </div>
                    </div>

                    {/* Description */}
                    {area.description && (
                      <p className="text-slate-600 text-sm mb-6 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        {area.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6 pt-4 border-t border-slate-100">
                      <div className="text-center">
                        <div className="text-xl font-bold text-brand-blue">{stats.therapists}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Therapists</div>
                      </div>
                      <div className="text-center border-l border-slate-100 border-r">
                        <div className="text-xl font-bold text-brand-orange">{stats.patients}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Patients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-500">{stats.doctors}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Doctors</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to="/book-consultation"
                      className="block w-full py-3 bg-brand-dark text-white font-bold text-center rounded-xl hover:bg-brand-blue transition-colors shadow-lg hover:shadow-brand-blue/20"
                    >
                      Book Consultation
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-20 text-center animate-fade-in">
            <div className="glass-panel p-10 rounded-[3rem] max-w-4xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

              <h3 className="font-heading text-3xl font-bold text-brand-dark mb-4 relative z-10">
                Don't See Your Area?
              </h3>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto relative z-10">
                We're rapidly expanding our services across Gujarat. Contact us to check if we can serve your area or to request service in your location.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
                <a
                  href={`tel:${COMPANY_INFO.phone}`}
                  className="px-8 py-4 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-brand-blue/90 transition-all hover:-translate-y-1"
                >
                  📞 Call {COMPANY_INFO.phone}
                </a>
                <Link
                  to="/contact"
                  className="px-8 py-4 bg-white border border-slate-200 text-brand-dark font-bold rounded-xl hover:bg-slate-50 transition-all hover:-translate-y-1"
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
