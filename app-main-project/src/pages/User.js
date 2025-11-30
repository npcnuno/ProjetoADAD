import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Button, Form, Card } from "react-bootstrap";
import api from "../api/api";
import MovieCard from "../components/MovieCard";
import CustomPagination from "../components/Pagination";

const GENRE_OPTIONS = ["All", "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Sci-Fi", "Thriller"];

export default function UserPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const getSearch = () => searchParams.get('search') || '';
  const getGenre = () => searchParams.get('genre') || 'All';
  const getYear = () => searchParams.get('year') || '';
  const getPage = () => Number(searchParams.get('page')) || 1;
  const getLimit = () => Number(searchParams.get('limit')) || 10;

  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState(null); // This will hold the full client-side filtered list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalMovies, setTotalMovies] = useState(0);
  const [searchInputValue, setSearchInputValue] = useState(getSearch());
  const [mode, setMode] = useState('server'); // 'server' or 'client'
  const [searchError, setSearchError] = useState('');
  const searchTimeoutRef = useRef(null);

  // A key to track changes in filters to decide between server/client mode
  const filterKey = `${getSearch()}_${getGenre()}_${getYear()}`;

  // Function to trigger search with minimum character validation
  const triggerSearch = () => {
    const trimmedSearch = searchInputValue.trim();
    
    // Check if search has at least 2 characters
    if (trimmedSearch && trimmedSearch.length < 2) {
      setSearchError('Please enter at least 2 characters to search');
      return;
    }
    
    setSearchError('');
    const newParams = new URLSearchParams(searchParams);
    
    if (trimmedSearch && trimmedSearch.length >= 2) {
      newParams.set('search', trimmedSearch);
    } else {
      newParams.delete('search');
    }
    newParams.delete('page'); // Reset page when search changes
    setSearchParams(newParams);
  };

  // Determine if we should use client-side or server-side rendering
  useEffect(() => {
    // Count active standard filters (search, genre, year)
    const count = () => {
      let c = 0;
      if (getSearch()) c++;
      if (getGenre() !== 'All') c++;
      if (getYear()) c++;
      return c;
    };
    
    // Use client-side mode when more than one filter is active
    const isClient = count() > 1;
    setMode(isClient ? 'client' : 'server');
  }, [filterKey]);

  // Effect for CLIENT-SIDE data fetching and filtering
  useEffect(() => {
    if (mode === 'client') {
      (async () => {
        setLoading(true);
        try {
          let finalResults = [];
          
          // Handle combined filters by fetching from multiple endpoints
          const fetchPromises = [];
          const search = getSearch();
          const genre = getGenre();
          const year = getYear();

          // Helper function to fetch all pages for a given API call
          const fetchAllPages = async (apiCall, args) => {
            let allResults = [];
            let currentPage = 1;
            const batchLimit = 100; // Fetch in larger batches for efficiency
            let total = 0;
            let response;
            do {
              response = await apiCall(...args, currentPage, batchLimit);
              allResults = [...allResults, ...response.data.data];
              total = response.data.pagination.total;
              currentPage++;
            } while (allResults.length < total);
            return allResults;
          };

          // Add API calls to a promise array based on active filters
          if (search) {
            fetchPromises.push(fetchAllPages(api.searchMovies, [search]));
          }
          if (genre !== 'All') {
            fetchPromises.push(fetchAllPages(api.getMoviesByGenre, [genre]));
          }
          if (year) {
            fetchPromises.push(fetchAllPages(api.getMoviesByYear, [year]));
          }

          // Execute all API calls in parallel
          const results = await Promise.all(fetchPromises);

          // Find the intersection of the fetched results to satisfy all filters
          if (results.length > 0) {
            // Start with the first set of results
            finalResults = results[0];
            // Iterate through the remaining result sets and filter down
            for (let i = 1; i < results.length; i++) {
              const currentResultIds = new Set(results[i].map(movie => movie._id));
              finalResults = finalResults.filter(movie => currentResultIds.has(movie._id));
            }
            
            // Ensure uniqueness by creating a map of movies by ID
            const uniqueMoviesMap = new Map();
            finalResults.forEach(movie => {
              uniqueMoviesMap.set(movie._id, movie);
            });
            
            // Convert back to array
            finalResults = Array.from(uniqueMoviesMap.values());
          }
          
          setFilteredMovies(finalResults);
          setTotalMovies(finalResults.length);
          setError(null);
        } catch (err) {
          setError("Failed to fetch movies. Please try again.");
          console.error('Error fetching movies:', err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [mode, filterKey]); // Re-run when mode or any filter changes

  // Effect for SERVER-SIDE data fetching (for single filters or no filters)
  useEffect(() => {
    if (mode === 'server') {
      (async () => {
        setLoading(true);
        try {
          const page = getPage();
          const limit = getLimit();
          const search = getSearch();
          const genre = getGenre();
          const year = getYear();
          let response;
          
          // Determine which single API call to make
          if (search) {
            response = await api.searchMovies(search, page, limit);
          } else if (genre !== 'All') {
            response = await api.getMoviesByGenre(genre, page, limit);
          } else if (year) {
            response = await api.getMoviesByYear(year, page, limit);
          } else {
            response = await api.getMovies(page, limit);
          }
          
          // Ensure uniqueness in server-side results as well
          const uniqueMoviesMap = new Map();
          response.data.data.forEach(movie => {
            uniqueMoviesMap.set(movie._id, movie);
          });
          const uniqueMovies = Array.from(uniqueMoviesMap.values());
          
          setMovies(uniqueMovies);
          setTotalMovies(response.data.pagination ? response.data.pagination.total : uniqueMovies.length);
          setError(null);
        } catch (err) {
          setError("Failed to fetch movies. Please try again.");
          console.error('Error fetching movies:', err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [searchParams, mode]);

  // Effect for paginating the client-side filtered data
  useEffect(() => {
    if (mode === 'client' && filteredMovies) {
      const page = getPage();
      const limit = getLimit();
      const start = (page - 1) * limit;
      setMovies(filteredMovies.slice(start, start + limit));
    }
  }, [searchParams, mode, filteredMovies]);

  // Effect for debounced search input
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout
    searchTimeoutRef.current = setTimeout(() => {
      triggerSearch();
    }, 200); // Reduced debounce time for better responsiveness
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInputValue]);

  const handleDeleteMovie = async (movieId) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      try {
        await api.deleteMovie(movieId);
        // In client mode, invalidate the cache to force a refetch of all filtered data
        if (mode === 'client') {
          setFilteredMovies(null); 
        }
      } catch (err) {
        setError("Failed to delete movie. Please try again.");
        console.error('Error deleting movie:', err);
      }
    }
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
  };

  const handleGenreChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    const genre = e.target.value;
    if (genre === 'All') {
      newParams.delete('genre');
    } else {
      newParams.set('genre', genre);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleYearChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    const year = e.target.value.trim();
    if (year) {
      newParams.set('year', year);
    } else {
      newParams.delete('year');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleItemsPerPageChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', e.target.value);
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchInputValue('');
    setSearchError('');
    setSearchParams({});
  };

  const totalPages = Math.ceil(totalMovies / getLimit());
  const hasActiveFilters = searchParams.toString() !== '';

  return (
    <Container className="py-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="display-6 fw-bold text-primary">Movie Collection</h1>
          <p className="text-muted">Browse and manage your favorite movies</p>
        </Col>
        <Col xs="auto">
          <Link to="/movie/new">
            <Button variant="primary" size="lg" className="px-4">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Movie
            </Button>
          </Link>
        </Col>
      </Row>
      {/* Filters Section */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label className="fw-semibold">Search Movies</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type at least 2 characters to search..."
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
                  // Clear search error when user starts typing
                  if (searchError) {
                    setSearchError('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerSearch();
                  }
                }}
                onBlur={() => triggerSearch()}
                className={searchError ? "border-danger" : "border-primary"}
                isInvalid={!!searchError}
              />
              {searchError && (
                <Form.Control.Feedback type="invalid" className="d-block">
                  {searchError}
                </Form.Control.Feedback>
              )}
            </Col>
            <Col md={2}>
              <Form.Label className="fw-semibold">Genre</Form.Label>
              <Form.Select value={getGenre()} onChange={handleGenreChange} className="border-primary">
                {GENRE_OPTIONS.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="fw-semibold">Year</Form.Label>
              <Form.Control
                type="number"
                placeholder="Filter by year"
                value={getYear()}
                onChange={handleYearChange}
                className="border-primary"
              />
            </Col>
            <Col md={4} className="text-md-end">
              <div className="d-flex flex-wrap justify-content-md-end gap-2">
                {hasActiveFilters && (
                  <Button variant="outline-secondary" onClick={clearFilters}>
                    <i className="bi bi-x-circle me-2"></i>
                    Clear Filters
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      {/* Results Header */}
      <Row className="mb-3 align-items-center">
        <Col>
          {!loading && (
            <div className="d-flex align-items-center">
              <span className="text-muted">
                Showing {movies.length} of {totalMovies} movies
                {getSearch() && ` for "${getSearch()}"`}
                {getGenre() !== 'All' && ` in genre "${getGenre()}"`}
                {getYear() && ` from year "${getYear()}"`}
              </span>
            </div>
          )}
        </Col>
        <Col xs="auto">
          <Form.Select
            value={getLimit()}
            onChange={handleItemsPerPageChange}
            style={{ width: 'auto' }}
            className="border-primary"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </Form.Select>
        </Col>
      </Row>
      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading movies...</p>
        </div>
      )}
      {/* Error State */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      {/* Movies Grid */}
      {!loading && !error && (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {movies.length > 0 ? (
              movies.map((movie) => (
                <Col key={movie._id}>
                  <MovieCard {...movie} onDelete={handleDeleteMovie} />
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center py-5">
                <div className="d-flex flex-column align-items-center justify-content-center">
                  <i className="bi bi-film display-1 text-muted"></i>
                  <h4 className="mt-3 text-muted">No movies found</h4>
                  <p className="text-muted">Try adjusting your search or filters</p>
                  <Button variant="primary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </Col>
            )}
          </Row>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 d-flex justify-content-center">
              <CustomPagination
                currentPage={getPage()}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}