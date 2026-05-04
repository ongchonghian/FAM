import { BrowserRouter, Routes, Route, NavLink, useSearchParams } from 'react-router-dom'
import InAction from './pages/InAction'
import ArchitectureDeepDive from './pages/ArchitectureDeepDive'
import FifthCorner from './pages/FifthCorner'
import DataDictionary from './pages/DataDictionary'
import Wiki from './pages/Wiki'

function Nav() {
  const [params] = useSearchParams()
  if (params.get('embed') === '1') return null
  return (
    <nav className="nav">
      <a className="nav-brand" href="/">FAM</a>
      <NavLink className="nav-link" to="/in-action">In Action</NavLink>
      <NavLink className="nav-link" to="/architecture">Architecture</NavLink>
      <NavLink className="nav-link" to="/5th-corner">5th Corner</NavLink>
      <NavLink className="nav-link" to="/data-dictionary">Data Dictionary</NavLink>
      <NavLink className="nav-link" to="/wiki">Wiki</NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Wiki />} />
        <Route path="/in-action" element={<InAction />} />
        <Route path="/architecture" element={<ArchitectureDeepDive />} />
        <Route path="/5th-corner" element={<FifthCorner />} />
        <Route path="/data-dictionary" element={<DataDictionary />} />
        <Route path="/wiki" element={<Wiki />} />
      </Routes>
    </BrowserRouter>
  )
}
