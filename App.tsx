import React, { useState, useCallback } from 'react';
import { Company } from './types';
import { findCompanies } from './services/geminiService';
import Spinner from './components/Spinner';
import MapPinIcon from './components/MapPinIcon';
import CompanyCard from './components/CompanyCard';
import MapSelector from './components/MapSelector';

const App: React.FC = () => {
  const [latitude, setLatitude] = useState<string>('34.0522');
  const [longitude, setLongitude] = useState<string>('-118.2437');
  const [industry, setIndustry] = useState<string>('movie studios');
  
  const [companies, setCompanies] = useState<Company[]>([]);
  
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

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
    
    setIsLoading(true);
    setError(null);
    setCompanies([]);
    setIsResultsVisible(false);

    try {
      const result = await findCompanies(lat, lon, industry);
      setCompanies(result);
      if (result.length > 0) {
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
  }, [latitude, longitude, industry]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900 text-gray-100 font-sans">
      <MapSelector
        onAreaSelect={handleAreaSelect}
        latitude={parseFloat(latitude) || 34.0522}
        longitude={parseFloat(longitude) || -118.2437}
      />

      <main className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-2xl px-4">
        {/* Results and Error container - scrollable and collapsible */}
        {isResultsVisible && (
          <div className="relative bg-gray-900/70 backdrop-blur-sm p-4 rounded-lg max-h-[45vh] overflow-y-auto mb-4">
            <button
              onClick={() => setIsResultsVisible(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors duration-200 z-10"
              aria-label="Close results"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {error && (
              <div className="text-red-300 pt-2">
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
            
            {companies.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {companies.map((company, index) => (
                  <CompanyCard key={index} company={company} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form container */}
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

            <div className="mb-6">
              <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-1">Industry / Sector</label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., tech startups, coffee shops"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
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
