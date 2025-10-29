import React, { useState, useCallback } from 'react';
import { Company } from './types';
import { findCompanies } from './services/geminiService';
import Spinner from './components/Spinner';
import MapPinIcon from './components/MapPinIcon';
import CompanyCard from './components/CompanyCard';
import MapSelector from './components/MapSelector';

const RESULTS_PER_PAGE = 10;

const App: React.FC = () => {
  const [latitude, setLatitude] = useState<string>('34.0522');
  const [longitude, setLongitude] = useState<string>('-118.2437');
  const [industry, setIndustry] = useState<string>('movie studios');
  const [radiusKm, setRadiusKm] = useState<string>('5');
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(RESULTS_PER_PAGE);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultsVisible, setIsResultsVisible] = useState<boolean>(false);

  const handleAreaSelect = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(4).toString());
    setLongitude(lng.toFixed(4).toString());
  }, []);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4).toString());
          setLongitude(position.coords.longitude.toFixed(4).toString());
          setIsLoading(false);
        },
        (err) => {
          setError(`Error getting location: ${err.message}`);
          setIsLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleExportCsv = () => {
    if (companies.length === 0) return;
  
    // This function exports the complete list of companies fetched from the API,
    // not just the ones currently visible on the screen.
    const headers = '"Name","Address"';
    const rows = companies.map(c => `"${c.title.replace(/"/g, '""')}","${c.address.replace(/"/g, '""')}"`);
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'companies.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = parseFloat(radiusKm);

    if (!industry.trim()) {
      setError("Please provide an industry or sector.");
      setIsResultsVisible(true);
      return;
    }

    if (isNaN(lat) || isNaN(lon)) {
      setError("A valid location has not been selected on the map.");
      setIsResultsVisible(true);
      return;
    }

    if (isNaN(radius) || radius <= 0) {
      setError("Please enter a valid, positive radius.");
      setIsResultsVisible(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCompanies([]);
    setVisibleCount(RESULTS_PER_PAGE);
    setIsResultsVisible(false);

    try {
      const result = await findCompanies(lat, lon, industry, radius);
      setCompanies(result);
      if (result.length > 0 || error) {
        setIsResultsVisible(true);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setIsResultsVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, industry, radiusKm, error]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900 text-gray-100 font-sans">
      <MapSelector
        onAreaSelect={handleAreaSelect}
        latitude={parseFloat(latitude) || 34.0522}
        longitude={parseFloat(longitude) || -118.2437}
        radiusKm={parseFloat(radiusKm) || 0}
      />

      <main className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-4xl px-4">
        {isResultsVisible && (
          <div className="relative bg-gray-900/70 backdrop-blur-sm p-4 rounded-lg max-h-[45vh] overflow-y-auto mb-4">
            <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
              {companies.length > 0 && (
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
              <button
                onClick={() => setIsResultsVisible(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Close results"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="pt-8">
              {error && (
                <div className="text-red-300">
                  <p><strong>Error:</strong> {error}</p>
                </div>
              )}
              
              {companies.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.slice(0, visibleCount).map((company, index) => (
                      <CompanyCard key={index} company={company} />
                    ))}
                  </div>
                  {visibleCount < companies.length && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => setVisibleCount(prev => prev + RESULTS_PER_PAGE)}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                      >
                        Show More
                      </button>
                    </div>
                  )}
                </>
              ) : !isLoading && !error && (
                 <p className="text-center text-gray-400">No companies found for this search.</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit}>
            <div className="text-center my-2">
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition"
              >
                <MapPinIcon className="w-5 h-5 mr-2" />
                Center Map on My Location
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="sm:col-span-2">
                <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-1">Industry / Sector</label>
                <input
                  id="industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., tech startups"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-300 mb-1">Radius (km)</label>
                <input
                  id="radius"
                  type="number"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  placeholder="5"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
            >
              {isLoading && <Spinner />}
              <span className={isLoading ? 'ml-2' : ''}>Find Companies</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;