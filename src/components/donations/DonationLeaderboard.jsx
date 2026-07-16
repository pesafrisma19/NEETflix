import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown } from "@fortawesome/free-solid-svg-icons";

export default function DonationLeaderboard() {
  const [supports, setSupports] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [topDonors, setTopDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const targetAmount = 200000;
  const trakteerLink = "https://trakteer.id/NEETflix/gift";

  useEffect(() => {
    const fetchTrakteerData = async () => {
      try {
        const apiKey = import.meta.env.VITE_TRAKTEER_API_KEY;
        if (!apiKey) {
          console.error("VITE_TRAKTEER_API_KEY is not set");
          setLoading(false);
          return;
        }

        const response = await fetch('/api/trakteer/supports', {
          headers: {
            'key': apiKey,
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        const data = await response.json();
        
        if (data.status === 'success' && data.result.data) {
          const supportData = data.result.data;
          setSupports(supportData);
          
          // Calculate total
          const total = supportData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
          setTotalAmount(total);

          // Calculate Top Donors (Group by supporter_name)
          const groupedDonors = supportData.reduce((acc, curr) => {
            const name = curr.supporter_name || 'Seseorang';
            if (!acc[name]) {
              acc[name] = 0;
            }
            acc[name] += curr.amount || 0;
            return acc;
          }, {});

          const sortedTop = Object.entries(groupedDonors)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3);
            
          setTopDonors(sortedTop);
        }
      } catch (error) {
        console.error("Failed to fetch Trakteer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrakteerData();
  }, []);

  const progressPercentage = Math.min((totalAmount / targetAmount) * 100, 100);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="w-[1300px] mx-auto mt-16 mb-8 relative max-[1350px]:w-full max-[1350px]:px-8 max-[780px]:px-4">
      <div className="bg-[#1A1A24] rounded-[30px] p-8 max-[780px]:p-6 shadow-xl border border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
              <span className="text-3xl">💖</span> Dukung NEETflix!
            </h2>
            <p className="text-gray-400 text-sm">
              Trakteer kami untuk biaya server agar NEETflix tetap hidup tanpa iklan yang mengganggu!
            </p>
          </div>
          <a 
            href={trakteerLink} 
            target="_blank" 
            rel="noreferrer"
            className="bg-[#C13222] hover:bg-[#a62b1d] text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shrink-0"
          >
            <img src="https://trakteer.id/images/mix/ic_logo_trakteer_white.png" alt="Trakteer" className="h-5" />
            Dukung Kami
          </a>
        </div>

        {/* Progress Bar */}
        <div className="bg-[#2B2A3C] rounded-2xl p-6 mb-10">
          <div className="flex justify-between text-sm mb-2 font-semibold">
            <span className="text-gray-300">Terkumpul: <span className="text-[#ffbade] text-lg">{formatRupiah(totalAmount)}</span></span>
            <span className="text-gray-500">Target: {formatRupiah(targetAmount)}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#ffbade] to-[#ff99cc] h-3 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-[#ffbade] font-bold">
            {progressPercentage.toFixed(1)}% Tercapai
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ffbade]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Top Donors */}
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <FontAwesomeIcon icon={faCrown} className="text-yellow-400" />
                Top Donatur
              </h3>
              <div className="flex justify-center items-end gap-4 h-[220px]">
                {/* Rank 2 */}
                {topDonors[1] && (
                  <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${topDonors[1].name}&backgroundColor=2B2A3C`} 
                      alt="avatar" 
                      className="w-16 h-16 rounded-full border-4 border-gray-500 bg-[#2B2A3C]"
                    />
                    <div className="bg-[#2B2A3C] w-24 h-24 mt-2 rounded-t-xl flex flex-col items-center justify-start pt-3 border-t-4 border-gray-500">
                      <span className="text-xs text-gray-300 font-bold truncate w-20 text-center">{topDonors[1].name}</span>
                      <span className="text-xs text-[#ffbade] font-bold mt-1">{formatRupiah(topDonors[1].amount)}</span>
                      <span className="text-[10px] text-gray-500 mt-1">#2</span>
                    </div>
                  </div>
                )}

                {/* Rank 1 */}
                {topDonors[0] && (
                  <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-8 duration-500">
                    <FontAwesomeIcon icon={faCrown} className="text-yellow-400 text-2xl mb-1 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${topDonors[0].name}&backgroundColor=2B2A3C`} 
                      alt="avatar" 
                      className="w-20 h-20 rounded-full border-4 border-yellow-400 bg-[#2B2A3C] shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                    />
                    <div className="bg-[#2B2A3C] w-28 h-32 mt-2 rounded-t-xl flex flex-col items-center justify-start pt-3 border-t-4 border-yellow-400 shadow-xl">
                      <span className="text-sm text-white font-bold truncate w-24 text-center">{topDonors[0].name}</span>
                      <span className="text-sm text-[#ffbade] font-bold mt-1">{formatRupiah(topDonors[0].amount)}</span>
                      <span className="text-xs text-yellow-400 mt-1 font-bold">#1</span>
                    </div>
                  </div>
                )}

                {/* Rank 3 */}
                {topDonors[2] && (
                  <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 duration-500 delay-200">
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${topDonors[2].name}&backgroundColor=2B2A3C`} 
                      alt="avatar" 
                      className="w-14 h-14 rounded-full border-4 border-[#cd7f32] bg-[#2B2A3C]"
                    />
                    <div className="bg-[#2B2A3C] w-24 h-20 mt-2 rounded-t-xl flex flex-col items-center justify-start pt-3 border-t-4 border-[#cd7f32]">
                      <span className="text-xs text-gray-300 font-bold truncate w-20 text-center">{topDonors[2].name}</span>
                      <span className="text-xs text-[#ffbade] font-bold mt-1">{formatRupiah(topDonors[2].amount)}</span>
                      <span className="text-[10px] text-gray-500 mt-1">#3</span>
                    </div>
                  </div>
                )}

                {topDonors.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-500 w-full">
                    Belum ada donatur, jadilah yang pertama!
                  </div>
                )}
              </div>
            </div>

            {/* Recent Donations */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">
                Riwayat Dukungan
              </h3>
              <div className="bg-[#2B2A3C] rounded-2xl p-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                {supports.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">Belum ada riwayat dukungan</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {supports.slice(0, 10).map((support, index) => (
                      <div key={index} className="bg-[#1A1A24] p-3 rounded-xl flex items-center gap-3">
                        <img 
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${support.supporter_name || 'Seseorang'}&backgroundColor=ffbade`} 
                          alt="avatar" 
                          className="w-10 h-10 rounded-full shrink-0"
                        />
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="font-bold text-white text-sm truncate pr-2">{support.supporter_name || 'Seseorang'}</span>
                            <span className="text-[#ffbade] font-bold text-sm whitespace-nowrap">{formatRupiah(support.amount)}</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {support.support_message || 'Memberikan dukungan!'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
