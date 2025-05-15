// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface QuoteAnalysisRequest {
  text?: string;
  file?: File;
  jobType?: string;
  zipCode?: string;
  budget?: string;
}

export interface QuoteAnalysisResponse {
  flaggedItems: Array<{
    item: string;
    reason: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  clarifyingQuestions: string[];
  missingElements: string[];
  confidenceScore: number;
  summary: string;
}

// Mock analysis response for testing
const mockAnalysisResponse: QuoteAnalysisResponse = {
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

export async function analyzeQuote(data: QuoteAnalysisRequest, token?: string): Promise<QuoteAnalysisResponse> {
  // For testing purposes, we'll simulate an API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return the mock response
  return mockAnalysisResponse;

  // In production, you would use the following code:
  /*
  const formData = new FormData();

  if (data.text) {
    formData.append('text', data.text);
  }

  if (data.file) {
    formData.append('file', data.file);
  }

  if (data.jobType) {
    formData.append('job_type', data.jobType);
  }

  if (data.zipCode) {
    formData.append('zip_code', data.zipCode);
  }

  if (data.budget) {
    formData.append('budget', data.budget);
  }

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to analyze quote');
  }

  return response.json();
  */
}

export async function createCheckoutSession(): Promise<{ url: string }> {
  // For testing purposes, we'll simulate an API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return a mock response
  return { url: 'https://checkout.stripe.com/mock-session' };

  // In production, you would use the following code:
  /*
  const response = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create checkout session');
  }

  return response.json();
  */
}
