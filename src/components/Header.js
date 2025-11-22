import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>치지직컵 드래프트</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">시뮬레이션</Link>
          <Link to="/tier" className="nav-link">티어 설정</Link>
          <Link to="/mock" className="nav-link">모의 드래프트</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
