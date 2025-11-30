// hooks/useMoviesData.js
import { useState, useEffect, useRef, useCallback } from "react";
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
  const [filteredMovies, setFilteredMovies] = useState(null); // Used for client-side pagination
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalMovies, setTotalMovies] = useState(0);
  const [searchInputValue, setSearchInputValue] = useState(getSearch());
  const [mode, setMode] = useState('server');
  const [searchError, setSearchError] = useState('');
  const searchTimeoutRef = useRef(null);

  // This key is a stable string representation of the filters.
  const filterKey = `${getSearch()}_${getGenre()}_${getYear()}_${getRatingSort()}`;

  const triggerSearch = useCallback(() => {
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
  }, [searchInputValue, searchParams, setSearchParams]);

  // *** THE KEY FIX IS HERE ***
  // This effect determines the mode (client or server).
  // It only needs to re-run when the filterKey changes.
  useEffect(() => {
    const count = () => {
      let c = 0;
      // We only count primary filters, NOT the sort filter.
      // Sorting should be handled by the server and not trigger client-side mode.
      if (getSearch()) c++;
      if (getGenre() !== 'All') c++;
      if (getYear()) c++;
      return c;
    };
    
    // Use client-side mode only if there is more than one primary filter.
    const isClient = count() > 1;
    setMode(isClient ? 'client' : 'server');
  }, [filterKey]); // Only depends on the derived filterKey

  // Client-side data fetching effect
  useEffect(() => {
    if (mode === 'client') {
      (async () => {
        setLoading(true);
        try {
          const search = getSearch();
          const genre = getGenre();
          const year = getYear();
          const ratingSort = getRatingSort();
          
          const sortBy = "reviewsCount"; 
          let sortOrder = null;
          if (ratingSort === 'Highest First') sortOrder = 'desc';
          else if (ratingSort === 'Lowest First') sortOrder = 'asc';

          const fetchAllPages = async (apiCall, ...initialArgs) => {
            let allResults = [];
            let currentPage = 1;
            const batchLimit = 100;
            let response;
            do {
              const callArgs = [...initialArgs, currentPage, batchLimit, sortBy, sortOrder];
              response = await apiCall(...callArgs);
              allResults = [...allResults, ...response.data.data];
              currentPage++;
            } while (response.data.pagination && allResults.length < response.data.pagination.total);
            return allResults;
          };

          const fetchPromises = [];
          if (search) fetchPromises.push(fetchAllPages(api.searchMovies, search));
          if (genre !== 'All') fetchPromises.push(fetchAllPages(api.getMoviesByGenre, genre));
          if (year) fetchPromises.push(fetchAllPages(api.getMoviesByYear, year));
          fetchPromises.push(fetchAllPages(api.getMovies));

          const results = await Promise.all(fetchPromises);

          let finalResults = results[0] || [];
          for (let i = 1; i < results.length; i++) {
            const currentResultIds = new Set(results[i].map(movie => movie._id));
            finalResults = finalResults.filter(movie => currentResultIds.has(movie._id));
          }
          
          const uniqueMoviesMap = new Map(finalResults.map(movie => [movie._id, movie]));
          finalResults = Array.from(uniqueMoviesMap.values());
          
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

  // Server-side data fetching effect
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
          
          const sortBy = "reviewsCount";
          let sortOrder = null;
          if (ratingSort === 'Highest First') sortOrder = 'desc';
          else if (ratingSort === 'Lowest First') sortOrder = 'asc';
          
          let response;
          
          if (search) {
            response = await api.searchMovies(search, page, limit, sortBy, sortOrder);
          } else if (genre !== 'All') {
            response = await api.getMoviesByGenre(genre, page, limit, sortBy, sortOrder);
          } else if (year) {
            response = await api.getMoviesByYear(year, page, limit, sortBy, sortOrder);
          } else {
            response = await api.getMovies(page, limit, sortBy, sortOrder);
          }
          
          const uniqueMoviesMap = new Map(response.data.data.map(movie => [movie._id, movie]));
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

  // Client-side pagination effect
  useEffect(() => {
    if (mode === 'client' && filteredMovies) {
      const page = getPage();
      const limit = getLimit();
      const start = (page - 1) * limit;
      setMovies(filteredMovies.slice(start, start + limit));
    }
  }, [searchParams, mode, filteredMovies]);

  // Search timeout effect
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
  }, [searchInputValue, triggerSearch]);

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
    movies,
    loading,
    error,
    searchInputValue,
    searchError,
    hasActiveFilters,
    totalPages,
    totalMovies,
    getSearch,
    getGenre,
    getYear,
    getRatingSort,
    getPage,
    getLimit,
    setSearchInputValue,
    setSearchError,
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
  };
};