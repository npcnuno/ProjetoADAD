// pages/MoviesPage.js
import React from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Button, Form, Card } from "react-bootstrap";
import { useMoviesData } from "../hooks/useMoviesData";
import MovieCard from "../components/MovieCard";
import CustomPagination from "../components/Pagination";

export default function MoviesPage() {
  const {
    movies,
    loading,
    error,
    searchInputValue,
    searchError,
    hasActiveFilters,
    totalPages,
    setError,
    setSearchError,
    getSearch,
    getGenre,
    getYear,
    getRatingSort,
    getPage,
    getLimit,
    setSearchInputValue,
    handleDeleteMovie,
    handlePageChange,
    handleGenreChange,
    handleYearChange,
    handleRatingSortChange,
    handleItemsPerPageChange,
    clearFilters,
    triggerSearch,
    GENRE_OPTIONS,
    RATING_OPTIONS
  } = useMoviesData();

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
            <Col md={3}>
              <Form.Label className="fw-semibold">Search Movies</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type at least 2 characters to search..."
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
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
            <Col md={2}>
              <Form.Label className="fw-semibold">Sort by Rating</Form.Label>
              <Form.Select value={getRatingSort()} onChange={handleRatingSortChange} className="border-primary">
                {RATING_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3} className="text-md-end">
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
                Showing {movies.length} of {totalPages * getLimit()} movies
                {getSearch() && ` for "${getSearch()}"`}
                {getGenre() !== 'All' && ` in genre "${getGenre()}"`}
                {getYear() && ` from year "${getYear()}"`}
                {getRatingSort() !== 'Default' && ` sorted by ${getRatingSort()}`}
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