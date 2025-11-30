import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Spinner, Alert, Table } from 'react-bootstrap';
import Select from 'react-select';
import api from '../api/api';

// Predefined occupation options for the select dropdown
const occupationOptions = [
  { value: 'Academic', label: 'Academic' },
  { value: 'Artist', label: 'Artist' },
  { value: 'Clerical', label: 'Clerical' },
  { value: 'College', label: 'College' },
  { value: 'Customer Service', label: 'Customer Service' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Engineer', label: 'Engineer' },
  { value: 'Executive', label: 'Executive' },
  { value: 'Farmer', label: 'Farmer' },
  { value: 'Homemaler', label: 'Homemaler' },
  { value: 'K-12 Student', label: 'K-12 Student' },
  { value: 'Lawyer', label: 'Lawyer' },
  { value: 'Programmer', label: 'Programmer' },
  { value: 'Retired', label: 'Retired' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Scientist', label: 'Scientist' },
  { value: 'Self-employed', label: 'Self-employed' },
  { value: 'Technician', label: 'Technician' },
  { value: 'Tradesman', label: 'Tradesman' },
  { value: 'Unemployed', label: 'Unemployed' },
  { value: 'Writer', label: 'Writer' },
  { value: 'Other', label: 'Other' },
];

const genderOption = [
  { value: 'F', label: 'F' },
  { value: 'M', label: 'M' },
  { value: 'Other', label: 'Other' },
];


const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000); 
    return date.toLocaleString();
};

export default function User() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(/^-?\d+$/.test(id.trim()));

  const [user, setUser] = useState({ name: '', gender: '', occupation: '', age: '', movies: '' });
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(isEditing);
  const [reviewsError, setReviewsError] = useState(null);

//Function to fetch movie reviews
const fetchReviews = useCallback(async () => {
    if (!isEditing || !id) {
      setReviewsLoading(false);
      return;
    }
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const response = await api.getUserById(id); 
      const userData = response.data.data;
      setReviews(userData.movies || []); 
    } catch (err) {
      setReviewsError("Failed to fetch user reviews. " + (err.message || ""));
      setReviews([]); 
    } finally {
      setReviewsLoading(false);
    }
  }, [isEditing, id]);

//Effect for fetching user data
useEffect(() => {
   const getUser = async () => {
     if (!isEditing) return;
     try {
       const response = await api.getUserById(id);
       const userData = response.data.data;
       // Map occupation to the format react-select expects
       setUser({ ...userData, 
         gender: genderOption.find(opt => opt.value === userData.gender) || null,
         age: String(userData.age || ''),
         occupation: userData.occupation.map(g => ({ value: g, label: g })) });
     } catch (err) {
       setError(err.message || "Failed to fetch user data.");
     } finally {
       setLoading(false);
     }
   };
   getUser();
 }, [id, isEditing]);

// Effect for fetching user reviews
useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

 const handleChange = (e) => {
   const { name, value } = e.target;
   setUser(prevUser => ({ ...prevUser, [name]: value }));
 };

  const handleOccupationChange = (selectedOptions) => {
    setUser(prevUser => ({ ...prevUser, occupation: selectedOptions }));
  };

  const handleGenderChange = (selectedOption) => {
    setUser(prevUser => ({ ...prevUser, gender: selectedOption }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Map selected occupation back to an array of strings for the API
    const userData = {
      ...user,
      age: Number(user.age),
      gender: user.gender?.value || null,
      occupation: user.occupation.map(g => g.value),
    };
    try {
      if (isEditing) {
        await api.updateUser(id, userData);
      } else {
        await api.createUser(userData);
      }
      navigate('/users');
    } catch (err) {
      setError("Failed to save user. " + (err.response?.data?.message || err.message));
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Container className="text-center" style={{ marginTop: '50px' }}><Spinner animation="border" /></Container>;
  }
  return (
    <Container>
      <h1 className="my-4">{isEditing ? 'Edit User' : 'Create New User'}</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formName">
          <Form.Label>Name</Form.Label>
          <Form.Control type="text" placeholder="Enter user name" name="name" value={user.name} onChange={handleChange} required />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formGender">
          <Form.Label>Gender</Form.Label>
            <Select
            name="gender"
            options={genderOption}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleGenderChange}
            value={user.gender}
            placeholder="Select to add gender..."
            isClearable
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formAge">
          <Form.Label>Age</Form.Label>
          <Form.Control type="number" placeholder="Enter user age" name="age" value={user.age} onChange={handleChange} required />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formOccupations">
          <Form.Label>Occupation</Form.Label>
          <Select
            isMulti
            name="occupation"
            options={occupationOptions}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleOccupationChange}
            value={user.occupation}
            placeholder="Select or type to add occupation..."
            isClearable
          />
        </Form.Group>
        
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save User'}
        </Button>
        <Link to="/"><Button variant="secondary" className="ms-2">Cancel</Button></Link>
      </Form>

      <hr className="my-5" />
          <h2 className="mb-4">Rated Movies</h2>
          {reviewsLoading && <div className="text-center"><Spinner animation="border" size="sm" /> Loading reviews...</div>}
          {reviewsError && <Alert variant="warning">{reviewsError}</Alert>}
          {!reviewsLoading && !reviewsError && (
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Movie ID</th>
                    <th>Rating</th>
                    <th>Date Rated</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <tr key={index}>
                        <td>{review.movieid}</td>
                        <td>{review.rating}</td>
                        <td>{formatTimestamp(review.timestamp)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">No movies rated by this user yet.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
    </Container>
  );
}
