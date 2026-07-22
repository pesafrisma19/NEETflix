import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faBookmark } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/src/lib/supabaseClient";
import { useToast } from "@/src/context/ToastContext";

function ComicDetail() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_NEETFLIXAPI_URL}/api/komiku/info?id=${id}`);
        if (!res.ok) throw new Error("Gagal memuat detail komik");
        const data = await res.json();
        setComic(data.results || data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo({ top: 0, behavior: "smooth" });

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        checkWatchlist(session.user.id);
      }
    };
    checkUser();
  }, [id]);

  const checkWatchlist = async (userId) => {
    if (!id) return;
    try {
      const { data } = await supabase
        .from('bookmarks_favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('anime_id', String(id))
        .maybeSingle();

      setIsInWatchlist(!!data);
    } catch (err) {}
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      addToast("Silakan login terlebih dahulu untuk menambahkan ke Watchlist!", "error");
      return;
    }
    if (!comic) return;

    setIsWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from('bookmarks_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('anime_id', String(id));

        if (error) throw error;
        setIsInWatchlist(false);
        addToast("Berhasil dihapus dari Watchlist!", "success");
      } else {
        const { error } = await supabase
          .from('bookmarks_favorites')
          .insert({
            user_id: user.id,
            anime_id: String(id),
            type: 'bookmark'
          });

        if (error) throw error;
        setIsInWatchlist(true);
        addToast("Berhasil ditambahkan ke Watchlist!", "success");
      }
    } catch (err) {
      addToast("Gagal mengupdate Watchlist!", "error");
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  if (loading) return <Loader type="animeInfo" />;
  if (error) return <Error error={error} />;
  if (!comic) return <Error error="404" />;

  return (
    <div className="min-h-screen pt-[64px] bg-[#191826] text-white">
      {/* Bagian Atas: Banner & Info (Mirip AnimeInfo) */}
      <div className="relative w-full overflow-hidden text-white mt-[20px] max-md:mt-[10px]">
        <img
          src={comic.image}
          alt={`${comic.title} Poster`}
          className="absolute inset-0 object-cover w-full h-full filter grayscale blur-lg z-[-900]"
        />
        <div className="flex items-start z-10 px-14 py-[70px] bg-[#252434] bg-opacity-80 gap-x-8 max-[1024px]:px-6 max-[1024px]:py-10 max-[1024px]:gap-x-4 max-[575px]:flex-col max-[575px]:items-center max-[575px]:justify-center">
          <div className="relative w-[180px] h-[270px] max-[575px]:w-[140px] max-[575px]:h-[200px] flex-shrink-0">
            <img
              src={comic.image}
              alt={comic.title}
              className="w-full h-full object-cover object-center flex-shrink-0 rounded shadow-lg"
            />
          </div>

          <div className="flex flex-col ml-4 gap-y-5 max-[575px]:items-center max-[575px]:justify-center max-[575px]:mt-6 max-[1200px]:ml-0">
            <h1 className="text-4xl font-semibold max-[1200px]:text-3xl max-[575px]:text-2xl max-[575px]:text-center max-[575px]:leading-7">
              {comic.title}
            </h1>

            <div className="flex flex-wrap gap-2 mt-2">
              {comic.genres?.map(g => (
                <span key={g} className="px-3 py-1 bg-gray-800 border border-gray-600 text-xs rounded-full">{g}</span>
              ))}
            </div>

            <div className="flex gap-x-4 mt-2 text-sm text-gray-300">
              <p><strong>Author:</strong> {comic.author}</p>
              <p><strong>Status:</strong> {comic.status}</p>
              <p><strong>Type:</strong> {comic.type}</p>
              {comic.rating && <p><strong>Rating:</strong> {comic.rating}</p>}
            </div>

            <div className="text-sm text-gray-300 mt-2 max-w-[800px] leading-relaxed">
              {comic.synopsis}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 items-center">
              {comic.chapters && comic.chapters.length > 0 && (
                <Link
                  to={`/comic/read/${comic.chapters[comic.chapters.length - 1].id}`}
                  state={{ chapters: comic.chapters, comicId: comic.id, title: comic.title, poster: comic.image }}
                  className="flex gap-x-2 px-6 py-2 bg-[#FFBADE] w-fit text-black items-center rounded-3xl hover:opacity-90 transition-opacity shadow-md"
                >
                  <FontAwesomeIcon icon={faPlay} className="text-[14px] mt-[1px]" />
                  <p className="text-lg font-medium">Baca Chapter 1</p>
                </Link>
              )}
              <button
                onClick={handleWatchlistToggle}
                disabled={isWatchlistLoading}
                className="flex gap-x-2 px-6 py-2 bg-white w-fit text-black items-center rounded-3xl font-bold hover:bg-gray-200 transition-colors shadow-md disabled:opacity-50"
              >
                <p className="text-lg">{isInWatchlist ? "✓ In Watchlist" : "+ Add to Watchlist"}</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Daftar Chapter */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-2xl font-bold text-[#ffbade]">Daftar Chapter</h3>
          <input
            type="text"
            placeholder="Cari Chapter (contoh: 398)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-[#2A2A38] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#ffbade] w-full md:w-64"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comic.chapters?.filter(ch => ch.title.toLowerCase().includes(searchQuery.toLowerCase())).map(ch => (
            <Link
              key={ch.id}
              to={`/comic/read/${ch.id}`}
              state={{ chapters: comic.chapters, comicId: comic.id, title: comic.title, poster: comic.image }}
              className="flex justify-between items-center p-4 bg-[#201F31] border border-[#2d2c3e] hover:border-[#ffbade] rounded-lg transition-all"
            >
              <span className="font-semibold">{ch.title}</span>
            </Link>
          ))}
          {comic.chapters?.filter(ch => ch.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="text-gray-400 col-span-full">Chapter tidak ditemukan.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComicDetail;
