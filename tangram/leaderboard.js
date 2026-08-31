(function () {
  "use strict";

  var SUPABASE_URL = "https://bpyvdmuzyahweevfrqym.supabase.co";
  var SUPABASE_KEY = "sb_publishable_sxlTrJ89UFJBEmRlvGTrfg_xQZk6zct";
  var GAME_ID = "tangram";

  var client = null;
  function getClient() {
    if (!client && window.supabase) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return client;
  }

  // Fire-and-forget: a slow/offline connection should never block gameplay.
  function submitScore(stageId, playerName, elapsedSeconds, stars, percent) {
    var c = getClient();
    if (!c || !playerName) return Promise.resolve();
    return c.rpc("record_score", {
      p_game: GAME_ID,
      p_stage_id: stageId,
      p_player_name: playerName,
      p_elapsed: elapsedSeconds,
      p_stars: stars == null ? null : stars,
      p_percent: percent == null ? null : percent
    }).then(function (res) {
      if (res.error) throw res.error;
    }).catch(function (err) {
      console.warn("leaderboard submit failed", err);
    });
  }

  function topScores(stageId, limit) {
    var c = getClient();
    if (!c) return Promise.resolve([]);
    return c
      .from("game_scores")
      .select("player_name, elapsed_seconds, stars")
      .eq("game", GAME_ID)
      .eq("stage_id", stageId)
      .order("elapsed_seconds", { ascending: true })
      .limit(limit || 5)
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data || [];
      })
      .catch(function (err) {
        console.warn("leaderboard fetch failed", err);
        return [];
      });
  }

  window.Leaderboard = { submitScore: submitScore, topScores: topScores };
})();
