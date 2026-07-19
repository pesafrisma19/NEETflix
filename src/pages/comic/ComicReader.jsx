import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';

function ComicReader() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ambil state dari router (dikirim dari ComicDetail)
  const chaptersList = location.state?.chapters || [];
  const comicId = location.state?.comicId || null;

  // Cari index chapter saat ini
  // Catatan: di Komiku, array chapter biasanya descending (terbaru di index 0)
  const currentIndex = chaptersList.findIndex(ch => ch.id === chapterId);
  let nextChapter = null;
  let prevChapter = null;

  if (currentIndex !== -1) {
    // Karena index 0 = terbaru (chapter terbesar), maka "Next" adalah index - 1
    // dan "Prev" adalah index + 1
    if (currentIndex > 0) {
      nextChapter = chaptersList[currentIndex - 1].id;
    }
    if (currentIndex < chaptersList.length - 1) {
      prevChapter = chaptersList[currentIndex + 1].id;
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchChapter = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_NEETFLIXAPI_URL}/api/komiku/chapter?id=${chapterId}`);
        if (!res.ok) throw new Error("Gagal memuat panel komik");
        const data = await res.json();
        
        const resData = data.results || data.data || data;
        setImages(resData.images || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
  }, [chapterId]);

  if (error) return <Error error={error} />;

  return (
    <div className="min-h-screen bg-[#141414] pb-20">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 w-full bg-[#201F31] p-4 flex justify-between items-center z-50 shadow-md">
        <button 
          onClick={() => {
            if (comicId) navigate(`/comic/${comicId}`);
            else navigate(-1);
          }} 
          className="text-white hover:text-[#ffbade]"
        >
          &larr; Kembali
        </button>
        <span className="text-[#ffbade] font-bold line-clamp-1 max-w-[50%] text-center">
          {chaptersList[currentIndex]?.title || `Chapter ${chapterId.replace('chapter-', '')}`}
        </span>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Area Baca (Scrollable) */}
      <div className="pt-[70px] max-w-[800px] mx-auto flex flex-col items-center">
        {loading ? (
          <div className="py-[30vh]">
            <Loader type="default" />
          </div>
        ) : images.length > 0 ? (
          images.map((img, index) => {
            const finalUrl = `${import.meta.env.VITE_NEETFLIXAPI_URL}/api/komiku/image?url=${encodeURIComponent(img)}`;
            return (
              <img 
                key={index} 
                src={finalUrl}
                alt={`Page ${index + 1}`} 
                className="w-full h-auto block m-0"
                loading="lazy" 
                onError={(e) => {
                   // Jika proxy lokal gagal, biarkan kosong atau tampilkan error placeholder
                   e.target.onerror = null;
                   e.target.style.display = 'none';
                   e.target.insertAdjacentHTML('afterend', '<p class="text-white text-center py-4">Gambar gagal dimuat</p>');
                }}
              />
            );
          })
        ) : (
          <div className="text-white py-20">Tidak ada gambar yang ditemukan.</div>
        )}
      </div>

      {/* Bottom Bar / Navigasi Chapter */}
      <div className="fixed bottom-0 left-0 w-full bg-[#201F31] p-4 flex justify-between items-center z-50">
        {prevChapter ? (
          <Link 
            to={`/comic/read/${prevChapter}`} 
            state={location.state}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            &larr; Prev
          </Link>
        ) : (
          <button disabled className="px-4 py-2 bg-gray-800 text-gray-500 rounded cursor-not-allowed">
            &larr; Prev
          </button>
        )}
        
        {chaptersList.length > 0 && (
          <select 
            className="bg-gray-800 text-white px-4 py-2 rounded focus:outline-none max-w-[150px] md:max-w-[300px]"
            value={chapterId}
            onChange={(e) => navigate(`/comic/read/${e.target.value}`, { state: location.state })}
          >
            {chaptersList.map(ch => (
              <option key={ch.id} value={ch.id}>{ch.title}</option>
            ))}
          </select>
        )}

        {nextChapter ? (
          <Link 
            to={`/comic/read/${nextChapter}`} 
            state={location.state}
            className="px-4 py-2 bg-[#ffbade] text-black rounded font-bold hover:bg-opacity-80"
          >
            Next &rarr;
          </Link>
        ) : (
          <button disabled className="px-4 py-2 bg-gray-800 text-gray-500 rounded cursor-not-allowed">
            Next &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

export default ComicReader;
