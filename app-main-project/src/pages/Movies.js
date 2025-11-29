import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Button, Form, Card } from "react-bootstrap";
import api from "../api/api";
import MovieCard from "../components/MovieCard";
import CustomPagination from "../components/Pagination";

const GENRE_OPTIONS = ["All", "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Sci-Fi", "Thriller"];

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalMovies, setTotalMovies] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInputValue, setSearchInputValue] = useState(searchParams.get('search') || '');

  // Helper functions to get URL params
  const getView = useCallback(() => searchParams.get('view') || 'all', [searchParams]);
  const getSearch = useCallback(() => searchParams.get('search') || '', [searchParams]);
  const getGenre = useCallback(() => searchParams.get('genre') || 'All', [searchParams]);
  const getYear = useCallback(() => searchParams.get('year') || '', [searchParams]);
  const getPage = useCallback(() => Number(searchParams.get('page')) || 1, [searchParams]);
  const getLimit = useCallback(() => Number(searchParams.get('limit')) || 10, [searchParams]);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    const view = getView();
    const search = getSearch();
    const genre = getGenre();
    const year = getYear();
    const page = getPage();
    const limit = getLimit();

    try {
      let response;
      switch (view) {
        case 'search':
          response = await api.searchMovies(search, page, limit);
          break;
        case 'top':
          // Pass limit parameter to getTopMovies to respect items per page setting
          response = await api.getTopMovies(limit, page);
          break;
        case 'star':
          response = await api.getStarMovies(page, limit);
          break;
        case 'genre':
          response = genre === 'All' 
            ? await api.getMovies(page, limit)
            : await api.getMoviesByGenre(genre, page, limit);
          break;
        case 'year':
          if (!year) {
            setSearchParams({});
            return;
          }
          response = await api.getMoviesByYear(year, page, limit);
          break;
        default:
          response = await api.getMovies(page, limit);
          break;
      }
      
      setMovies(response.data.data);
      setTotalMovies(response.data.pagination?.total || response.data.data.length);
      setError(null);
    } catch (err) {
      setError("Failed to fetch movies. Please try again.");
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  }, [getView, getSearch, getGenre, getYear, getPage, getLimit, setSearchParams]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      
      if (searchInputValue.trim()) {
        newParams.set('view', 'search');
        newParams.set('search', searchInputValue.trim());
      } else {
        // Only remove search-related params, keep others
        if (newParams.get('view') === 'search') {
          newParams.delete('view');
        }
        newParams.delete('search');
      }
      
      newParams.delete('page');
      setSearchParams(newParams);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInputValue, searchParams, setSearchParams]);

  const handleDeleteMovie = async (movieId) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      try {
        await api.deleteMovie(movieId);
        fetchMovies();
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
    
    if (genre !== 'All') {
      newParams.set('view', 'genre');
      newParams.set('genre', genre);
    } else {
      // If "All" is selected, remove genre filter
      if (newParams.get('view') === 'genre') {
        newParams.delete('view');
      }
      newParams.delete('genre');
    }
    
    // Reset page when changing filter
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleYearChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    const year = e.target.value;
    
    if (year) {
      newParams.set('view', 'year');
      newParams.set('year', year);
    } else {
      // If year is cleared, remove year filter
      if (newParams.get('view') === 'year') {
        newParams.delete('view');
      }
      newParams.delete('year');
    }
    
    // Reset page when changing filter
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleItemsPerPageChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', e.target.value);
    newParams.delete('page');
    setSearchParams(newParams);
  };

  // Modified to toggle special views instead of just setting them
  const handleSpecialView = (mode) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (getView() === mode) {
      // If clicking the active special view, toggle it off
      newParams.delete('view');
    } else {
      // Otherwise, set the new view
      newParams.set('view', mode);
    }
    
    // Reset page when changing view
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchInputValue('');
    setSearchParams({});
  };

  const totalPages = Math.ceil(totalMovies / getLimit());
  const currentView = getView();
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
                placeholder="Type to search movies..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                className="border-primary"
              />
            </Col>
            <Col md={2}>
              <Form.Label className="fw-semibold">Genre</Form.Label>
              <Form.Select value={getGenre()} onChange={handleGenreChange} className="border-primary">
                {GENRE_OPTIONS.map(genre => 
                  <option key={genre} value={genre}>{genre}</option>
                )}
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
                <Button 
                  variant={currentView === 'top' ? 'info' : 'outline-info'} 
                  onClick={() => handleSpecialView('top')}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-star-fill me-2"></i>
                  Top Rated
                </Button>
                <Button 
                  variant={currentView === 'star' ? 'warning' : 'outline-warning'} 
                  onClick={() => handleSpecialView('star')}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-bookmark-star me-2"></i>
                  Star Movies
                </Button>
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
                {currentView === 'top' && ' (Top Rated)'}
                {currentView === 'star' && ' (Star Movies)'}
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
              <Col className="text-center py-5">
                <div className="text-muted">
                  <i className="bi bi-film display-1"></i>
                  <h4 className="mt-3">No movies found</h4>
                  <p>Try adjusting your search or filters</p>
                  <Button variant="primary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </Col>
            )}
          </Row>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5">
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