// src/pages/MoviesPage.js

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Spinner, Alert, Button, Form, InputGroup } from "react-bootstrap";
import { Link } from 'react-router-dom';
import api from "../api/api";
import MovieCard from "../components/MovieCard";
import CustomPagination from "../components/Pagination";

// A hardcoded list of genres for the dropdown. This could also be fetched from an API.
const GENRE_OPTIONS = ["All", "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Sci-Fi", "Thriller"];

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filtering and pagination
  const [viewMode, setViewMode] = useState('all'); // 'all', 'top', 'star', 'genre', 'year', 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedYear, setSelectedYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage, setMoviesPerPage] = useState(10); // State for items per page
  const [totalMovies, setTotalMovies] = useState(0);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      let response;
      // Determine which API call to make based on the current viewMode
      switch (viewMode) {
        case 'search':
          response = await api.searchMovies(searchQuery, currentPage, moviesPerPage);
          break;
        case 'top':
          // Top movies is a special case, not paginated. Fetch a larger list.
          response = await api.getTopMovies(50);
          break;
        case 'star':
          response = await api.getStarMovies();
          break;
        case 'genre':
          if (selectedGenre === 'All') {
            response = await api.getMovies(currentPage, moviesPerPage);
          } else {
            response = await api.getMoviesByGenre(selectedGenre, currentPage, moviesPerPage);
          }
          break;
        case 'year':
          if (!selectedYear) {
            // If year is cleared, go back to 'all' view
            setViewMode('all');
            return;
          }
          response = await api.getMoviesByYear(selectedYear, currentPage, moviesPerPage);
          break;
        case 'all':
        default:
          response = await api.getMovies(currentPage, moviesPerPage);
          break;
      }
      
      setMovies(response.data.data);
      // Set total movies for pagination. Some endpoints might not return pagination info.
      if (response.data.pagination) {
        setTotalMovies(response.data.pagination.total);
      } else {
        setTotalMovies(response.data.data.length); // For non-paginated results
      }
      setError(null);
    } catch (err) {
      setError("Failed to fetch movies. Please try again.");
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch movies whenever any of the dependencies change
  useEffect(() => {
    fetchMovies();
  }, [currentPage, moviesPerPage, viewMode, searchQuery, selectedGenre, selectedYear]); // Added moviesPerPage here

  const handleDeleteMovie = async (movieId) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      try {
        await api.deleteMovie(movieId);
        fetchMovies(); // Re-fetch to update the list
      } catch (err) {
        setError("Failed to delete movie. Please try again.");
        console.error('Error deleting movie:', err);
      }
    }
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setViewMode('search');
    setCurrentPage(1);
  };

  const handleGenreChange = (e) => {
    setSelectedGenre(e.target.value);
    setViewMode('genre');
    setCurrentPage(1);
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    if (year) {
      setViewMode('year');
      setCurrentPage(1);
    } else {
      setViewMode('all');
      setCurrentPage(1);
    }
  };
  
  // Function to handle changes in the number of items per page
  const handleItemsPerPageChange = (e) => {
    setMoviesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSpecialView = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };
  
  const totalPages = Math.ceil(totalMovies / moviesPerPage);

  return (
    <Container className="pt-5 pb-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>Movie Collection</h2>
        </Col>
        <Col className="text-end">
          <Link to="/movies/new">
            <Button variant="primary">+ Create New Movie</Button>
          </Link>
        </Col>
      </Row>

      {/* --- FILTER BAR --- */}
      <Row className="mb-4 g-3 align-items-end">
        <Col md={4}>
          <Form.Label>Search by Title</Form.Label>
          <Form onSubmit={handleSearchSubmit}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Enter movie title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="outline-secondary">Search</Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={2}>
          <Form.Label>Filter by Genre</Form.Label>
          <Form.Select value={selectedGenre} onChange={handleGenreChange}>
            {GENRE_OPTIONS.map(genre => <option key={genre} value={genre}>{genre}</option>)}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Label>Filter by Year</Form.Label>
          <Form.Control type="number" placeholder="e.g., 2023" value={selectedYear} onChange={handleYearChange} />
        </Col>
        <Col md={4} className="text-md-end">
          <Button variant="outline-info" className="me-2" onClick={() => handleSpecialView('top')}>Top Rated</Button>
          <Button variant="outline-warning" onClick={() => handleSpecialView('star')}>Star Movies</Button>
        </Col>
      </Row>

      {/* --- DISPLAY CONTROLS --- */}
      <Row className="mb-4 justify-content-end align-items-center">
        <Col xs="auto">
          <Form.Label htmlFor="items-per-page-select" visuallyHidden>
            Items per page
          </Form.Label>
        </Col>
        <Col xs="auto">
          <Form.Select
            id="items-per-page-select"
            value={moviesPerPage}
            onChange={handleItemsPerPageChange}
            style={{ width: 'auto' }}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Loading State */}
      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {/* Error State */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Movies List */}
      {!loading && !error && (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {movies.length > 0 ? (
              movies.map((movie) => (
                <Col key={movie._id}>
                  <MovieCard 
                    {...movie} 
                    onDelete={handleDeleteMovie} 
                  />
                </Col>
              ))
            ) : (
              <Col>
                <p>No movies found for your current filters.</p>
              </Col>
            )}
          </Row>
          
          {/* Pagination Component - only show if there's more than one page */}
          {totalPages > 1 && (
            <CustomPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </Container>
  );
}