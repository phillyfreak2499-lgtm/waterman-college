/*
 * Quad score bridge — loaded by every Quad game.
 *
 * The games keep their results in localStorage with their own keys and shapes.
 * This bridge (running inside the game, same origin as the app) reports two
 * things to the parent COGS window via postMessage, which the GameFrame relays
 * to the server so a Specialist's Locker can show their Quad activity:
 *
 *   { type: 'cogs:quad', slug, opened: true }  on load        -> counts a play
 *   { type: 'cogs:quad', slug, score: <int> }  on leave/hide  -> best/last score
 *
 * A game can also report explicitly at any time: window.QuadScore.report(123).
 *
 * Everything is best-effort and wrapped so it can never throw into or slow down
 * the game. If a game persists nothing recognizable, only the play is recorded.
 */
(function () {
  "use strict";
  var slug = "";
  try {
    var m = String(location.pathname).match(/\/games\/([a-z0-9-]+)\.html$/i);
    slug = m ? m[1] : "";
  } catch (e) {}
  if (!slug) return;

  var ORIGIN = location.origin;
  function post(payload) {
    try {
      (window.parent || window).postMessage(
        Object.assign({ type: "cogs:quad", slug: slug }, payload),
        ORIGIN,
      );
    } catch (e) {}
  }

  // Snapshot localStorage so we can tell which keys THIS game wrote.
  var baseline = {};
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      baseline[k] = localStorage.getItem(k);
    }
  } catch (e) {}

  var SCORE_KEY = /score|best|high|points|pts|xp|streak|level|stars|coins|wins|correct/i;
  function scan(value, out) {
    if (out.length > 500) return;
    if (typeof value === "number") {
      if (isFinite(value) && value >= 0 && value <= 1e9) out.push(value);
      return;
    }
    if (typeof value === "string") {
      var n = Number(value);
      if (value.trim() !== "" && isFinite(n) && n >= 0 && n <= 1e9) out.push(n);
      return;
    }
    if (value && typeof value === "object") {
      for (var key in value) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
        if (SCORE_KEY.test(key)) scan(value[key], out);
        else if (value[key] && typeof value[key] === "object") scan(value[key], out);
      }
    }
  }

  // Best score-like number among the keys this game added or changed.
  function extractScore() {
    var nums = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var v = localStorage.getItem(k);
        if (baseline[k] === v) continue; // unchanged since load — not from this session
        var parsed;
        try {
          parsed = JSON.parse(v);
        } catch (e) {
          parsed = v;
        }
        var scoped = {};
        scoped[k] = parsed;
        scan(scoped, nums);
      }
    } catch (e) {}
    return nums.length ? Math.max.apply(null, nums) : null;
  }

  var lastSent = null;
  function sync() {
    var score = extractScore();
    if (score == null || score === lastSent) return;
    lastSent = score;
    post({ score: score });
  }

  // Explicit API for games that want to report a precise score.
  window.QuadScore = {
    report: function (score) {
      var n = Number(score);
      if (isFinite(n) && n >= 0 && n <= 1e9) {
        lastSent = n;
        post({ score: Math.round(n) });
      }
    },
  };

  // Count the play once the game has loaded.
  if (document.readyState === "complete" || document.readyState === "interactive") {
    post({ opened: true });
  } else {
    window.addEventListener("DOMContentLoaded", function () {
      post({ opened: true });
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") sync();
  });
  window.addEventListener("pagehide", sync);
})();
