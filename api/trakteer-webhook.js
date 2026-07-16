import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Hanya menerima metode POST dari Trakteer
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Verifikasi Token (kita akan minta Trakteer mengirimkan token di URL)
  // Contoh URL webhook: https://neetflix.monster/api/trakteer-webhook?token=trhook-wmCopd30hBNgUelqkntbYJ66
  const { token } = req.query;
  const EXPECTED_TOKEN = process.env.TRAKTEER_WEBHOOK_TOKEN;
  
  if (!EXPECTED_TOKEN || token !== EXPECTED_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized webhook token' });
  }

  try {
    const payload = req.body;
    
    // Trakteer mengirimkan tipe event. Kita akan proses event 'tip'
    if (payload.type === 'tip') {
      const email = payload.supporter_email;
      
      if (!email) {
        return res.status(400).json({ message: 'No email provided in payload' });
      }

      // Inisialisasi Supabase menggunakan Service Role Key (Admin Key)
      // agar bisa menembus RLS dan mengedit tabel profiles secara paksa
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Cari user di tabel auth.users berdasarkan email
      // Catatan: Hanya Admin Key yang bisa memanggil api auth.admin.listUsers
      const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
      
      if (searchError) {
        console.error("Error searching user:", searchError);
        return res.status(500).json({ message: 'Database error' });
      }

      // Cocokkan email dari Trakteer dengan email user
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return res.status(404).json({ message: 'User email not found in Supabase' });
      }

      // Jika user ditemukan, berikan status VIP
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_vip: true })
        .eq('id', user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return res.status(500).json({ message: 'Failed to update VIP status' });
      }

      return res.status(200).json({ message: `Successfully upgraded ${email} to VIP!` });
    }

    return res.status(200).json({ message: 'Event ignored' });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
