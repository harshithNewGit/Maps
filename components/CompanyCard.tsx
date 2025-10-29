import React from 'react';
import { Company } from '../types';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200">
      <h3 className="text-lg font-semibold text-blue-300">{company.title}</h3>
      <a
        href={company.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline mt-2 inline-flex items-center"
      >
        View on Google Maps
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
};

export default CompanyCard;
