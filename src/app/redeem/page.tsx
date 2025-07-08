'use client';

import React, { useState, useEffect } from 'react';
import { PROD_API_URL } from '@/services/api';
import { getToken } from '@/utils/auth';
import Link from 'next/link';

export default function RedeemPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Get code from URL parameters without useSearchParams
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get('code');
      if (codeParam) {
        setCode(codeParam);
      }
    }
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = getToken();
    if (!token) {
      setMessage({ text: 'Please log in to redeem codes', type: 'error' });
      return;
    }

    if (!code.trim()) {
      setMessage({ text: 'Please enter a code', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${PROD_API_URL}/codes/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          owner: token,
        }),
      });

      if (response.ok) {
        setMessage({ text: 'Code redeemed successfully!', type: 'success' });
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('code')) {
            urlParams.delete('code');
            const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
            window.history.replaceState({}, '', newUrl);
          }
        }
      } else if (response.status === 400) {
        const data = await response.text();
        if (data === '"Code already redeemed"') {
          setMessage({ text: 'This code has already been redeemed', type: 'error' });
        } else {
          setMessage({ text: 'Invalid code format', type: 'error' });
        }
        
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('code')) {
            urlParams.delete('code');
            const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
            window.history.replaceState({}, '', newUrl);
          }
        }
      } else if (response.status === 404) {
        setMessage({ text: 'Invalid Code', type: 'error' });
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('code')) {
            urlParams.delete('code');
            const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
            window.history.replaceState({}, '', newUrl);
          }
        }
      } else if (response.status === 409) {
        setMessage({ text: 'The code has already been redeemed', type: 'error' });
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('code')) {
            urlParams.delete('code');
            const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
            window.history.replaceState({}, '', newUrl);
          }
        }
      } else {
        setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-8 py-16 max-w-[1920px]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-white text-center">Redeem Jailbreak Changelogs Code</h1>
        
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left Column - Redemption Form */}
          <div className="space-y-8">
            <form onSubmit={handleRedeem} className="space-y-8">
              <div className="space-y-2">
                <label htmlFor="code" className="block text-lg font-medium text-gray-300 mb-3">
                  Enter your code here
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`w-full px-6 py-3 bg-[#212a31] border rounded-lg text-white text-lg focus:outline-none focus:ring-2 transition-colors ${
                    message?.type === 'error' 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-700 focus:ring-[#1d7da3]'
                  }`}
                  placeholder="Enter your code here"
                  disabled={isLoading}
                />
                {message && (
                  <div className={`flex items-center space-x-2 text-sm ${
                    message.type === 'success' ? 'text-blue-300' : 'text-red-400'
                  }`}>
                    {message.type === 'success' ? (
                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    )}
                    <span>{message.text}</span>
                  </div>
                )}
                <p className="text-sm text-gray-400 mt-4">
                  By redeeming your code, you represent that you, and your parent or legal guardian if you are under age 18, agree to our{' '}
                  <Link href="/tos" className="text-blue-300 hover:text-blue-400">
                    Terms of Use
                  </Link>{' '}
                  and acknowledge our{' '}
                  <Link href="/privacy" className="text-blue-300 hover:text-blue-400">
                    Privacy Policy
                  </Link>.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg text-white transition-colors ${
                  isLoading || !code.trim()
                    ? 'bg-[#1d7da3]/50'
                    : 'bg-[#1d7da3] hover:bg-[#124e66]'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redeeming...
                  </div>
                ) : (
                  'Redeem'
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Instructions */}
          <div className="bg-[#212a31] border border-gray-700/50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">How to Get a Code</h2>
            <ol className="space-y-6 text-gray-300">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1d7da3] rounded-full text-white font-semibold mr-4">1</span>
                <span className="text-lg">Join our game <a href="https://www.roblox.com/games/104188650191561/Support-Us" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-400">here</a> to purchase a Supporter Tier</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1d7da3] rounded-full text-white font-semibold mr-4">2</span>
                <span className="text-lg">Complete the required actions in-game</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1d7da3] rounded-full text-white font-semibold mr-4">3</span>
                <span className="text-lg">Copy your unique code</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1d7da3] rounded-full text-white font-semibold mr-4">4</span>
                <span className="text-lg">Paste it here and click Redeem to get your benefits</span>
              </li>
            </ol>

            <div className="mt-8 p-4 bg-yellow-900/40 border-l-4 border-yellow-400 rounded">
              <p className="text-yellow-200 text-base font-medium">
                <strong>Ko-fi Supporters:</strong> If purchasing a code via <a href="https://ko-fi.com/jbchangelogs" target="_blank" rel="noopener noreferrer" className="underline text-yellow-100">Ko-fi</a> for supporter tiers, <span className="font-bold">ensure your Discord user ID is in parenthesis inside your message</span> (e.g., <code>(1019539798383398946)</code>). This is required to receive your code!
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <p className="text-gray-300 text-lg mb-6">Thank you for supporting us!</p>
              <Link 
                href="/supporting" 
                className="inline-flex items-center text-blue-300 hover:text-blue-400 text-lg"
              >
                <span>Want to see what perks you&apos;ll get?</span>
                <svg className="h-5 w-5 ml-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 