import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Spinner, Alert, Form, Button, Card } from 'react-bootstrap';
import UserCard from '../components/UserCard';
import CustomPagination from "../components/Pagination";
import api from '../api/api';

// Define static options for the filter bar
const OCCUPATION_OPTIONS = [
  'All', 'academic', 'artist', 'clerical', 'college', 
  'customer service', 'doctor', 'engineer', 'executive', 
  'farmer', 'homemaker', 'k-12 student', 'lawyer', 
  'programmer', 'retired', 'sales', 'scientist', 
  'self-employed', 'technician', 'tradesman', 'unemployed', 
  'writer', 'other'
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Filter bar states
  const [currentOccupation, setCurrentOccupation] = useState('All');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

  // Helper to check if any filters are active
  const hasActiveFilters = currentOccupation !== 'All' || currentSearchQuery;

  // Function to fetch users with pagination and filter parameters
  const getUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Pass all filtering/pagination parameters to the API utility
      const response = await api.getUsers(
        currentPage, 
        itemsPerPage, 
        currentOccupation,
        currentSearchQuery
      );
      
      // CRITICAL FIX: Extract data based on the provided JSON structure
      const apiPayload = response.data; 
      
      // 1. Extract the array of users (list is under 'data')
      const usersData = apiPayload?.data || [];
      // 2. Extract pagination details from the 'pagination' object
      const pagination = apiPayload?.pagination || {};
      
      const serverTotalPages = pagination.totalPages || 1;
      const serverTotalUsers = pagination.total || 0; // Use 'total' property for count
      
      setUsers(usersData);
      setTotalPages(serverTotalPages);
      setTotalUsers(serverTotalUsers);

    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users. Check API endpoint and structure.';
      setError(errorMessage);
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, currentOccupation, currentSearchQuery]); 

  // Handler for deleting a user (kept intact)
  const handleDeleteUser = useCallback(async (userId) => {
    if (!window.confirm(`Are you sure you want to delete this user?`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.deleteUser(userId);
      // Re-fetch the current page to update the list
      getUsers(); 
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user.');
      setLoading(false);
    }
  }, [getUsers]);

  // Handler for search trigger (on enter or manual trigger)
  const triggerSearch = () => {
    if (searchInputValue && searchInputValue.length < 2) {
      setSearchError('Search query must be at least 2 characters.');
      return;
    }
    // Update the official search query state, triggering useEffect/getUsers
    setCurrentSearchQuery(searchInputValue);
    setCurrentPage(1); 
  };
  
  const handleOccupationChange = (event) => {
    setCurrentOccupation(event.target.value);
    setCurrentPage(1); // Reset to page 1 for new filter
  };
  
  const clearFilters = () => {
    setCurrentOccupation('All');
    setSearchInputValue('');
    setCurrentSearchQuery('');
    setCurrentPage(1);
    setSearchError('');
  };

  // Handlers for pagination controls
  const handlePageChange = (page) => {
    setCurrentPage(page); 
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to the first page when limit changes
  };

  // Fetch users whenever a relevant state changes
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  return (
    <Container className="py-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="display-6 fw-bold text-primary">Users Collection</h1>
          <p className="text-muted">Browse all users and their activity</p>
        </Col>
      </Row>

      {/* Filters Section (Filter Bar) */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            {/* Search Input */}
            <Col md={4}>
              <Form.Label className="fw-semibold">Search by Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Type at least 2 characters to search..."
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
                  if (searchError) setSearchError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerSearch();
                  }
                }}
                onBlur={triggerSearch}
                className={searchError ? "border-danger" : "border-primary"}
                isInvalid={!!searchError}
              />
              {searchError && (
                <Form.Control.Feedback type="invalid" className="d-block">
                  {searchError}
                </Form.Control.Feedback>
              )}
            </Col>
            
            {/* Occupation Filter */}
            <Col md={4}>
              <Form.Label className="fw-semibold">Filter by Occupation</Form.Label>
              <Form.Select 
                value={currentOccupation} 
                onChange={handleOccupationChange} 
                className="border-primary"
              >
                {OCCUPATION_OPTIONS.map(occupation => (
                  <option key={occupation} value={occupation}>{occupation}</option>
                ))}
              </Form.Select>
            </Col>

            {/* Clear Filters Button */}
            <Col md={4} className="text-md-end">
              {hasActiveFilters && (
                <Button variant="outline-secondary" onClick={clearFilters}>
                  <i className="bi bi-x-circle me-2"></i>
                  Clear Filters
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results Header */}
      <Row className="mb-3 align-items-center">
        <Col>
          {!loading && (
            <div className="d-flex align-items-center">
              <span className="text-muted me-3">
                Showing {users.length} of {totalUsers} users
              </span>
              {currentSearchQuery && (
                <span className="text-primary me-2 fw-semibold">
                  (Searched: "{currentSearchQuery}")
                </span>
              )}
              {currentOccupation !== 'All' && (
                <span className="text-info fw-semibold">
                  (Occupation: {currentOccupation})
                </span>
              )}
            </div>
          )}
        </Col>
        <Col xs="auto">
          {/* Items Per Page Selector */}
          <Form.Select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            style={{ width: 'auto' }}
            className="border-primary"
          >
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>{option} per page</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading users...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Users Grid */}
      {!loading && !error && (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {users.length > 0 ? (
              users.map((user) => (
                <Col key={user._id}>
                  <UserCard
                    _id={user._id}
                    name={user.name}
                    age={user.age}
                    occupation={user.occupation}
                    moviesCount={user.movies ? user.movies.length : 0}
                    onDelete={handleDeleteUser} 
                  />
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center py-5">
                <div className="d-flex flex-column align-items-center justify-content-center">
                  <i className="bi bi-person-x-fill display-1 text-muted"></i>
                  <h4 className="mt-3 text-muted">No users found</h4>
                  <p className="text-muted">Try adjusting your filters (search by name, occupation) or navigating between pages.</p>
                  {hasActiveFilters && (
                    <Button variant="outline-primary" onClick={clearFilters} className="mt-3">
                      Clear Filters
                    </Button>
                  )}
                </div>
              </Col>
            )}
          </Row>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 d-flex justify-content-center">
              <CustomPagination
                currentPage={currentPage}
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
