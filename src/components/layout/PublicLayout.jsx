import React from 'react';
import Header from './Header';
import Footer from './Footer';

export function PublicLayout({ children, showHeader = true, showFooter = true }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export default PublicLayout;
