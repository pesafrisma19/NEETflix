/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import getEpisodes from "@/src/utils/getEpisodes.utils";
import getNextEpisodeSchedule from "../utils/getNextEpisodeSchedule.utils";
import getServers from "../utils/getServers.utils";
import getStreamInfo from "../utils/getStreamInfo.utils";

export const useWatch = (animeId, initialEpisodeId) => {
  const [error, setError] = useState(null);
  const [buffering, setBuffering] = useState(true);
  const [streamInfo, setStreamInfo] = useState(null);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [animeInfoLoading, setAnimeInfoLoading] = useState(false);
  const [totalEpisodes, setTotalEpisodes] = useState(null);
  const [seasons, setSeasons] = useState(null);
  const [servers, setServers] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isFullOverview, setIsFullOverview] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [poster, setPoster] = useState(null);
  const [intro, setIntro] = useState(null);
  const [outro, setOutro] = useState(null);
  const [episodeId, setEpisodeId] = useState(null);
  const [activeEpisodeNum, setActiveEpisodeNum] = useState(null);
  const [activeServerId, setActiveServerId] = useState(null);
  const [activeServerType, setActiveServerType] = useState(null);
  const [activeServerName, setActiveServerName] = useState(null);
  const [serverLoading, setServerLoading] = useState(true);
  const [nextEpisodeSchedule, setNextEpisodeSchedule] = useState(null);
  const isServerFetchInProgress = useRef(false);
  const isStreamFetchInProgress = useRef(false);
  const lastStreamKey = useRef(null); // guard: mencegah infinite loop saat servers diupdate
  const serversRef = useRef(null); // ref untuk baca servers tanpa trigger re-render

  useEffect(() => {
    setEpisodes(null);
    setEpisodeId(null);
    setActiveEpisodeNum(null);
    setServers(null);
    setActiveServerId(null);
    setStreamInfo(null);
    setStreamUrl(null);
    setSubtitles([]);
    setThumbnail(null);
    setPoster(null);
    setIntro(null);
    setOutro(null);
    setBuffering(true);
    setServerLoading(true);
    setError(null);
    setAnimeInfo(null);
    setSeasons(null);
    setTotalEpisodes(null);
    setAnimeInfoLoading(true);
    isServerFetchInProgress.current = false;
    isStreamFetchInProgress.current = false;
    lastStreamKey.current = null; // reset stream guard
  }, [animeId]);

  // FETCH SERVERS PERTAMA KALI (karena statik AL & OD)
  useEffect(() => {
    let mounted = true;
    const fetchServers = async () => {
      try {
        const data = await getServers(animeId, null);
        if (!mounted) return;
        const serversList = data || [];
        const savedServerName = localStorage.getItem("server_name");
        const initialServer = serversList.find(s => s.serverName === savedServerName) || serversList[0];

        setServers(serversList);
        setActiveServerType(initialServer?.type);
        setActiveServerName(initialServer?.serverName);
        setActiveServerId(initialServer?.data_id); // ini "source-AL" atau "source-OD"
      } catch (err) {
        console.error("Error fetching servers:", err);
      } finally {
        if (mounted) setServerLoading(false);
      }
    };
    fetchServers();
    return () => { mounted = false; };
  }, [animeId]);

  // Sync serversRef agar stream effect bisa baca nilai terbaru tanpa masuk dep array
  useEffect(() => {
    serversRef.current = servers;
  }, [servers]);

  // FETCH ANIME INFO & EPISODES (Re-run jika activeServerId / source berubah)
  useEffect(() => {
    if (!activeServerId) return; // Tunggu server diset dulu
    // STREAM- prefix = pilihan kualitas (720p, 1080p, dst) — bukan pergantian sumber
    // Tidak perlu re-fetch episode, cukup skip
    if (activeServerId.startsWith("STREAM-")) return;

    const fetchInitialData = async () => {
      try {
        setAnimeInfoLoading(true);
        // Ambil Anime Info (AniList) terlebih dahulu untuk dapat judul
        const animeDataResponse = await getAnimeInfo(animeId, false);

        // Ambil judul Romaji dan English dari AniList untuk pencarian AL
        const romajiTitle = animeDataResponse?.data?.japanese_title;
        const englishTitle = animeDataResponse?.data?.title;

        // Source yang dipilih: "AL" atau "OD"
        let source = "AL";
        if (activeServerId?.startsWith("source-")) {
          source = activeServerId.replace("source-", "");
        } else if (activeServerId?.startsWith("STREAM-")) {
          source = activeServerId.split("|")[0].replace("STREAM-", "");
        }
        // Fetch episodes (AL/OD) and TMDB metadata in parallel
        const [episodesData, tmdbData] = await Promise.all([
          getEpisodes(animeDataResponse?.data, source),
          import("@/src/utils/getTMDBMetadata.utils").then(m => m.getTMDBMetadata(animeId, romajiTitle || englishTitle, animeDataResponse?.data?.animeInfo?.tvInfo?.eps))
        ]);

        // Attach TMDB metadata to each episode
        if (episodesData?.episodes && tmdbData) {
          episodesData.episodes = episodesData.episodes.map(ep => ({
            ...ep,
            tmdb: tmdbData[ep.episode_no] || null
          }));
        }

        setAnimeInfo(animeDataResponse?.data);
        setSeasons(animeDataResponse?.seasons);
        setEpisodes(episodesData?.episodes);
        setTotalEpisodes(episodesData?.totalEpisodes);
        let newEpisodeId =
          initialEpisodeId ||
          (episodesData?.episodes?.length > 0
            ? episodesData.episodes[0].id.match(/ep=(\d+)/)?.[1]
            : null);
        if (newEpisodeId && String(newEpisodeId).includes('ep=')) {
          newEpisodeId = String(newEpisodeId).replace('ep=', '');
        }
        setEpisodeId(newEpisodeId);

        // Hentikan buffering (loading) jika tidak ada episode yang didapat (misal gagal match)
        if (!episodesData?.episodes?.length) {
          setBuffering(false);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError(err.message || "An error occurred.");
        setBuffering(false); // Hentikan buffering saat terjadi error fetch
      } finally {
        setAnimeInfoLoading(false);
      }
    };
    fetchInitialData();
  }, [animeId, activeServerId]); // <-- Tambahkan activeServerId agar refetch episode saat pindah AL/OD

  useEffect(() => {
    const fetchNextEpisodeSchedule = async () => {
      try {
        const data = await getNextEpisodeSchedule(animeId);
        setNextEpisodeSchedule(data);
      } catch (err) {
        console.error("Error fetching next episode schedule:", err);
      }
    };
    fetchNextEpisodeSchedule();
  }, [animeId]);

  useEffect(() => {
    if (!episodes || !episodeId) {
      setActiveEpisodeNum(null);
      return;
    }
    const activeEpisode = episodes.find((episode) => {
      const match = episode.id.match(/ep=(\d+)/);
      const cleanId = String(episodeId).replace('ep=', '');
      return match && match[1] === cleanId;
    });
    const newActiveEpisodeNum = activeEpisode ? activeEpisode.episode_no : null;
    if (activeEpisodeNum !== newActiveEpisodeNum) {
      setActiveEpisodeNum(newActiveEpisodeNum);
    }
  }, [episodeId, episodes]);

  // Reset activeServerId ke default (source-AL / source-OD) ketika ganti episode,
  // jika user sebelumnya memilih resolusi (STREAM-...)
  useEffect(() => {
    if (activeServerId?.startsWith("STREAM-")) {
      const source = activeServerId.startsWith("STREAM-OD") ? "source-OD" : "source-AL";
      setActiveServerId(source);
    }
  }, [episodeId]);

  // Fetch stream info only when episodeId, activeServerId, servers, AND animeInfo are ready
  useEffect(() => {
    if (
      !episodeId ||
      !activeServerId ||
      !servers ||
      !animeInfo ||          // tunggu sampai animeInfo (judul) sudah tersedia
      isServerFetchInProgress.current ||
      isStreamFetchInProgress.current
    )
      return;
    const iframeServers = [];
    // const iframeServers = ["hd-1", "hd-4", "vidstreaming", "vidcloud", "douvideo"];

    if (iframeServers.includes(activeServerName?.toLowerCase()) && !serverLoading) {
      setBuffering(false);
      return;
    }
    const fetchStreamInfo = async () => {
      // ── Quality Switch langsung (STREAM- prefix) ──
      // activeServerId = "STREAM-AL|https://..." → langsung ganti URL, tidak perlu fetch ulang
      if (activeServerId?.startsWith("STREAM-")) {
        const directUrl = activeServerId.split("|")[1];
        setStreamUrl(directUrl);
        setBuffering(false);   // ← wajib, karena tidak lewat finally block
        return;
      }

      isStreamFetchInProgress.current = true;
      setBuffering(true);
      try {
        const server = serversRef.current?.find((srv) => srv.data_id === activeServerId);

        // Hitung episode number LANGSUNG di sini — jangan pakai state activeEpisodeNum
        // karena bisa stale (null) saat effect pertama kali jalan
        const activeEpisode = episodes?.find((ep) => {
          const match = ep.id.match(/ep=(\d+)/);
          const cleanId = String(episodeId).replace('ep=', '');
          return match && match[1] === cleanId;
        });
        const episodeSlug = activeEpisode?.slug;
        const currentEpisodeNum = activeEpisode?.episode_no;

        // Tentukan source (AL atau OD)
        let source = "AL";
        if (activeServerId?.startsWith("source-")) {
          source = activeServerId.replace("source-", "");
        } else if (activeServerId?.startsWith("STREAM-")) {
          source = activeServerId.split("|")[0].replace("STREAM-", "");
        }

        // Guard: Pastikan episodes sudah terupdate sesuai dengan source yang dipilih
        if (activeEpisode?.source && activeEpisode.source !== source) return;

        // Guard: skip jika sudah diproses
        const streamKey = `${animeInfo.id}||${episodeId}||${activeServerId}||${episodeSlug}`;
        if (lastStreamKey.current === streamKey) return;
        lastStreamKey.current = streamKey;

        if (!currentEpisodeNum) {
          console.warn("[stream] Episode not found for id:", episodeId);
          setBuffering(false);
          isStreamFetchInProgress.current = false;
          return;
        }

        if (server || true) { // Abaikan pengecekan server karena streaming langsung dari judul
          const data = await getStreamInfo(
            animeInfo,
            currentEpisodeNum,  // ← pakai nilai fresh, bukan state activeEpisodeNum
            episodeSlug,
            source
          );
          setStreamInfo(data);
          setStreamUrl(data?.streamingLink?.link?.file || null);
          setIntro(data?.streamingLink?.intro || null);
          setOutro(data?.streamingLink?.outro || null);
          const subtitles =
            data?.streamingLink?.tracks
              ?.filter((track) => track.kind === "captions")
              .map(({ file, label }) => ({ file, label })) || [];
          setSubtitles(subtitles);
          const thumbnailTrack = data?.streamingLink?.tracks?.find(
            (track) => track.kind === "thumbnails" && track.file
          );
          if (thumbnailTrack) setThumbnail(thumbnailTrack.file);
          setPoster(activeEpisode?.tmdb?.thumbnail || null);

          // Inject kualitas stream ke servers (baik AL maupun OD) — pertahankan tombol sumber
          const allSources = data?.streamingLink?.link?.allSources;
          if (allSources?.length) {
            const qualityServers = allSources.map((src, i) => ({
              serverName: `${source} ${src.quality}`,   // "AL 1080p", "OD 720p"
              data_id: `STREAM-${source}|${src.url}`,   // prefix STREAM-AL| atau STREAM-OD|
              server_id: `stream-${i}`,
              type: "sub",
              source: "Quality"               // → masuk QUALITY section di Servers.jsx (sebelumnya "AnimeLovers")
            }));

            // Gabungkan sumber utama (AL, OD) dengan pilihan kualitas
            const baseServers = servers.filter(s => !s.data_id.startsWith("STREAM-"));
            setServers([...baseServers, ...qualityServers]);

            // Auto-highlight quality pertama yang sedang diputar
            // Prefer 720p → 480p → fallback ke yang pertama tersedia
            const preferredOrder = ["720p", "480p", "360p", "1080p"];
            const defaultQuality =
              preferredOrder.reduce((found, q) =>
                found || qualityServers.find(s => s.serverName.endsWith(q)),
                null
              ) || qualityServers[0];
            if (defaultQuality) {
              setActiveServerId(defaultQuality.data_id);
              setStreamUrl(defaultQuality.data_id.split("|")[1]);
            }
          }
        } else {
          setError("No server found with the activeServerId.");
        }
      } catch (err) {
        console.error("Error fetching stream info:", err);
        setError(err.message || "An error occurred.");
      } finally {
        setBuffering(false);
        isStreamFetchInProgress.current = false;
      }
    };
    fetchStreamInfo();
  // Catatan: 'servers' SENGAJA tidak ada di sini — diakses via serversRef untuk hindari re-trigger loop
  }, [episodeId, activeServerId, animeInfo, episodes]);

  return {
    error,
    buffering,
    serverLoading,
    streamInfo,
    animeInfo,
    episodes,
    nextEpisodeSchedule,
    animeInfoLoading,
    totalEpisodes,
    seasons,
    servers,
    streamUrl,
    isFullOverview,
    setIsFullOverview,
    subtitles,
    thumbnail,
    poster,
    intro,
    outro,
    episodeId,
    setEpisodeId,
    activeEpisodeNum,
    setActiveEpisodeNum,
    activeServerId,
    setActiveServerId,
    activeServerType,
    setActiveServerType,
    activeServerName,
    setActiveServerName,
  };
};
