import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import Home from './pages/Home';
import Browse from './pages/Browse';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ItemDetails from './pages/ItemDetails';
import ListEquipment from './pages/ListEquipment';
import EditEquipment from './pages/EditEquipment';
import Profile from './pages/Profile';
import BorrowManagement from './pages/BorrowManagement';
import Notifications from './pages/Notifications';
import Reviews from './pages/Reviews';
import Disputes from './pages/Disputes';
import Admin from './pages/Admin';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <BrowserRouter>

            <Navbar />

            <Routes>

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/home"
                    element={<Home />}
                />

                <Route
                    path="/browse"
                    element={<Browse />}
                />

                <Route
                    path="/items/:id"
                    element={<ItemDetails />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/list-equipment"
                    element={
                        <ProtectedRoute>
                            <ListEquipment />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/items/:id/edit"
                    element={
                        <ProtectedRoute>
                            <EditEquipment />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/borrow-management"
                    element={
                        <ProtectedRoute>
                            <BorrowManagement />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/reviews"
                    element={
                        <ProtectedRoute>
                            <Reviews />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/disputes"
                    element={
                        <ProtectedRoute>
                            <Disputes />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <Admin />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/home"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;