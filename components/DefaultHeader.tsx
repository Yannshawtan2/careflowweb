// File: /d:/careflowweb/components/DefaultHeader.tsx

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logo from '@/images/logo.png';

const DefaultHeader: React.FC = () => {
    return (
        <header className="bg-green-100 text-green-800 border-b-2 border-green-200  text-center font-sans">
        <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
          <a className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0">
                <Image src={logo} alt="Logo" className="h-8 w-8" />
            <span className="ml-3 text-xl">Careflow</span>
          </a>
          <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
          <Link href="/" className="text-green-700 hover:text-green-900 mx-2">
                    Home
                </Link>
                <Link href="/donate" className="text-green-700 hover:text-green-900 mx-2">
                    Donate
                </Link>
          </nav>
          <Link href="/login" className="inline-flex items-center bg-gray-100 border-0 py-1 px-3 focus:outline-none hover:bg-gray-200 rounded text-base mt-4 md:mt-0">Login
            <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4 ml-1" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
      </header>
    );
};

export default DefaultHeader;