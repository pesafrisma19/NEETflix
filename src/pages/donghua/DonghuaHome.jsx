import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/error/Error';
import DonghuaSpotlight from '../../components/donghua/DonghuaSpotlight';
import DonghuaTrending from '../../components/donghua/DonghuaTrending';
import DonghuaCategoryCard from '../../components/donghua/DonghuaCategoryCard';

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function DonghuaHome() {
  const [recent, setRecent] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      document.title = "NEETflix Donghua";
      setLoading(true);
      try {
        const [recentRes, recRes] = await Promise.all([
          axios.get(`${NEETFLIXAPI}/api/anichin/recent`),
          axios.get(`${NEETFLIXAPI}/api/anichin/recommendations`)
        ]);
        
        // Fix: Anichin API returns results directly as an array, not inside a 'data' object
        if (recentRes.data?.success) setRecent(recentRes.data.results || []);
        if (recRes.data?.success) setRecommendations(recRes.data.results || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loader type="home" />;
  if (error) return <Error />;

  return (
    <div className="px-4 w-full max-[1200px]:px-0">
      <DonghuaSpotlight spotlights={recommendations.slice(0, 8)} />
      
      <DonghuaTrending trending={recommendations} />
      
      <div className="w-full mt-[60px] pb-10 max-[1200px]:px-4">
        <DonghuaCategoryCard
          label="Latest Donghua Episode"
          data={recent}
          path="donghua/recent"
          limit={24}
        />
      </div>
    </div>
  );
}

export default DonghuaHome;
