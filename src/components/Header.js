import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>치지직컵 드래프트</h1>
        </Link>
      </div>
    </header>
  );
}

export default Header;
