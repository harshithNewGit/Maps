import React from 'react';
import { Company } from '../types';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg shadow-md hover:bg-gray-700/70 hover:shadow-cyan-500/10 hover:ring-1 hover:ring-cyan-500/50 transition-all duration-300 group">
      <h3 className="text-base font-semibold text-gray-100 truncate group-hover:text-cyan-300 transition-colors">{company.title}</h3>
      <p className="text-sm text-gray-400 mt-1 truncate">{company.address}</p>
      <a
        href={company.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-cyan-400 hover:text-cyan-200 mt-3 inline-flex items-center"
      >
        View on Map
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
};

export default CompanyCard;