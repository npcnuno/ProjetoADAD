// src/components/MovieFormPage.js (or App.js)

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Spinner, Alert } from 'react-bootstrap';

// Import the api instance from your api.js file
import api from '../api/api';

export default function MovieFormPage() { // Renamed for clarity
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [movie, setMovie] = useState({ title: '', genres: '', year: '' });
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const getMovie = async () => {
      // If we are creating a new movie, we don't need to fetch data
      if (!isEditing) return;
      
      try {
        // Use the api instance to call the function
        const response = await api.getMovieById(id);
        
        // The actual movie data is nested in response.data.data
        const movieData = response.data.data;
        
        // Convert genres array to a comma-separated string for the input field
        setMovie({ ...movieData, genres: movieData.genres.join(', ') });
      } catch (err) {
        setError(err.message || "Failed to fetch movie data.");
      } finally {
        setLoading(false);
      }
    };
    getMovie();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMovie(prevMovie => ({ ...prevMovie, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Convert the comma-separated string back to an array
    const movieData = {
      ...movie,
      genres: movie.genres.split(',').map(g => g.trim()).filter(g => g),
    };

    try {
      if (isEditing) {
        // Use the api instance to update the movie
        await api.updateMovie(id, movieData);
      } else {
        // Use the api instance to create the movie
        await api.createMovie(movieData);
      }
      navigate('/'); // Redirect to the movie list page on success
    } catch (err) {
      setError("Failed to save movie. " + (err.response?.data?.message || err.message));
      setSubmitting(false); // Re-enable the button on error
    }
  };

  if (loading) {
    return (
      <Container className="text-center" style={{ marginTop: '50px' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="my-4">{isEditing ? 'Edit Movie' : 'Create New Movie'}</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter movie title"
            name="title"
            value={movie.title}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formYear">
          <Form.Label>Year</Form.Label>
          <Form.Control
            type="number"
            placeholder="e.g., 2023"
            name="year"
            value={movie.year}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formGenres">
          <Form.Label>Genres</Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g., Action, Adventure, Sci-Fi"
            name="genres"
            value={movie.genres}
            onChange={handleChange}
            required
          />
          <Form.Text className="text-muted">
            Please separate genres with a comma.
          </Form.Text>
        </Form.Group>

        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Movie'}
        </Button>
        <Link to="/">
          <Button variant="secondary" className="ms-2">Cancel</Button>
        </Link>
      </Form>
    </Container>
  );
}