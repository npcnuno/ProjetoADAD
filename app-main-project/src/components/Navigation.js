import { Nav, Navbar, Container } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Navbar expand="lg" bg="dark" variant="dark" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <i className="bi bi-film me-2"></i>
          MovieWeb
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              active={isActive('/')}
              className="fw-semibold"
            >
              Home
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/movies" 
              active={isActive('/movies')}
              className="fw-semibold"
            >
              Movies
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/users" 
              active={isActive('/users')}
              className="fw-semibold"
            >
              Users
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
 
export default Navigation;
