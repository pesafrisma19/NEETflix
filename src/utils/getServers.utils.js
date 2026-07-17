/**
 * getServers.utils.js
 *
 * Kembalikan daftar sumber (source) yang tersedia untuk anime ini.
 * Setiap source punya ID unik yang dipakai sebagai activeServerId di useWatch.
 *
 * Format:
 *   { serverName, data_id, server_id, type, source }
 *
 * Saat ini: hanya AL.
 * Nanti: tambah OD, Gogoanime, dll di sini.
 */
export default async function getServers(animeId, episodeId) {
  // AL selalu dicoba — episode list sudah diambil via getEpisodes
  // data_id "AL" = sinyal ke useWatch bahwa streaming lewat AL stream-by-title
  return [
    {
      serverName: "AL",
      data_id: "source-AL",
      server_id: "al",
      type: "sub",
      // TIDAK ada field 'source' → agar masuk subServers di Servers.jsx (!s.source = true)
    },
    {
      serverName: "OD",
      data_id: "source-OD",
      server_id: "od",
      type: "sub",
    },
  ];
}
