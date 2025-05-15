import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Register Chart.js components
Chart.register(...registerables);

interface Repair {
  system: string;
  urgency: 'Urgent' | 'Soon' | 'Monitor';
  notes: string;
}

interface AssessmentResult {
  health_score: number;
  summary: string;
  repairs: Repair[];
}

interface ResultsDisplayProps {
  result: AssessmentResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        // Destroy existing chart if it exists
        const chartInstance = Chart.getChart(chartRef.current);
        if (chartInstance) {
          chartInstance.destroy();
        }
        
        // Create new chart
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Health Score', 'Improvement Potential'],
            datasets: [
              {
                data: [result.health_score, 100 - result.health_score],
                backgroundColor: [
                  getScoreColor(result.health_score),
                  '#e2e8f0'
                ],
                borderWidth: 0
              }
            ]
          },
          options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: false
              }
            }
          }
        });
      }
    }
  }, [result]);
  
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };
  
  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'Soon': return 'bg-yellow-100 text-yellow-800';
      case 'Monitor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('HomeHealthReport.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div ref={reportRef} className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Your Home Health Report</h1>
        
        <div className="flex flex-col md:flex-row items-center justify-between mb-10">
          <div className="w-full md:w-1/2 flex flex-col items-center mb-6 md:mb-0">
            <div className="relative w-64 h-64">
              <canvas ref={chartRef} />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-5xl font-bold" style={{ color: getScoreColor(result.health_score) }}>
                  {result.health_score}
                </span>
                <span className="text-gray-500">out of 100</span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2">
            <h2 className="text-xl font-semibold mb-3">Summary</h2>
            <p className="text-gray-700 mb-6">{result.summary}</p>
            
            <div className="flex flex-wrap gap-2">
              {result.repairs.map(repair => (
                <span 
                  key={repair.system} 
                  className={`px-3 py-1 rounded-full text-sm ${getUrgencyColor(repair.urgency)}`}
                >
                  {repair.system}: {repair.urgency}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Repair Priorities</h2>
          
          <div className="space-y-4">
            {result.repairs.map((repair, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-lg">{repair.system}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${getUrgencyColor(repair.urgency)}`}>
                    {repair.urgency}
                  </span>
                </div>
                <p className="text-gray-700">{repair.notes}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={generatePDF}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Download Report
            </button>
            
            <button className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
              Get Repair Estimate
            </button>
            
            <button className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Schedule Inspection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
