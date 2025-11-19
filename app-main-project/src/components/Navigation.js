import { Nav, Navbar, NavLink, Image } from "react-bootstrap";
import { Link } from "react-router-dom";
import { userSession, authenticate } from '../auth';

const Navigation = () => {
    return (
            <Navbar collapseOnSelect expand="sm" bg="dark" variant="dark">
                <div className="container">
                    <Navbar.Toggle aria-controls="navbarScroll" data-bs-toggle="collapse" data-bs-target="#navbarScroll" />
                    <Navbar.Collapse id="navbarScroll">
                        <Nav>
                            <NavLink  movieKey="1" as={Link} to="/">Home</NavLink>
                            <NavLink  movieKey="2" as={Link} to="/movies">Movies</NavLink>
                            <NavLink  movieKey="3" as={Link} to="/users">Users</NavLink>
                        </Nav>
                    </Navbar.Collapse>
                    {/* {!userSession.isUserSignedIn() ? 
                        <a className="nav-link" href="#" 
                            onClick={() => authenticate()}>Digital Wallet Login</a> : 
                        <a className="nav-link" href="#" 
                            onClick={ () => {
                                userSession.signUserOut();
                                window.location = '/';
                            }} >Signout
                        </a> 
                    } */}
                </div>  
            </Navbar>
    );
}
 
export default Navigation;