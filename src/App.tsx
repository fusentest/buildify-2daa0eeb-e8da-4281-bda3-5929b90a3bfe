
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/theme-provider';
import WeatherPage from './pages/WeatherPage';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="weather-app-theme">
        <Router>
          <Routes>
            <Route path="/" element={<WeatherPage />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;