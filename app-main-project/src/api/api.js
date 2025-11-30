import axios from 'axios';

// Base URL for the Movie DB API from your Postman collection
const API_URL = 'http://localhost:3000/api/v1/'; 

const api = {
  // Health Check
  checkHealth: () => 
    axios.get(`${API_URL}health`),

  // Movie Management
  getMovies: (page = 1, limit = 10, sort = "reviewsCount", order = "desc") => 
    axios.get(`${API_URL}movies`, { 
      params: { page, limit,order,sort }
    }),
  getMovieById: (id) => 
    axios.get(`${API_URL}movies/${id}`),
  createMovie: (data) => 
    axios.post(`${API_URL}movies`, data),
  createMovies: (dataArray) => 
    axios.post(`${API_URL}movies`, dataArray),
  updateMovie: (id, data) => 
    axios.put(`${API_URL}movies/${id}`, data),
  deleteMovie: (id) => 
    axios.delete(`${API_URL}movies/${id}`),

  // Movie Discovery
  getTopMovies: (limit = 10) => 
    axios.get(`${API_URL}movies/top/${limit}`),
  getMoviesByRatingsDesc: (page = 1, limit = 10) => 
    axios.get(`${API_URL}movies/ratings/desc`, { 
      params: { page, limit }
    }),
  getMoviesByRatingsAsc: (page = 1, limit = 10) => 
    axios.get(`${API_URL}movies/ratings/asc`, { 
      params: { page, limit }
    }),
  getStarMovies: () => 
    axios.get(`${API_URL}movies/star`),
  getMoviesByYear: (year, page = 1, limit = 10) => 
    axios.get(`${API_URL}movies/year/${year}`, { 
      params: { page, limit }
    }),
  getMoviesByGenre: (genre, page = 1, limit = 10) => 
    axios.get(`${API_URL}movies/genre/${genre}`, { 
      params: { page, limit }
    }),
  searchMovies: (query, page = 1, limit = 10) => 
    axios.get(`${API_URL}movies/search/${query}`, { 
      params: { page, limit }
    }),
  getStatsSummary: () => 
    axios.get(`${API_URL}movies/stats/summary`),

  // User Management
  getUsers: (page = 1, limit = 10) => 
    axios.get(`${API_URL}users`, { 
      params: { page, limit }
    }),
  getUserById: (id) => 
    axios.get(`${API_URL}users/${id}`),
  createUser: (data) => 
    axios.post(`${API_URL}users`, data),
  createUsers: (dataArray) => 
    axios.post(`${API_URL}users`, dataArray),
  updateUser: (id, data) => 
    axios.put(`${API_URL}users/${id}`, data),
  deleteUser: (id) => 
    axios.delete(`${API_URL}users/${id}`),
  
  // User Reviews
  getUserReviews: (userId, page = 1, limit = 10) => 
    axios.get(`${API_URL}movies/user/${userId}/reviews`, { 
      params: { page, limit }
    }),
  addReview: (userId, movieId, data) => 
    axios.post(`${API_URL}users/${userId}/review/${movieId}`, data),
};

export default api;