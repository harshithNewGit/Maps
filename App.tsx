import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Company } from './types';
import { findCompanies } from './services/geminiService';
import Spinner from './components/Spinner';
import MapPinIcon from './components/MapPinIcon';
import CompanyCard from './components/CompanyCard';
import MapSelector from './components/MapSelector';
import SkeletonCard from './components/SkeletonCard';

const RESULTS_PER_PAGE = 12;

const App: React.FC = () => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [industry, setIndustry] = useState<string>('IT');
  const [radiusKm, setRadiusKm] = useState<string>('5');
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(RESULTS_PER_PAGE);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // FIX: Initialize useRef with null to fix "Expected 1 arguments, but got 0" error.
  const observer = useRef<IntersectionObserver | null>(null);
  // FIX: The node passed to a ref callback can be null on unmount, so its type should be `HTMLDivElement | null`.
  const lastCompanyElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && companies.length > visibleCount) {
        setVisibleCount(prev => prev + RESULTS_PER_PAGE);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, companies.length, visibleCount]);

  const handleAreaSelect = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(4).toString());
    setLongitude(lng.toFixed(4).toString());
  }, []);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4).toString());
          setLongitude(position.coords.longitude.toFixed(4).toString());
        },
        (err) => {
          setError(`Error getting location: ${err.message}. Defaulting to New York.`);
          setLatitude('40.7128');
          setLongitude('-74.0060');
        }
      );
    } else {
      setError("Geolocation is not supported by this browser. Defaulting to New York.");
      setLatitude('40.7128');
      setLongitude('-74.0060');
    }
  };

  useEffect(() => {
    handleUseMyLocation();
  }, []);

  const handleExportCsv = () => {
    if (companies.length === 0) return;
    const headers = '"Name","Address"';
    const rows = companies.map(c => `"${c.title.replace(/"/g, '""')}","${c.address.replace(/"/g, '""')}"`);
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${industry.replace(/\s+/g, '_')}_leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = parseFloat(radiusKm);

    if (!industry.trim() || isNaN(lat) || isNaN(lon) || isNaN(radius) || radius <= 0) {
      setError("Please ensure all fields are valid.");
      setHasSearched(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCompanies([]);
    setHasSearched(true);
    setVisibleCount(RESULTS_PER_PAGE);

    try {
      const result = await findCompanies(lat, lon, industry, radius);
      setCompanies(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, industry, radiusKm]);

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-300 bg-red-500/10 p-4 rounded-lg"><strong>Error:</strong> {error}</div>;
    }

    if (!hasSearched) {
      return (
        <div className="text-center text-gray-400 p-4">
          <h3 className="text-lg font-medium text-gray-200">Welcome to Geo-Lead Finder</h3>
          <p className="mt-1 text-sm">Select an area on the map, define an industry, and hit "Find Companies" to discover new leads.</p>
        </div>
      );
    }

    if (companies.length > 0) {
      return (
        <div className="grid grid-cols-1 gap-4">
          {companies.slice(0, visibleCount).map((company, index) => {
            if (companies.slice(0, visibleCount).length === index + 1) {
              return <div ref={lastCompanyElementRef} key={company.uri}><CompanyCard company={company} /></div>;
            }
            return <CompanyCard key={company.uri} company={company} />;
          })}
        </div>
      );
    }
    
    return <p className="text-center text-gray-400">No companies found for this search.</p>;
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-900 text-gray-100 font-sans">
      <aside className="w-[450px] h-full flex flex-col bg-gray-900/70 backdrop-blur-sm border-r border-gray-700/50 z-10">
        <header className="p-6 border-b border-gray-700/50">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Geo-Lead Finder</h1>
          <p className="text-gray-400 text-sm mt-1">AI-Powered Lead Discovery</p>
        </header>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-1">Industry / Sector</label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., tech startups"
                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                required
              />
            </div>
            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-300 mb-1">Search Radius (km)</label>
              <input
                id="radius"
                type="number"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                placeholder="5"
                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                required
                min="0.1"
                step="0.1"
              />
            </div>
            <div className="text-center text-sm text-gray-500">
                <p>Click on the map to set a center point for your search.</p>
            </div>
             <button
                type="button"
                onClick={handleUseMyLocation}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700/50 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition"
              >
                <MapPinIcon className="w-5 h-5 mr-2" />
                Use My Current Location
              </button>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Spinner />
                <span className="ml-2">Searching...</span>
              </>
            ) : (
              "Find Companies"
            )}
          </button>
        </form>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-semibold text-gray-200">Results</h2>
             {companies.length > 0 && !isLoading && (
                <button
                  onClick={handleExportCsv}
                  className="p-1.5 text-gray-400 bg-gray-800/50 rounded-full hover:text-white hover:bg-gray-700/70 transition-colors duration-200"
                  aria-label="Export to CSV"
                  title="Export to CSV"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              )}
          </div>
          {renderResults()}
        </div>
      </aside>
      
      <main className="flex-1 h-full">
        <MapSelector
          onAreaSelect={handleAreaSelect}
          latitude={parseFloat(latitude) || 34.0522}
          longitude={parseFloat(longitude) || -118.2437}
          radiusKm={parseFloat(radiusKm) || 0}
        />
      </main>
    </div>
  );
};

export default App;