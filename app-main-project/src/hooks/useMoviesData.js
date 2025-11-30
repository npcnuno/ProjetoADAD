// hooks/useMoviesData.js
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/api";

const GENRE_OPTIONS = ["All", "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Sci-Fi", "Thriller"];
const RATING_OPTIONS = ["Default", "Highest First", "Lowest First"];

export const useMoviesData = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const getSearch = () => searchParams.get('search') || '';
  const getGenre = () => searchParams.get('genre') || 'All';
  const getYear = () => searchParams.get('year') || '';
  const getRatingSort = () => searchParams.get('ratingSort') || 'Default';
  const getPage = () => Number(searchParams.get('page')) || 1;
  const getLimit = () => Number(searchParams.get('limit')) || 10;

  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalMovies, setTotalMovies] = useState(0);
  const [searchInputValue, setSearchInputValue] = useState(getSearch());
  const [mode, setMode] = useState('server');
  const [searchError, setSearchError] = useState('');
  const searchTimeoutRef = useRef(null);

  const filterKey = `${getSearch()}_${getGenre()}_${getYear()}_${getRatingSort()}`;

  const triggerSearch = () => {
    const trimmedSearch = searchInputValue.trim();
    
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
    newParams.delete('page');
    setSearchParams(newParams);
  };

  useEffect(() => {
    const count = () => {
      let c = 0;
      if (getSearch()) c++;
      if (getGenre() !== 'All') c++;
      if (getYear()) c++;
      if (getRatingSort() !== 'Default') c++;
      return c;
    };
    
    const isClient = count() > 1;
    setMode(isClient ? 'client' : 'server');
  }, [filterKey]);

  useEffect(() => {
    if (mode === 'client') {
      (async () => {
        setLoading(true);
        try {
          let finalResults = [];
          const fetchPromises = [];
          const search = getSearch();
          const genre = getGenre();
          const year = getYear();
          const ratingSort = getRatingSort();

          const fetchAllPages = async (apiCall, args) => {
            let allResults = [];
            let currentPage = 1;
            const batchLimit = 100;
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

          // Convert rating sort to API parameter
          let sortParam = null;
          if (ratingSort === 'Highest First') {
            sortParam = 'rating_desc';
          } else if (ratingSort === 'Lowest First') {
            sortParam = 'rating_asc';
          }

          // Always start with getAllMovies with the appropriate sort parameter
          fetchPromises.push(fetchAllPages(api.getMovies, [sortParam]));
          
          // Add other filter API calls
          if (search) {
            fetchPromises.push(fetchAllPages(api.searchMovies, [search]));
          }
          if (genre !== 'All') {
            fetchPromises.push(fetchAllPages(api.getMoviesByGenre, [genre]));
          }
          if (year) {
            fetchPromises.push(fetchAllPages(api.getMoviesByYear, [year]));
          }

          const results = await Promise.all(fetchPromises);

          if (results.length > 0) {
            // Start with the first set of results (which is the sorted or unsorted movies)
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
  }, [mode, filterKey]);

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
          const ratingSort = getRatingSort();
          let response;
          
          // Convert rating sort to API parameter
          let sortParam = null;
          if (ratingSort === 'Highest First') {
            sortParam = 'rating_desc';
          } else if (ratingSort === 'Lowest First') {
            sortParam = 'rating_asc';
          }
          
          // If rating sort is active, use getAllMovies with the sort parameter
          if (ratingSort !== 'Default') {
            response = await api.getMovies(page, limit, sortParam);
          } else if (search) {
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

  useEffect(() => {
    if (mode === 'client' && filteredMovies) {
      const page = getPage();
      const limit = getLimit();
      const start = (page - 1) * limit;
      setMovies(filteredMovies.slice(start, start + limit));
    }
  }, [searchParams, mode, filteredMovies]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      triggerSearch();
    }, 200);
    
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

  const handleRatingSortChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    const ratingSort = e.target.value;
    if (ratingSort === 'Default') {
      newParams.delete('ratingSort');
    } else {
      newParams.set('ratingSort', ratingSort);
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

  return {
    // State
    movies,
    loading,
    error,
    searchInputValue,
    searchError,
    hasActiveFilters,
    totalPages,
    
    // Getters
    getSearch,
    getGenre,
    getYear,
    getRatingSort,
    getPage,
    getLimit,
    
    // Actions
    setSearchInputValue,
    handleDeleteMovie,
    handlePageChange,
    handleGenreChange,
    handleYearChange,
    handleRatingSortChange,
    handleItemsPerPageChange,
    clearFilters,
    triggerSearch,
    
    // Constants
    GENRE_OPTIONS,
    RATING_OPTIONS
  };
};