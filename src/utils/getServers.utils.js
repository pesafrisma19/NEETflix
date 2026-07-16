export default async function getServers(animeId, episodeId) {
  // Karena sekarang kita murni menggunakan Animasu dari getStreamInfo,
  // kita tidak butuh server dari API lama lagi.
  // Tapi agar UI Player (seperti tombol "HD-1") tidak hilang dan tidak error "filter is not a function",
  // kita cukup kembalikan dummy data server berikut.
  return [
    {
      serverName: "HD-1",
      type: "sub",
      data_id: "dummy-hd1",
      server_id: "1"
    }
  ];
}
