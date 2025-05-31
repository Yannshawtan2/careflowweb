// File: /d:/careflowweb/components/DefaultHeader.tsx

import React from 'react';
import Link from 'next/link';

const DefaultHeader: React.FC = () => {
    return (
        <header className="bg-green-100 text-green-800 border-b-2 border-green-200 p-5 text-center font-sans">
            <h1 className="text-2xl font-bold">Welcome to CareFlow</h1>
            <p className="text-sm mt-2">Your trusted partner in medical solutions</p>
            <nav className="mt-4">
                <Link href="/" className="text-green-700 hover:text-green-900 mx-2">
                    Home
                </Link>
                <Link href="/about" className="text-green-700 hover:text-green-900 mx-2">
                    About
                </Link>
                <Link href="/contact" className="text-green-700 hover:text-green-900 mx-2">
                    Contact
                </Link>
            </nav>
        </header>
    );
};

export default DefaultHeader;