import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ConsolidatedReports from './pages/ConsolidatedReports';
import Tenants from './pages/admin/Tenants';
import Users from './pages/admin/Users';

// Páginas placeholder para completar el router
const Placeholder = ({ title }: { title: string }) => (
    <div className="text-white text-center py-20">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-slate-500">Funcionalidad en desarrollo...</p>
    </div>
);

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tenants" element={<Tenants />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/infractions" element={<Placeholder title="Gestión de Infracciones" />} />
                    <Route path="/fines" element={<Placeholder title="Historial de Multas" />} />
                    <Route path="/consolidated" element={<ConsolidatedReports />} />
                    <Route path="/vehicles" element={<Placeholder title="Flota de Vehículos" />} />
                    <Route path="/rules" element={<Placeholder title="Reglas y Configuración" />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
