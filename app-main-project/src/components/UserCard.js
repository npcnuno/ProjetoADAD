import React from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';

function UserCard({ _id, name, age, occupation, moviesCount, onDelete }) {
  return (
    <Card className="h-100 shadow-sm user-card">
      <Card.Body className="d-flex flex-column">
        <div className="mb-3">
          <Card.Title className="h6 fw-bold text-truncate" title={name}>
            {name}
          </Card.Title>
          <Card.Subtitle className="mb-2 text-muted small">ID: {_id}</Card.Subtitle>
          <Card.Text className="text-muted small">Age: {age || 'N/A'}</Card.Text>
        </div>
        
        <div className="mb-3 flex-grow-1">
          {occupation && occupation.map(occ => (
            <Badge 
              key={occ} 
              bg="outline-info" 
              text="info"
              className="me-1 mb-1 border"
              style={{ fontSize: '0.7rem' }}
            >
              {occ}
            </Badge>
          ))}
        </div>

        <div className="mt-auto">
          <Card.Text className="text-success fw-bold small">
            Movies Rated: {moviesCount}
          </Card.Text>
          <Button 
            href={`/user/${_id}`} 
            variant="outline-primary" 
            size="sm" 
            className="w-100 mt-2 d-flex align-items-center justify-content-center"
          >
            <i className="bi bi-person me-2"></i>
            View Details
          </Button>
          <div className="d-flex gap-2 mt-2">
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

export default UserCard;

