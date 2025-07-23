"use client";

import React, { useState, useEffect, useMemo } from 'react';
import './globals.css';

const DOTS = '...';

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
};

const getPaginationRange = (currentPage: number, totalPages: number) => {
  const maxPageButtonsToShow = 4;

  if (totalPages <= maxPageButtonsToShow) {
    return range(1, totalPages);
  }

  let startPage = currentPage - Math.floor(maxPageButtonsToShow / 2);
  let endPage = currentPage + Math.ceil(maxPageButtonsToShow / 2) - 1;

  if (startPage < 1) {
    startPage = 1;
    endPage = maxPageButtonsToShow;
  }

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = totalPages - maxPageButtonsToShow + 1;
    if (startPage < 1) startPage = 1;
  }

  const pages = [];

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push(DOTS);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(DOTS);
    }
    pages.push(totalPages);
  }

  return pages;
};

// Main App Component
const App: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersTab, setFiltersTab] = useState<boolean>(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [portfolioTypeFilters, setPortfolioTypeFilters] = useState<string[]>([]);
  const [portfolioVerificationFilters, setPortfolioVerificationFilters] = useState<string[]>([]);
  const [idVerificationFilters, setIdVerificationFilters] = useState<string[]>([]);
  const [subscriptionFilters, setSubscriptionFilters] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [numPortfoliosFilter, setNumPortfoliosFilter] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<number>(50000);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Fetch data from Flask backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/users');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
        } else {
          setError(data.error || 'Failed to fetch users.');
        }
      } catch (e: any) {
        setError(`Error fetching data: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle size slider change
  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSizeFilter(Number(event.target.value));
    setCurrentPage(1);
  };

  // Filtered and Paginated Users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Global Search
    if (searchQuery) {
      filtered = filtered.filter(user =>
        Object.values(user).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Portfolio Type Filter
    if (portfolioTypeFilters.length > 0) {
      filtered = filtered.filter(user =>
        user['Portfolio Type'] && portfolioTypeFilters.includes(user['Portfolio Type'])
      );
    }

    // Portfolio Verification Filter
    if (portfolioVerificationFilters.length > 0) {
      filtered = filtered.filter(user =>
        user['Portfolio Verification'] && portfolioVerificationFilters.includes(user['Portfolio Verification'])
      );
    }

    // ID Verification Filter
    if (idVerificationFilters.length > 0) {
      filtered = filtered.filter(user =>
        user['ID Verification'] && idVerificationFilters.includes(user['ID Verification'])
      );
    }

    // Subscription Filter
    if (subscriptionFilters.length > 0) {
      filtered = filtered.filter(user =>
        subscriptionFilters.includes(user['Subscription'])
      );
    }

    // Location Search
    if (locationSearch) {
      filtered = filtered.filter(user =>
        user['Location'] && String(user['Location']).toLowerCase().includes(locationSearch.toLowerCase())
      );
    }

    // Number of Portfolios Filter
    if (numPortfoliosFilter) {
      filtered = filtered.filter(user => {
        const num = parseInt(user['No. of Portfolios']);
        if (numPortfoliosFilter === '4 or more') {
          return num >= 4;
        }
        return num === parseInt(numPortfoliosFilter);
      });
    }

    filtered = filtered.filter(user => {
      const sizeInKB = parseFloat(String(user['Size (KB)']));
      return sizeInKB <= sizeFilter;
    });

    return filtered;
  }, [
    users,
    searchQuery,
    portfolioTypeFilters,
    portfolioVerificationFilters,
    idVerificationFilters,
    subscriptionFilters,
    locationSearch,
    numPortfoliosFilter,
    sizeFilter,
  ]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleCheckboxChange = (
    filterState: string[],
    setFilterState: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    if (filterState.includes(value)) {
      setFilterState(filterState.filter(item => item !== value));
    } else {
      setFilterState([...filterState, value]);
    }
    setCurrentPage(1);
  };

  const handleRadioChange = (
    setFilterState: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setFilterState(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    let statusClass = 'status-badge-gray';
    switch (status) {
      case 'Verified':
        statusClass = 'status-badge-verified';
        break;
      case 'In Progress':
        statusClass = 'status-badge-inprogress';
        break;
      case 'Not Verified':
        statusClass = 'status-badge-notverified';
        break;
      default:
        break;
    }
    return (
      <span className={`status-badge ${statusClass}`}>
        {status}
      </span>
    );
  };

  const paginationRange = useMemo(() => {
    return getPaginationRange(currentPage, totalPages);
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="loading-error-container">
        <div className="loading-text">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-error-container">
        <div className="error-text">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header-container">
        <div className="flex-center" style={{ gap: '1rem' }}> {/* space-x-4 */}
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>Portfolio Database</h1> {/* text-2xl font-semibold text-gray-900 */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Type to Search"
              className="header-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} /* absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 */
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <button className="header-button">
            All Portfolios <span style={{ marginLeft: '0.5rem' }}>&#9660;</span> {/* ml-2 */}
          </button>
        </div>
        <div className="flex-center" style={{ gap: '1rem' }}> {/* space-x-4 */}
          <button className="header-icon-button">
            <svg
              style={{ width: '1.25rem', height: '1.25rem', color: 'currentColor' }} /* w-5 h-5 text-gray-500, changed to currentColor */
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 9.414V15a1 1 0 01-1.447.894L8 14.118V9.414L3.293 6.707A1 1 0 013 6V3z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button className="header-button" onClick={() => setFiltersTab(prev => !prev)}>
            Collapse
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content-area">
        {filtersTab && (
          <div className="filter-section-card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Filter</h2>
            <div className="filter-grid">
              {/* Column 1: Portfolio Type */}
              <div>
                <div className="filter-column-header-line"></div>
                <label className="filter-label">
                  Portfolio Type <span style={{ marginLeft: '0.25rem' }}>&#9660;</span>
                </label>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Type to Search"
                    className="header-search-input"
                    style={{ width: '100%' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg
                    style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-col-space-y-2">
                  {['Personal', 'Corporate', 'Matrimonial', 'Business', 'Creative', 'Academic', 'Community & Service', 'Lifestyle', 'Professional'].map(type => (
                    <div key={type} className="flex-center">
                      <input
                        id={`portfolio-type-${type}`}
                        name="portfolio-type"
                        type="checkbox"
                        className="checkbox-radio-input"
                        checked={portfolioTypeFilters.includes(type)}
                        onChange={() => handleCheckboxChange(portfolioTypeFilters, setPortfolioTypeFilters, type)}
                      />
                      <label htmlFor={`portfolio-type-${type}`} className="checkbox-radio-label">
                        {type}
                      </label>
                      {(type === 'Business' || type === 'Creative' || type === 'Academic' || type === 'Community & Service' || type === 'Lifestyle' || type === 'Professional') && (
                        <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>&#9660;</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Portfolio Verification, ID Verification, Number of Portfolios */}
              <div>
                <div className="filter-column-header-line"></div>
                <label className="filter-label">
                  Portfolio Verification <span style={{ marginLeft: '0.25rem' }}>&#9660;</span>
                </label>
                <div className="flex-col-space-y-2" style={{ marginBottom: '1.5rem' }}>
                  {['Verified', 'In Progress', 'Not Verified'].map(status => (
                    <div key={status} className="flex-center">
                      <input
                        id={`portfolio-verification-${status}`}
                        name="portfolio-verification"
                        type="checkbox"
                        className="checkbox-radio-input"
                        checked={portfolioVerificationFilters.includes(status)}
                        onChange={() => handleCheckboxChange(portfolioVerificationFilters, setPortfolioVerificationFilters, status)}
                      />
                      <label htmlFor={`portfolio-verification-${status}`} className="checkbox-radio-label">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="filter-column-header-line"></div>
                <label className="filter-label">
                  ID Verification <span style={{ marginLeft: '0.25rem' }}>&#9660;</span>
                </label>
                <div className="flex-col-space-y-2" style={{ marginBottom: '1.5rem' }}>
                  {['Verified', 'In Progress', 'Not Verified'].map(status => (
                    <div key={status} className="flex-center">
                      <input
                        id={`id-verification-${status}`}
                        name="id-verification"
                        type="checkbox"
                        className="checkbox-radio-input"
                        checked={idVerificationFilters.includes(status)}
                        onChange={() => handleCheckboxChange(idVerificationFilters, setIdVerificationFilters, status)}
                      />
                      <label htmlFor={`id-verification-${status}`} className="checkbox-radio-label">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="filter-column-header-line"></div>
                <label className="filter-label">
                  Number of Portfolios <span style={{ marginLeft: '0.25rem' }}>&#9660;</span>
                </label>
                <div className="flex-wrap-gap-2">
                  {['1', '2', '3', '4 or more'].map(num => (
                    <div key={num} className="flex-center">
                      <input
                        id={`num-portfolios-${num}`}
                        name="num-portfolios"
                        type="checkbox"
                        className="checkbox-radio-input"
                        checked={numPortfoliosFilter === num}
                        onChange={() => handleRadioChange(setNumPortfoliosFilter, num)}
                      />
                      <label htmlFor={`num-portfolios-${num}`} className="checkbox-radio-label">
                        {num}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Size, Location */}
              <div>
                <div className="filter-column-header-line"></div>
                <label className="filter-label">
                  Size <span style={{ marginLeft: '0.25rem' }}>&#9660;</span>
                </label>
                <div style={{ marginBottom: '0.5rem', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', backgroundColor: '#e5e7eb' }}>
                    {sizeFilter} KB
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  value={sizeFilter}
                  onChange={handleSizeChange}
                  className="size-range-slider"
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
                  <span>0 KB</span>
                  <span>50,000 KB</span>
                </div>

                <div className="filter-column-header-line"></div>
                <label className="filter-label">
                  Location <span style={{ marginLeft: '0.25rem' }}>&#9660;</span>
                </label>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Type to Search"
                    className="header-search-input"
                    style={{ width: '100%' }}
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                  />
                  <svg
                    style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-col-space-y-2">
                  {['United States', 'India', 'Canada', 'Japan'].map(loc => (
                    <div key={loc} className="flex-center">
                      <input
                        id={`location-${loc}`}
                        name="location"
                        type="checkbox"
                        className="checkbox-radio-input"
                        checked={locationSearch.includes(loc)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLocationSearch(loc);
                          } else {
                            setLocationSearch('');
                          }
                        }}
                      />
                      <label htmlFor={`location-${loc}`} className="checkbox-radio-label">
                        {loc}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: Subscription */}
              <div>
                <div className="filter-column-header-line"></div>
                <label className="filter-label">
                  Subscription <span style={{ marginLeft: '0.25rem' }}>&#9660;</span>
                </label>
                <div className="flex-col-space-y-2">
                  {['Basic', 'Standard', 'Advanced', 'Premium'].map(sub => (
                    <div key={sub} className="flex-center">
                      <input
                        id={`subscription-${sub}`}
                        name="subscription"
                        type="checkbox"
                        className="checkbox-radio-input"
                        checked={subscriptionFilters.includes(sub)}
                        onChange={() => handleCheckboxChange(subscriptionFilters, setSubscriptionFilters, sub)}
                      />
                      <label htmlFor={`subscription-${sub}`} className="checkbox-radio-label">
                        {sub}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="table-container">
          <table>
            <thead className="table-head">
              <tr>
                <th className="table-header-cell">
                </th>
                <th className="table-header-cell">
                  Member Name
                  <span style={{ marginLeft: '0.25rem', color: '#9ca3af' }}>&#9650;&#9660;</span>
                </th>
                <th className="table-header-cell">
                  Username
                  <span style={{ marginLeft: '0.25rem', color: '#9ca3af' }}>&#9650;&#9660;</span>
                </th>
                <th className="table-header-cell">
                  No. of Portfolios
                  <span style={{ marginLeft: '0.25rem', color: '#9ca3af' }}>&#9650;&#9660;</span>
                </th>
                <th className="table-header-cell">
                  ID Verification
                  <span style={{ marginLeft: '0.25rem', color: '#9ca3af' }}>&#9650;&#9660;</span>
                </th>
                <th className="table-header-cell">
                  Portfolio Verification
                  <span style={{ marginLeft: '0.25rem', color: '#9ca3af' }}>&#9650;&#9660;</span>
                </th>
                <th className="table-header-cell">
                  Location
                  <span style={{ marginLeft: '0.25rem', color: '#9ca3af' }}>&#9650;&#9660;</span>
                </th>
                <th className="table-header-cell">
                  Size
                  <span style={{ marginLeft: '0.25rem', color: '#9ca3af' }}>&#9650;&#9660;</span>
                </th>
                <th className="table-header-cell">
                  Subscription
                  <span style={{ marginLeft: '0.25rem', color: '#9ca3af' }}>&#9650;&#9660;</span>
                </th>
                <th style={{ position: 'relative', padding: '0.75rem 1.5rem' }}>
                  <span style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: '0' }}>Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user._id}>
                    <td style={{ fontWeight: 50, fontSize: "1.75rem"}} className="table-data-cell">
                      +
                    </td>
                    <td className="table-data-cell">
                      <div className="flex-center">
                        <div style={{ flexShrink: '0', height: '2.5rem', width: '2.5rem' }}>
                          <img
                            className="member-avatar"
                            src={`https://placehold.co/40x40/cccccc/ffffff?text=${user['Member Name'] ? user['Member Name'].charAt(0) : '?'}`}
                            alt=""
                          />
                        </div>
                        <div style={{ marginLeft: '1rem' }}>
                          <div className="member-name-text">{user['Member Name']}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-data-cell">
                      {user['Username']}
                    </td>
                    <td className="table-data-cell">
                      {user['No. Of Portfolios']}
                    </td>
                    <td className="table-data-cell">
                      {getStatusBadge(user['ID Verification'])}
                    </td>
                    <td className="table-data-cell">
                      {getStatusBadge(user['Portfolio Verification'])}
                    </td>
                    <td className="table-data-cell">
                      {user['Location']}
                    </td>
                    <td className="table-data-cell">
                      {Math.round(user["Size (KB)"])} KB
                    </td>
                    <td className="table-data-cell">
                      {user['Subscription']}
                      {"\t\t\t"}&#8942;
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ padding: '1rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <nav
            className="pagination-nav"
            aria-label="Pagination"
          >
            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                {/* Left Arrow Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div className="flex-center" style={{ gap: '0.25rem', marginLeft: '1rem' }}>
                {paginationRange.map((page, index) => {
                  if (page === DOTS) {
                    return <span key={`${page}-${index}`} className="pagination-button dots">...</span>;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(Number(page))}
                      aria-current={currentPage === page ? 'page' : undefined}
                      className={`pagination-button ${
                        currentPage === page
                          ? 'pagination-button-selected'
                          : ''
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
                style={{ marginLeft: '0.75rem' }}
              >
                {/* Right Arrow Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <div className="flex-center" style={{ marginLeft: '1rem' }}>
                <select
                  id="items-per-page"
                  name="items-per-page"
                  className="items-per-page-select"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>/Page</span>
              </div>
            </div>
          </nav>
        </div>
      </main>
    </div>
  );
};

export default App;