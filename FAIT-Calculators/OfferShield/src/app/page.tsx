import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Not sure about your renovation quote? Get instant insight.
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              OfferShield uses AI to analyze contractor quotes, detect hidden costs, vague language, and missing items to help you make informed decisions.
            </p>
            <Link
              href="/upload"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Upload Your Quote
            </Link>
          </div>
          <div className="md:w-1/2 md:pl-10">
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <div className="border-l-4 border-red-500 pl-4 mb-4">
                  <p className="text-red-600 font-semibold">Vague Labor Costs</p>
                  <p className="text-gray-600">No hourly breakdown provided</p>
                </div>
                <div className="border-l-4 border-red-500 pl-4 mb-4">
                  <p className="text-red-600 font-semibold">Material Markup: 30%</p>
                  <p className="text-gray-600">Industry standard is 15-20%</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <p className="text-yellow-600 font-semibold">Missing Timeline</p>
                  <p className="text-gray-600">No project completion date specified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Quote</h3>
              <p className="text-gray-600">Upload your contractor's quote in PDF, Word, or text format.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">Our AI scans for vague language, hidden costs, and missing items.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Insights</h3>
              <p className="text-gray-600">Receive a detailed report with suggestions and questions to ask.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8">
              <h3 className="text-2xl font-bold text-center mb-4">Quote Analysis</h3>
              <div className="text-center mb-6">
                <span className="text-5xl font-bold">$9.99</span>
                <span className="text-gray-600">/report</span>
              </div>
              <ul className="mb-8">
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Detailed risk analysis
                </li>
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Suggested questions to ask
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Downloadable PDF report
                </li>
              </ul>
              <Link
                href="/upload"
                className="block text-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full"
              >
                Try For Free
              </Link>
              <p className="text-center text-sm text-gray-600 mt-4">First analysis is free!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-2xl font-bold">OfferShield</div>
              <p className="text-gray-400">Protecting homeowners from hidden costs</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-blue-400">Terms</a>
              <a href="#" className="hover:text-blue-400">Privacy</a>
              <a href="#" className="hover:text-blue-400">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} OfferShield. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
