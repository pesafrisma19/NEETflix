import axios from "axios";

export default async function getStreamInfo(animeTitle, episodeNumber, episodeSlug) {
  const api_url = import.meta.env.VITE_ANIMASU_API_URL || import.meta.env.VITE_API_URL;
  try {
    let slug = episodeSlug;
    // Jika tidak ada episodeSlug (fallback), buat slug Otakudesu manual
    if (!slug) {
       let baseSlug = animeTitle.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
       slug = `${baseSlug}-episode-${episodeNumber}-sub-indo`;
    }

    const url = `${api_url}/episode/${slug}`;
    console.log("Fetching Otakudesu Stream:", url);
    const response = await axios.get(url);
    const data = response.data?.data;
    
    let videoUrl = null;
    const iframeUrl = data?.defaultStreamingUrl;

    // 1. Ekstrak link murni dari Desustream (Otakuwatch) menggunakan CORS Proxy publik
    if (iframeUrl && iframeUrl.includes("desustream")) {
       try {
         console.log("Mencoba mengekstrak Desustream iframe...");
         const corsProxy = "/api/proxy?url=";
         const htmlResp = await axios.get(corsProxy + encodeURIComponent(iframeUrl));
         const htmlContent = typeof htmlResp.data === "string" ? htmlResp.data : JSON.stringify(htmlResp.data);
         
         let gvMatch = htmlContent.match(/<source[^>]+src=["'](https:\/\/[^"']*googlevideo\.com\/videoplayback[^"']*)["']/i);
         
         // Jika gagal menemukan source langsung, coba cari iframe blogger tersembunyi (kasus Ondesu)
         if (!gvMatch) {
             console.log("Mencari iframe Blogger tersembunyi...");
             const bloggerMatch = htmlContent.match(/<iframe[^>]+src=["'](https:\/\/[^"']*blogger\.com\/video\.g[^"']*)["']/i);
             if (bloggerMatch) {
                 const bloggerUrl = bloggerMatch[1];
                 console.log("Menemukan iframe Blogger:", bloggerUrl);
                 const bloggerResp = await axios.get(corsProxy + encodeURIComponent(bloggerUrl));
                 const bloggerHtml = typeof bloggerResp.data === "string" ? bloggerResp.data : JSON.stringify(bloggerResp.data);
                 
                 // Blogger menyimpan link di dalam javascript config string
                 gvMatch = bloggerHtml.match(/(https:\/\/[^\s"'<]*googlevideo\.com\/videoplayback[^\s"'<]*)/i);
             }
         }

         if (gvMatch) {
            videoUrl = gvMatch[1];
            // Decode HTML entities dan Unicode escapes (misal &amp; dan \u0026 menjadi &)
            videoUrl = videoUrl.replace(/&amp;/g, "&").replace(/\\u0026/g, "&");
            console.log("Sukses mengekstrak Google Video murni:", videoUrl);
         }
       } catch (err) {
         console.error("Gagal mengekstrak Desustream:", err);
       }
    }

    // 2. Jika gagal diekstrak, fallback pakai iframeUrl (akan menyebabkan error di Artplayer kalau tidak ditangani, tapi minimal ada data)
    if (!videoUrl) {
       videoUrl = iframeUrl;
    }

    return {
      streamingLink: {
        link: { file: videoUrl },
        tracks: [], // Otakudesu biasanya hardsub, jadi tidak ada track subtitle terpisah
        intro: null,
        outro: null
      }
    };
  } catch (error) {
    console.error("Error fetching stream info dari Otakudesu:", error);
    return null;
  }
}
