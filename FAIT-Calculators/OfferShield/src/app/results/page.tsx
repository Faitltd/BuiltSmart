'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';

// Mock data for the analysis results
const mockResults = {
  flaggedItems: [
    {
      item: 'Labor costs',
      reason: 'Vague description without hourly breakdown',
      severity: 'high',
    },
    {
      item: 'Materials markup',
      reason: '30% markup is above industry standard of 15-20%',
      severity: 'high',
    },
    {
      item: 'Project timeline',
      reason: 'No specific completion date provided',
      severity: 'medium',
    },
    {
      item: 'Payment schedule',
      reason: 'Front-loaded payment schedule with 50% upfront',
      severity: 'medium',
    },
  ],
  clarifyingQuestions: [
    'Can you provide an hourly breakdown of labor costs?',
    'What specific brand and model of fixtures are included?',
    'Is debris removal included in the quote?',
  ],
  missingElements: [
    'Detailed timeline with milestones',
    'Warranty information for labor and materials',
    'Specific brands and models for fixtures and appliances',
  ],
  confidenceScore: 75,
  summary: 'This quote lacks specificity in labor costs and has above-average markups on materials. Request more details on timeline, payment terms, and specific materials before proceeding.',
};

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState(mockResults);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-700';
      case 'medium':
        return 'text-yellow-700';
      case 'low':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Quote Analysis Results</h1>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Download PDF
              </button>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800">{results.summary}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Risk Flags</h2>
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-1"></span>
                  <span className="text-sm text-gray-600 mr-3">High</span>
                  <span className="inline-block w-4 h-4 bg-yellow-500 rounded-full mr-1"></span>
                  <span className="text-sm text-gray-600 mr-3">Medium</span>
                  <span className="inline-block w-4 h-4 bg-blue-500 rounded-full mr-1"></span>
                  <span className="text-sm text-gray-600">Low</span>
                </div>
              </div>

              <div className="space-y-4">
                {results.flaggedItems.map((item, index) => (
                  <div
                    key={index}
                    className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(item.severity)}`}
                  >
                    <h3 className={`font-semibold ${getSeverityTextColor(item.severity)}`}>{item.item}</h3>
                    <p className="text-gray-700">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Questions to Ask</h2>
                <ul className="space-y-3">
                  {results.clarifyingQuestions.map((question, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-flex items-center justify-center bg-blue-100 text-blue-600 w-6 h-6 rounded-full mr-2 flex-shrink-0 font-semibold text-sm">
                        {index + 1}
                      </span>
                      <span className="text-gray-800">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Missing Elements</h2>
                <ul className="space-y-3">
                  {results.missingElements.map((element, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-gray-800">{element}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold mb-4">Confidence Score</h2>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Confidence
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {results.confidenceScore}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${results.confidenceScore}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                This score represents our AI's confidence in the analysis. A higher score means the AI had more clear information to work with.
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">Need a second opinion from a human expert?</p>
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Book Expert Consultation ($49)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
