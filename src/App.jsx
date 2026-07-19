import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { Routes, Route } from "react-router-dom";
import { HomeInfoProvider } from "./context/HomeInfoContext";
import Home from "./pages/Home/Home";
import AnimeInfo from "./pages/animeInfo/AnimeInfo";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Error from "./components/error/Error";
import Category from "./pages/category/Category";
import AtoZ from "./pages/a2z/AtoZ";
import { azRoute, categoryRoutes } from "./utils/category.utils";
import "./App.css";
import Search from "./pages/search/Search";
import Watch from "./pages/watch/Watch";

// Comic Imports
import ComicHome from "./pages/comic/ComicHome";
import ComicDetail from "./pages/comic/ComicDetail";
import ComicReader from "./pages/comic/ComicReader";
import ComicSearch from "./pages/comic/ComicSearch";
import ComicCategory from "./pages/comic/ComicCategory";
import ComicGenre from "./pages/comic/ComicGenre";
import FilmHome from "./pages/film/FilmHome";
import FilmDetail from "./pages/film/FilmDetail";
import WatchFilm from "./pages/film/WatchFilm";
import Producer from "./components/producer/Producer";
import SplashScreen from "./components/splashscreen/SplashScreen";
import Profile from "./pages/profile/Profile";
import PublicProfile from "./pages/publicProfile/PublicProfile";
import LiveChatWidget from "./components/chat/LiveChatWidget";
import { ToastProvider } from "./context/ToastContext";

function App() {
  const location = useLocation();

  // Scroll to top on location change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Bersihkan hash token dari URL setelah Google Login sukses
  useEffect(() => {
    // Tunggu sampai Supabase selesai memproses token dari URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && window.location.hash.includes('access_token')) {
        // Hapus hash yang jelek tanpa me-reload halaman
        window.history.replaceState(null, "", window.location.pathname);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Check if the current route is for the splash screen
  const isSplashScreen = location.pathname === "/";

  return (
    <HomeInfoProvider>
      <ToastProvider>
        <div className="app-container">
          <main className="content">
          {!isSplashScreen && <Navbar />}
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:username" element={<PublicProfile />} />
            <Route path="/:id" element={<AnimeInfo />} />
            <Route path="/watch/:id" element={<Watch />} />
            
            {/* Comic Routes */}
            <Route path="/comic" element={<ComicHome />} />
            <Route path="/comic/:id" element={<ComicDetail />} />
            <Route path="/comic/read/:chapterId" element={<ComicReader />} />
            <Route path="/comic/search" element={<ComicSearch />} />
            <Route path="/comic/category/:type" element={<ComicCategory />} />
            <Route path="/comic/genre/:genre" element={<ComicGenre />} />
            
            {/* Film (LK21) Routes */}
            <Route path="/film" element={<FilmHome />} />
            <Route path="/film/:id" element={<FilmDetail />} />
            <Route path="/film/watch/:id" element={<WatchFilm />} />

            <Route path="/random" element={<AnimeInfo random={true} />} />
            <Route path="/404-not-found-page" element={<Error error="404" />} />
            <Route path="/error-page" element={<Error />} />
            {/* Render category routes */}
            {categoryRoutes.map((path) => (
              <Route
                key={path}
                path={`/${path}`}
                element={
                  <Category path={path} label={path.split("-").join(" ")} />
                }
              />
            ))}
            {/* Render A to Z routes */}
            {azRoute.map((path) => (
              <Route
                key={path}
                path={`/${path}`}
                element={<AtoZ path={path} />}
              />
            ))}
            <Route path="/producer/:id" element={<Producer />} />
            <Route path="/search" element={<Search />} />
            {/* Catch-all route for 404 */}
            <Route path="*" element={<Error error="404" />} />
          </Routes>
          {!isSplashScreen && <LiveChatWidget />}
          {!isSplashScreen && <Footer />}
        </main>
      </div>
      </ToastProvider>
    </HomeInfoProvider>
  );
}

export default App;
