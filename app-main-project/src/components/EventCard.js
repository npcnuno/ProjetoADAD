import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

function EventCard(props) {
  return (
    <Card style={{ width: '18rem' }} className="mb-3">
      <Card.Body>
        <Card.Title>{props.title}</Card.Title>
        <Card.Text>
          id: {props.id}
        </Card.Text>
        <Button href={"/event/" + props.id} variant="outline-primary">Open Event</Button>
      </Card.Body>
    </Card>
  );
}

export default EventCard;