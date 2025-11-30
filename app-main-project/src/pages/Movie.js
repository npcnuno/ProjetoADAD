import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Spinner, Alert } from 'react-bootstrap';
import Select from 'react-select';
import api from '../api/api';

// Predefined genre options for the select dropdown
const genreOptions = [
  { value: 'Action', label: 'Action' },
  { value: 'Adventure', label: 'Adventure' },
  { value: 'Comedy', label: 'Comedy' },
  { value: 'Drama', label: 'Drama' },
  { value: 'Fantasy', label: 'Fantasy' },
  { value: 'Horror', label: 'Horror' },
  { value: 'Sci-Fi', label: 'Sci-Fi' },
  { value: 'Thriller', label: 'Thriller' },
];

export default function Movie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(/^-?\d+$/.test(id.trim()));

  const [movie, setMovie] = useState({ title: '', genres: [], year: '' });
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const getMovie = async () => {
      if (!isEditing) return;
      try {
        const response = await api.getMovieById(id);
        const movieData = response.data.data;

        setMovie({ ...movieData, genres: movieData.genres.map(g => ({ value: g, label: g })) });
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

  const handleGenreChange = (selectedOptions) => {
    setMovie(prevMovie => ({ ...prevMovie, genres: selectedOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Map selected genres back to an array of strings for the API
    const movieData = {
      ...movie,
      genres: movie.genres.map(g => g.value),
    };

    try {
      if (isEditing) {
        await api.updateMovie(id, movieData);
      } else {
        await api.createMovie(movieData);
      }
      navigate('/');
    } catch (err) {
      setError("Failed to save movie. " + (err.response?.data?.message || err.message));
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this movie? This action cannot be undone.");
    if (!confirmDelete) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await api.deleteMovie(id);
      navigate('/');
    } catch (err) {
      setError("Failed to delete movie. " + (err.response?.data?.message || err.message));
      setDeleting(false); 
    }
  };

  if (loading) {
    return <Container className="text-center" style={{ marginTop: '50px' }}><Spinner animation="border" /></Container>;
  }

  return (
    <Container>
      <h1 className="my-4">{isEditing ? 'Edit Movie' : 'Create New Movie'}</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" placeholder="Enter movie title" name="title" value={movie.title} onChange={handleChange} required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formYear">
          <Form.Label>Year</Form.Label>
          <Form.Control type="number" placeholder="e.g., 2023" name="year" value={movie.year} onChange={handleChange} required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formGenres">
          <Form.Label>Genres</Form.Label>
          <Select
            isMulti
            name="genres"
            options={genreOptions}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleGenreChange}
            value={movie.genres}
            placeholder="Select or type to add genres..."
            isClearable
          />
        </Form.Group>

        <Button variant="primary" type="submit" disabled={submitting || deleting}>
          {submitting ? 'Saving...' : 'Save Movie'}
        </Button>
        
        {isEditing && (
          <Button variant="danger" onClick={handleDelete} disabled={submitting || deleting} className="ms-2">
            {deleting ? 'Deleting...' : 'Delete Movie'}
          </Button>
        )}

        <Link to="/"><Button variant="secondary" className="ms-2" disabled={submitting || deleting}>Cancel</Button></Link>
      </Form>
    </Container>
  );
}