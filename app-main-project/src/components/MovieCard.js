// src/components/MovieCard.js

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';

function MovieCard(props) {
  const { _id, title, year, genres } = props;

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{year}</Card.Subtitle>
        <div className="mb-2">
          {genres.map(genre => (
            <Badge key={genre} bg="secondary" className="me-1">{genre}</Badge>
          ))}
        </div>
      </Card.Body>
      <Card.Footer className="bg-white border-top-0">
        <Button href={`/movies/${_id}`} variant="outline-primary" size="sm" className="w-100 mb-2">
          View Details
        </Button>
        <div className="d-grid gap-2 d-md-flex">
          <Button href={`/movies/edit/${_id}`} variant="outline-secondary" size="sm" className="flex-fill">
            Edit
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="flex-fill"
            onClick={() => props.onDelete(_id)}
          >
            Delete
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
}

export default MovieCard;