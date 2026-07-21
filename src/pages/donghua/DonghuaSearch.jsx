import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import DonghuaCategoryCard from '../../components/donghua/DonghuaCategoryCard';
import CategoryCardLoader from '@/src/components/Loader/CategoryCard.loader';
import PageSlider from '@/src/components/pageslider/PageSlider';
import website_name from "@/src/config/website";

const NEETFLIXAPI = import.meta.env.VITE_NEETFLIXAPI_URL || "http://localhost:4444";

function DonghuaSearch() {
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = searchParams.get("keyword") || "";
    const page = parseInt(searchParams.get("page"), 10) || 1;
    
    const [searchData, setSearchData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSearch = async () => {
            if (!keyword) return;
            setLoading(true);
            try {
                const res = await axios.get(`${NEETFLIXAPI}/api/anichin/search?q=${encodeURIComponent(keyword)}&page=${page}`);
                if (res.data?.success) {
                    setSearchData(res.data.results || []);
                    // Assuming the API pagination maxes out or we just allow next until empty. For now, we use a heuristic or API provided total.
                    // If Anichin search returns `pagination` or similar, we can use it. Since it doesn't always, let's just assume next page exists if data is full.
                    // Defaulting to page + 1 if data length is 24 (max per page typically).
                    if ((res.data.results || []).length > 0) {
                        setTotalPages(Math.max(page + 1, 10)); // just a safe boundary for pagination component
                    } else {
                        setTotalPages(page);
                    }
                } else {
                    setError("Failed to fetch");
                }
            } catch (err) {
                console.error("Error fetching donghua search:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        document.title = `Cari Donghua: ${keyword} - ${website_name}`;
        fetchSearch();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [keyword, page]);

    const handlePageChange = (newPage) => {
        setSearchParams({ keyword, page: newPage });
    };

    return (
        <div className='w-full px-4 mt-[128px] max-[1200px]:flex max-[1200px]:flex-col max-[1200px]:gap-y-10 max-custom-md:mt-[80px] max-[478px]:mt-[60px] pb-10'>
            {loading ? (
                <CategoryCardLoader className={"max-[478px]:mt-2"} />
            ) : searchData && searchData.length > 0 ? (
                <div>
                    <DonghuaCategoryCard
                        label={`Hasil Pencarian Donghua: ${keyword}`}
                        data={searchData}
                        showViewMore={false}
                        className={"mt-0"}
                    />
                    <div className="mt-8">
                        <PageSlider page={page} totalPages={totalPages} handlePageChange={handlePageChange} />
                    </div>
                </div>
            ) : error ? (
                <p className='font-bold text-2xl text-[#ffbade] max-[478px]:text-[18px]'>Couldn&apos;t get search result please try again</p>
            ) : (
                <p className='font-bold text-2xl text-[#ffbade] max-[478px]:text-[18px]'>Tidak ditemukan donghua untuk: {keyword}</p>
            )}
        </div>
    );
}

export default DonghuaSearch;
