import React from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';

function MovieCard({ _id, title, year, genres, onDelete }) {
  return (
    <Card className="h-100 shadow-sm movie-card">
      <Card.Body className="d-flex flex-column">
        <div className="mb-3">
          <Card.Title className="h6 fw-bold text-truncate" title={title}>
            {title}
          </Card.Title>
          <Card.Subtitle className="mb-2 text-muted small">{year}</Card.Subtitle>
        </div>
        
        <div className="mb-3 flex-grow-1">
          {genres.map(genre => (
            <Badge 
              key={genre} 
              bg="outline-primary" 
              text="primary"
              className="me-1 mb-1 border"
              style={{ fontSize: '0.7rem' }}
            >
              {genre}
            </Badge>
          ))}
        </div>

        <div className="mt-auto">
          <Button 
            href={`/movie/${_id}`} 
            variant="outline-primary" 
            size="sm" 
            className="w-100 mb-2 d-flex align-items-center justify-content-center"
          >
            <i className="bi bi-eye me-2"></i>
            View Details
          </Button>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-danger" 
              size="sm" 
              className="flex-fill d-flex align-items-center justify-content-center"
              onClick={() => onDelete(_id)}
            >
              <i className="bi bi-trash me-1"></i>
              Delete
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default MovieCard;