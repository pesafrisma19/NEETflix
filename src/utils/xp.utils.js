import { supabase } from "../lib/supabaseClient";

export const formatWhatsAppDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (isToday) {
    return `Hari ini, ${timeStr}`;
  }
  if (isYesterday) {
    return `Kemarin, ${timeStr}`;
  }

  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

export const getRankTitle = (level) => {
  if (level >= 999) return "NEETflix Lovers 👑";
  if (level >= 800) return "Kami-sama";
  if (level >= 500) return "Isekai Protagonist";
  if (level >= 200) return "Hikikomori";
  if (level >= 100) return "Weaboo";
  if (level >= 50) return "Otaku";
  if (level >= 30) return "Anime Fan";
  if (level >= 10) return "Novice Watcher";
  return "Villager";
};

export const xpToNextLevel = (level) => {
  return level * 100;
};

export const FRAME_LIST = [
  { id: "avatar-frame-standard", name: "Pink Neon Frame", reqType: "level", reqValue: 1, icon: "🌸", desc: "Bingkai standar bawaan pengguna" },
  { id: "avatar-frame-bronze", name: "Bronze Frame", reqType: "level", reqValue: 10, icon: "🥉", desc: "Mencapai Level 10 (Novice Watcher)" },
  { id: "avatar-frame-silver", name: "Silver Frame", reqType: "level", reqValue: 50, icon: "🥈", desc: "Mencapai Level 50 (Otaku)" },
  { id: "avatar-frame-gold", name: "Gold Animated Frame", reqType: "level", reqValue: 100, icon: "🥇", desc: "Mencapai Level 100 (Weaboo)" },
  { id: "avatar-frame-mythic", name: "Mythic Neon Frame", reqType: "level", reqValue: 500, icon: "🔮", desc: "Mencapai Level 500 (Isekai Protagonist)" },
  { id: "avatar-frame-vip", name: "VIP Royal Rainbow", reqType: "vip", reqValue: true, icon: "👑", desc: "Khusus Member VIP Berlangganan" },
  { id: "avatar-frame-matrix", name: "Yap Matrix Frame", reqType: "comments_count", reqValue: 50, icon: "🟢", desc: "Kirim minimal 50 Komentar/Chat" },
  { id: "avatar-frame-pulse", name: "Neon Pulse Frame", reqType: "comments_count", reqValue: 200, icon: "🟣", desc: "Kirim minimal 200 Komentar/Chat" },
  { id: "avatar-frame-fire", name: "Marathoner Fire Frame", reqType: "episodes_watched", reqValue: 50, icon: "🔥", desc: "Tonton minimal 50 Episode" },
  { id: "avatar-frame-dragon", name: "Dragon Flare Frame", reqType: "episodes_watched", reqValue: 150, icon: "🐉", desc: "Tonton minimal 150 Episode" },
  { id: "avatar-frame-emerald", name: "Emerald Scroll Frame", reqType: "chapters_read", reqValue: 50, icon: "📜", desc: "Baca minimal 50 Chapter Komik" },
  { id: "avatar-frame-mystic", name: "Mystic Book Frame", reqType: "chapters_read", reqValue: 150, icon: "📖", desc: "Baca minimal 150 Chapter Komik" }
];

export const TITLE_LIST = [
  { id: "Spammer Pemula", name: "Spammer Pemula", reqType: "comments_count", reqValue: 10, icon: "💬" },
  { id: "Yap Master", name: "Yap Master", reqType: "comments_count", reqValue: 50, icon: "🟢" },
  { id: "King of Chatroom", name: "King of Chatroom", reqType: "comments_count", reqValue: 200, icon: "🟣" },
  { id: "Casual Watcher", name: "Casual Watcher", reqType: "episodes_watched", reqValue: 10, icon: "🎬" },
  { id: "Marathoner", name: "Marathoner", reqType: "episodes_watched", reqValue: 50, icon: "🔥" },
  { id: "Anime Addict", name: "Anime Addict", reqType: "episodes_watched", reqValue: 150, icon: "🐉" },
  { id: "Manga Reader", name: "Manga Reader", reqType: "chapters_read", reqValue: 10, icon: "📖" },
  { id: "Bookworm", name: "Bookworm", reqType: "chapters_read", reqValue: 50, icon: "📜" },
  { id: "Lore Master", name: "Lore Master", reqType: "chapters_read", reqValue: 150, icon: "🔮" },
  { id: "Generous Heart", name: "Generous Heart", reqType: "likes_count", reqValue: 25, icon: "👍" },
  { id: "Collector", name: "Collector", reqType: "bookmarks_count", reqValue: 10, icon: "📌" }
];

export const ACHIEVEMENT_LIST = [
  { id: "ach_comment_10", title: "Spammer Pemula", desc: "Kirim 10 Komentar/Chat", reqType: "comments_count", target: 10, rewardXp: 50, rewardTitle: "Spammer Pemula" },
  { id: "ach_comment_50", title: "Yap Master", desc: "Kirim 50 Komentar/Chat", reqType: "comments_count", target: 50, rewardFrame: "avatar-frame-matrix", rewardTitle: "Yap Master" },
  { id: "ach_comment_200", title: "King of Chatroom", desc: "Kirim 200 Komentar/Chat", reqType: "comments_count", target: 200, rewardFrame: "avatar-frame-pulse", rewardTitle: "King of Chatroom" },
  { id: "ach_watch_10", title: "Casual Watcher", desc: "Tonton 10 Episode", reqType: "episodes_watched", target: 10, rewardXp: 50, rewardTitle: "Casual Watcher" },
  { id: "ach_watch_50", title: "Marathoner", desc: "Tonton 50 Episode", reqType: "episodes_watched", target: 50, rewardFrame: "avatar-frame-fire", rewardTitle: "Marathoner" },
  { id: "ach_watch_150", title: "Anime Addict", desc: "Tonton 150 Episode", reqType: "episodes_watched", target: 150, rewardFrame: "avatar-frame-dragon", rewardTitle: "Anime Addict" },
  { id: "ach_read_10", title: "Manga Reader", desc: "Baca 10 Chapter Komik", reqType: "chapters_read", target: 10, rewardXp: 50, rewardTitle: "Manga Reader" },
  { id: "ach_read_50", title: "Bookworm", desc: "Baca 50 Chapter Komik", reqType: "chapters_read", target: 50, rewardFrame: "avatar-frame-emerald", rewardTitle: "Bookworm" },
  { id: "ach_read_150", title: "Lore Master", desc: "Baca 150 Chapter Komik", reqType: "chapters_read", target: 150, rewardFrame: "avatar-frame-mystic", rewardTitle: "Lore Master" },
  { id: "ach_like_25", title: "Generous Heart", desc: "Berikan 25 Like Komentar", reqType: "likes_count", target: 25, rewardXp: 50, rewardTitle: "Generous Heart" },
  { id: "ach_bookmark_10", title: "Collector", desc: "Simpan 10 Item ke Watchlist", reqType: "bookmarks_count", target: 10, rewardXp: 50, rewardTitle: "Collector" }
];

export const isItemUnlocked = (item, level = 1, isVip = false, stats = {}) => {
  if (item.reqType === "vip") return isVip;
  if (item.reqType === "level") return level >= item.reqValue;
  if (item.reqType) {
    const userVal = stats[item.reqType] || 0;
    return userVal >= item.reqValue;
  }
  return true;
};

export const getAvatarFrameClass = (level = 1, isVip = false, customs = null, stats = {}) => {
  if (customs?.equipped_frame) {
    const item = FRAME_LIST.find(f => f.id === customs.equipped_frame);
    if (item && isItemUnlocked(item, level, isVip, stats)) {
      return customs.equipped_frame;
    }
  }
  if (isVip) return "avatar-frame-vip";
  if (level >= 500) return "avatar-frame-mythic";
  if (level >= 100) return "avatar-frame-gold";
  if (level >= 50) return "avatar-frame-silver";
  if (level >= 10) return "avatar-frame-bronze";
  return "avatar-frame-standard";
};

/**
 * Posisikan penambahan XP dan pengecekan level up secara terpusat + Anti-Cheat
 * 
 * @param {string} userId - ID Pengguna dari Supabase Auth
 * @param {string} actionType - 'comment' | 'watch_episode' | 'read_chapter' | 'like' | 'bookmark'
 * @param {number} xpAmount - Jumlah XP yang didapat (misal 25, 10, 5, 3)
 * @param {string} referenceId - ID unik konten (episode_id, chapter_id, comment_id, anime_id)
 * @param {function} addToast - Fungsi toast notification (opsional)
 */
export const addXpAndCheckLevelUp = async (userId, actionType, xpAmount, referenceId = null, addToast = null) => {
  if (!userId) return { success: false, reason: "No user ID" };

  // Definisi Batas Maksimal Harian (Daily Cap)
  const DAILY_LIMITS = {
    comment: 8,       // Max 8 komentar/hari (+25 XP = Max 200 XP)
    live_chat: 10,    // Max 10 pesan chat/hari (+5 XP = Max 50 XP)
    watch_episode: 10,// Max 10 episode/hari (+10 XP = Max 100 XP)
    read_chapter: 10, // Max 10 chapter/hari (+5 XP = Max 50 XP)
    like: 10,         // Max 10 like/hari (+5 XP = Max 50 XP)
    bookmark: 5       // Max 5 bookmark/hari (+3 XP = Max 15 XP)
  };

  const ACTION_LABELS = {
    comment: "Komentar",
    live_chat: "Pesan Chat",
    watch_episode: "Nonton Episode",
    read_chapter: "Baca Komik",
    like: "Like",
    bookmark: "Bookmark"
  };

  try {
    // 1. Anti-Cheat Check: Cek apakah aksi dengan referenceId ini sudah pernah dicatat di xp_logs
    if (referenceId) {
      const { data: existingLog } = await supabase
        .from("xp_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("action_type", actionType)
        .eq("reference_id", String(referenceId))
        .maybeSingle();

      if (existingLog) {
        return { success: false, reason: "Already claimed" };
      }
    }

    // 2. Cek Batas Maksimal Harian (Daily Cap)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const maxDaily = DAILY_LIMITS[actionType] || 10;
    const { count: todayCount } = await supabase
      .from("xp_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action_type", actionType)
      .gte("created_at", todayStart.toISOString());

    if (todayCount !== null && todayCount >= maxDaily) {
      if (addToast) {
        addToast(`⚠️ Batas XP harian untuk ${ACTION_LABELS[actionType] || actionType} sudah tercapai (${maxDaily}/${maxDaily})`, "warning");
      }
      return { success: false, reason: "Daily limit reached" };
    }

    // 3. Simpan ke xp_logs untuk catatan permanen & anti-cheat
    const { error: logErr } = await supabase.from("xp_logs").insert([
      {
        user_id: userId,
        action_type: actionType,
        xp_amount: xpAmount,
        reference_id: referenceId ? String(referenceId) : null,
      },
    ]);

    if (logErr) {
      console.warn("⚠️ Perhatian: xp_logs gagal disimpan (cek RLS di Supabase):", logErr.message);
    }

    // 4. Ambil data user_stats saat ini
    let { data: stats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!stats) {
      const { data: newStats, error: createErr } = await supabase
        .from("user_stats")
        .insert([{ user_id: userId, level: 1, xp_total: 0 }])
        .select()
        .single();
      if (createErr) throw createErr;
      stats = newStats;
    }

    const currentXp = stats.xp_total || 0;
    const currentLevel = stats.level || 1;
    const newXpTotal = currentXp + xpAmount;

    // Hitung level baru berdasarkan xp_total
    const calculatedLevel = Math.floor(newXpTotal / 100) + 1;
    const newLevel = Math.max(currentLevel, calculatedLevel);
    const hasLeveledUp = newLevel > currentLevel;

    // Tentukan kolom counter yang akan di-increment
    const updates = {
      xp_total: newXpTotal,
      level: newLevel,
    };

    if (actionType === "comment" || actionType === "live_chat") {
      updates.comments_count = (stats.comments_count || 0) + 1;
    } else if (actionType === "watch_episode") {
      updates.episodes_watched = (stats.episodes_watched || 0) + 1;
    } else if (actionType === "read_chapter") {
      updates.chapters_read = (stats.chapters_read || 0) + 1;
    } else if (actionType === "like") {
      updates.likes_count = (stats.likes_count || 0) + 1;
    } else if (actionType === "bookmark") {
      updates.bookmarks_count = (stats.bookmarks_count || 0) + 1;
    }

    // 5. Update tabel user_stats
    await supabase
      .from("user_stats")
      .update(updates)
      .eq("user_id", userId);

    // 6. Jika Naik Level, Sinkronkan profiles.level & berikan Notifikasi Spesial
    if (hasLeveledUp) {
      await supabase
        .from("profiles")
        .update({ level: newLevel })
        .eq("id", userId);

      const rankTitle = getRankTitle(newLevel);
      if (addToast) {
        addToast(
          `🎉 Selamat! Kamu NAIK LEVEL ke Level ${newLevel}! Jabatan: ${rankTitle}`,
          "success"
        );
      }
    } else if (addToast) {
      addToast(`+${xpAmount} XP diperoleh! (${todayCount + 1}/${maxDaily} hari ini)`, "info");
    }

    return {
      success: true,
      leveledUp: hasLeveledUp,
      newLevel,
      newXpTotal,
    };
  } catch (error) {
    console.error("Gagal menambahkan XP:", error);
    return { success: false, error: error.message };
  }
};
