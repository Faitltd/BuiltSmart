import React from 'react';
import Head from 'next/head';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Head>
        <title>Terms of Service - Home Health Score</title>
        <meta name="description" content="Terms of Service for Home Health Score" />
      </Head>

      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-blue max-w-none">
        <p className="text-lg mb-4">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Welcome to Home Health Score. These Terms of Service govern your use of our website and services.
          By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms,
          you may not access the service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
        <p>
          Home Health Score provides a voice-based application that allows users to assess their home's condition through a natural conversation with an AI assistant.
          Our service includes voice recording and processing, natural language conversation about home condition, AI-powered analysis,
          health score calculation, prioritized repair recommendations, and downloadable PDF reports.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
        <p>
          When you create an account with us, you guarantee that the information you provide is accurate, complete, and current at all times.
          Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the service.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account.
          You agree to accept responsibility for any and all activities or actions that occur under your account and/or password.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are and will remain the exclusive property of Home Health Score and its licensors.
          The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Home Health Score.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Disclaimer of Warranty</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, either express or implied,
          including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
        </p>
        <p>
          Home Health Score, its subsidiaries, affiliates, and its licensors do not warrant that:
        </p>
        <ul className="list-disc pl-5 my-4">
          <li>The Service will function uninterrupted, secure or available at any particular time or location;</li>
          <li>Any errors or defects will be corrected;</li>
          <li>The Service is free of viruses or other harmful components;</li>
          <li>The results of using the Service will meet your requirements.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
        <p>
          In no event shall Home Health Score, nor its directors, employees, partners, agents, suppliers, or affiliates,
          be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation,
          loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of the United States,
          without regard to its conflict of law provisions.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
          If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect.
          What constitutes a material change will be determined at our sole discretion.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="my-4">
          <strong>Email:</strong> terms@homehealthscore.com<br />
          <strong>Address:</strong> 123 Main Street, Suite 100, Anytown, USA 12345
        </p>
      </div>
    </div>
  );
}
