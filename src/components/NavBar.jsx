import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
// done responsive navbar
const NavBar = () => {
  const location = useLocation();
  const isVHSC = location.pathname.startsWith('/vhsc-');

  const vhscSections = [
    { path: '/vhsc-aptitude', label: 'Aptitude', shortLabel: 'Apt' },
    { path: '/vhsc-academic', label: 'Academic', shortLabel: 'Acd' },
    { path: '/vhsc-career', label: 'Career', shortLabel: 'Car' },
    { path: '/vhsc-personality', label: 'Personality', shortLabel: 'Per' },
    { path: '/vhsc-intelligences', label: 'Intelligences', shortLabel: 'Int' },
    { path: '/vhsc-context', label: 'Context', shortLabel: 'Ctx' }
  ];

  const regularSections = [
    { path: '/aptitude', label: 'Aptitude', shortLabel: 'Apt' },
    { path: '/personality', label: 'Personality', shortLabel: 'Per' },
    { path: '/intelligences', label: 'Intelligences', shortLabel: 'Int' },
    { path: '/career', label: 'Career', shortLabel: 'Car' },
    { path: '/academic', label: 'Academic', shortLabel: 'Acd' },
    { path: '/context', label: 'Context', shortLabel: 'Ctx' }
  ];

  const sections = isVHSC ? vhscSections : regularSections;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white shadow-xl border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Title */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold tracking-wide">
              {isVHSC ? 'VHSC Assessment' : 'Career Assessment'}
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-4">
            {sections.map((section) => (
              <NavLink
                key={section.path}
                to={section.path}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap backdrop-blur-sm ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg transform scale-105 border border-white/30'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white hover:shadow-md'
                  }`
                }
              >
                {section.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-center flex-1 space-x-2">
            {sections.map((section) => (
              <NavLink
                key={section.path}
                to={section.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap backdrop-blur-sm ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg border border-white/30'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white hover:shadow-md'
                  }`
                }
              >
                {section.shortLabel}
              </NavLink>
            ))}
          </div>

          {/* Progress Indicator - Simplified */}
          <div className="hidden xl:flex items-center space-x-3">
            <span className="text-sm text-blue-100 font-medium">Progress</span>
            <div className="flex space-x-1.5">
              {sections.map((section, index) => {
                const isCompleted = false; // TODO: Add completion logic
                const isActive = location.pathname === section.path;
                return (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-400'
                        : 'bg-blue-300/60'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
