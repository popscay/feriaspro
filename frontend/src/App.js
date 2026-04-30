import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Layout from './components/Layout';
import EmployeesPage from './pages/EmployeesPage';
import VacationsPage from './pages/VacationsPage';
import './styles/global.css';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/vacations" replace />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="vacations" element={<VacationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
