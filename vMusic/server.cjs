var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_jiosaavn_sdk = require("jiosaavn-sdk");
var originalFetch = global.fetch;
global.fetch = function(input, init) {
  let urlStr = "";
  if (typeof input === "string") {
    urlStr = input;
  } else if (input && typeof input.url === "string") {
    urlStr = input.url;
  } else if (input && typeof input.toString === "function") {
    urlStr = input.toString();
  }
  if (urlStr.includes("jiosaavn.com")) {
    init = init || {};
    init.headers = init.headers || {};
    const headers = init.headers;
    const preferredLang = global.preferredLanguage || "english";
    const isSearchCall = urlStr.includes("search") || urlStr.includes("query") || urlStr.includes("q=");
    const languagesToUse = isSearchCall ? "english,hindi,punjabi,tamil,telugu,marathi,gujarati,bengali,kannada,malayalam" : preferredLang;
    headers["Cookie"] = `L=${encodeURIComponent(languagesToUse)}`;
    try {
      if (urlStr.includes("?")) {
        const [base, query] = urlStr.split("?");
        const params = new URLSearchParams(query);
        if (!params.has("languages")) {
          params.append("languages", languagesToUse);
          const newUrl = `${base}?${params.toString()}`;
          if (typeof input === "string") {
            input = newUrl;
          } else if (input && typeof input.url === "string") {
            input.url = newUrl;
          }
        }
      } else {
        const newUrl = `${urlStr}?languages=${encodeURIComponent(languagesToUse)}`;
        if (typeof input === "string") {
          input = newUrl;
        } else if (input && typeof input.url === "string") {
          input.url = newUrl;
        }
      }
    } catch {
    }
  }
  return originalFetch.call(this, input, init);
};
async function getNewReleasesUpTo(discoverService, target = 20) {
  const page1 = await discoverService.getNewReleases({ page: 1, limit: target });
  if (page1.length >= target) return page1.slice(0, target);
  const page2 = await discoverService.getNewReleases({ page: 2, limit: target });
  const seen = new Set(page1.map((item) => item.id));
  const merged = [...page1];
  for (const item of page2) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
    if (merged.length >= target) break;
  }
  return merged.slice(0, target);
}
async function enrichNewReleases(releases, albumService, songService) {
  return Promise.all(
    releases.map(async (item) => {
      if (item.artists?.primary?.length) return item;
      const subtitle = typeof item.subtitle === "string" ? item.subtitle.trim() : "";
      if (subtitle) return item;
      try {
        if (item.type === "album") {
          const album = await albumService.getAlbumById(item.id);
          return { ...item, artists: album.artists };
        }
        if (item.type === "song") {
          const songs = await songService.getSongByIds({ songIds: item.id });
          const full = songs[0];
          if (full) {
            return { ...item, artists: full.artists };
          }
        }
      } catch (err) {
        console.warn(`Failed to enrich new release ${item.id}:`, err);
      }
      return item;
    })
  );
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.use((req, res, next) => {
    const lang = req.query.lang || req.headers["x-user-language"] || "english";
    global.preferredLanguage = typeof lang === "string" ? lang.toLowerCase() : "english";
    next();
  });
  const searchService = new import_jiosaavn_sdk.SearchService();
  const songService = new import_jiosaavn_sdk.SongService();
  const discoverService = new import_jiosaavn_sdk.DiscoverService();
  const playlistService = new import_jiosaavn_sdk.PlaylistService();
  const albumService = new import_jiosaavn_sdk.AlbumService();
  const artistService = new import_jiosaavn_sdk.ArtistService();
  app.get("/api/discover", async (req, res) => {
    try {
      const [charts, newReleases, featuredPlaylists, topArtists] = await Promise.allSettled([
        discoverService.getCharts(),
        getNewReleasesUpTo(discoverService, 20),
        discoverService.getFeaturedPlaylists({ limit: 20 }),
        discoverService.getTopArtists()
      ]);
      let releases = newReleases.status === "fulfilled" ? newReleases.value : [];
      if (releases.length > 0) {
        releases = await enrichNewReleases(releases, albumService, songService);
      }
      res.json({
        charts: charts.status === "fulfilled" ? charts.value : [],
        newReleases: releases,
        featuredPlaylists: featuredPlaylists.status === "fulfilled" ? featuredPlaylists.value : [],
        topArtists: topArtists.status === "fulfilled" ? topArtists.value : []
      });
    } catch (error) {
      console.error("Discover API Error:", error);
      res.status(500).json({ error: "Failed to retrieve discovery data" });
    }
  });
  app.get("/api/search", async (req, res) => {
    const q = req.query.q;
    if (!q) {
      return res.status(400).json({ error: "Query parameter q is required" });
    }
    try {
      const meloUrl = `https://meloapi.vercel.app/api/search?query=${encodeURIComponent(q)}`;
      const meloRes = await fetch(meloUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (meloRes.ok) {
        const json = await meloRes.json();
        if (json && json.success && json.data) {
          return res.json(json.data);
        }
      }
    } catch (meloErr) {
      console.warn("MeloAPI global search failed, falling back to SDK:", meloErr);
    }
    try {
      const results = await searchService.searchAll(q);
      res.json(results);
    } catch (error) {
      console.error("Search API Error:", error);
      res.status(500).json({ error: error.message || "Search operations failed" });
    }
  });
  app.get("/api/search/songs", async (req, res) => {
    const q = req.query.q;
    const limit = parseInt(req.query.limit || "20", 10);
    const page = parseInt(req.query.page || "1", 10);
    if (!q) {
      return res.status(400).json({ error: "Query parameter q is required" });
    }
    try {
      const meloUrl = `https://meloapi.vercel.app/api/search/songs?query=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
      const meloRes = await fetch(meloUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (meloRes.ok) {
        const json = await meloRes.json();
        if (json && json.success && json.data) {
          return res.json(json.data);
        }
      }
    } catch (meloErr) {
      console.warn("MeloAPI songs search failed, falling back to SDK:", meloErr);
    }
    try {
      const results = await searchService.searchSongs({ query: q, page, limit });
      res.json(results || []);
    } catch (error) {
      console.error("Search Songs API Error:", error);
      res.status(500).json({ error: error.message || "Song search failed" });
    }
  });
  app.get("/api/search/albums", async (req, res) => {
    const q = req.query.q;
    const limit = parseInt(req.query.limit || "20", 10);
    const page = parseInt(req.query.page || "1", 10);
    if (!q) {
      return res.status(400).json({ error: "Query parameter q is required" });
    }
    try {
      const meloUrl = `https://meloapi.vercel.app/api/search/albums?query=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
      const meloRes = await fetch(meloUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (meloRes.ok) {
        const json = await meloRes.json();
        if (json && json.success && json.data) {
          return res.json(json.data);
        }
      }
    } catch (meloErr) {
      console.warn("MeloAPI albums search failed, falling back to SDK:", meloErr);
    }
    try {
      const results = await searchService.searchAlbums({ query: q, page, limit });
      res.json(results || []);
    } catch (error) {
      console.error("Search Albums API Error:", error);
      res.status(500).json({ error: error.message || "Album search failed" });
    }
  });
  app.get("/api/search/artists", async (req, res) => {
    const q = req.query.q;
    const limit = parseInt(req.query.limit || "20", 10);
    const page = parseInt(req.query.page || "1", 10);
    if (!q) {
      return res.status(400).json({ error: "Query parameter q is required" });
    }
    try {
      const meloUrl = `https://meloapi.vercel.app/api/search/artists?query=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
      const meloRes = await fetch(meloUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (meloRes.ok) {
        const json = await meloRes.json();
        if (json && json.success && json.data) {
          return res.json(json.data);
        }
      }
    } catch (meloErr) {
      console.warn("MeloAPI artists search failed, falling back to SDK:", meloErr);
    }
    try {
      const results = await searchService.searchArtists({ query: q, page, limit });
      res.json(results || []);
    } catch (error) {
      console.error("Search Artists API Error:", error);
      res.status(500).json({ error: error.message || "Artist search failed" });
    }
  });
  app.get("/api/search/playlists", async (req, res) => {
    const q = req.query.q;
    const limit = parseInt(req.query.limit || "20", 10);
    const page = parseInt(req.query.page || "1", 10);
    if (!q) {
      return res.status(400).json({ error: "Query parameter q is required" });
    }
    try {
      const meloUrl = `https://meloapi.vercel.app/api/search/playlists?query=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
      const meloRes = await fetch(meloUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (meloRes.ok) {
        const json = await meloRes.json();
        if (json && json.success && json.data) {
          return res.json(json.data);
        }
      }
    } catch (meloErr) {
      console.warn("MeloAPI playlists search failed, falling back to SDK:", meloErr);
    }
    try {
      const results = await searchService.searchPlaylists({ query: q, page, limit });
      res.json(results || []);
    } catch (error) {
      console.error("Search Playlists API Error:", error);
      res.status(500).json({ error: error.message || "Playlist search failed" });
    }
  });
  app.get("/api/songs/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const songs = await songService.getSongByIds({ songIds: id });
      if (!songs || songs.length === 0) {
        return res.status(404).json({ error: "No songs found with this ID" });
      }
      res.json(songs[0]);
    } catch (error) {
      const statusCode = error?.statusCode === 404 ? 404 : 500;
      if (statusCode === 404) {
        return res.status(404).json({ error: "Song not found" });
      }
      console.error("Get Song API Error:", error);
      res.status(statusCode).json({ error: error.message || "Retrieving song failed" });
    }
  });
  app.get("/api/lyrics", async (req, res) => {
    const track_name = req.query.track_name;
    const artist_name = req.query.artist_name;
    const album_name = req.query.album_name || "";
    const duration = parseFloat(req.query.duration);
    if (!track_name?.trim() || !artist_name?.trim() || !duration || duration < 1) {
      return res.status(400).json({
        error: "track_name, artist_name, and duration (seconds) are required"
      });
    }
    const params = new URLSearchParams({
      track_name: track_name.trim(),
      artist_name: artist_name.trim(),
      album_name: album_name.trim(),
      duration: String(Math.round(duration))
    });
    const lrclibHeaders = {
      "User-Agent": "web-player/1.0 (local-dev)",
      Accept: "application/json"
    };
    try {
      let response = await fetch(`https://lrclib.net/api/get-cached?${params}`, {
        headers: lrclibHeaders
      });
      if (response.status === 404) {
        response = await fetch(`https://lrclib.net/api/get?${params}`, {
          headers: lrclibHeaders
        });
      }
      if (response.status === 404) {
        return res.status(404).json({ error: "Lyrics not found for this track" });
      }
      if (!response.ok) {
        return res.status(502).json({ error: "LRCLIB request failed" });
      }
      const data = await response.json();
      res.json({
        plainLyrics: data.plainLyrics ?? null,
        syncedLyrics: data.syncedLyrics ?? null,
        instrumental: Boolean(data.instrumental)
      });
    } catch (error) {
      console.error("Lyrics API Error:", error);
      res.status(500).json({ error: "Failed to fetch lyrics" });
    }
  });
  app.get("/api/songs/:id/suggestions", async (req, res) => {
    const id = req.params.id;
    const limit = parseInt(req.query.limit || "10", 10);
    try {
      const suggestions = await songService.getSongSuggestions({ songId: id, limit });
      res.json(suggestions || []);
    } catch (error) {
      console.error("Get Suggestions API Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch recommendations" });
    }
  });
  app.get("/api/playlists/:id", async (req, res) => {
    const id = req.params.id;
    const limit = parseInt(req.query.limit || "25", 10);
    const page = parseInt(req.query.page || "1", 10);
    try {
      const playlist = await playlistService.getPlaylistById({ id, limit, page });
      res.json(playlist);
    } catch (error) {
      console.error("Get Playlist API Error:", error);
      res.status(500).json({ error: error.message || "Retrieving playlist failed" });
    }
  });
  app.get("/api/albums/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const album = await albumService.getAlbumById(id);
      res.json(album);
    } catch (error) {
      console.error("Get Album API Error:", error);
      res.status(500).json({ error: error.message || "Retrieving album failed" });
    }
  });
  app.get("/api/artists/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const meloUrl = `https://meloapi.vercel.app/api/artists/${id}`;
      const meloRes = await fetch(meloUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (meloRes.ok) {
        const json = await meloRes.json();
        if (json && json.success && json.data) {
          return res.json(json.data);
        }
      }
    } catch (meloErr) {
      console.warn("MeloAPI artist fetch failed, falling back to SDK:", meloErr);
    }
    try {
      const artist = await artistService.getArtistById({
        artistId: id,
        page: 1,
        songCount: 50,
        albumCount: 15,
        sortBy: "popularity",
        sortOrder: "desc"
      });
      res.json(artist || null);
    } catch (error) {
      console.error("Get Artist API Error:", error);
      res.status(500).json({ error: error.message || "Retrieving artist failed" });
    }
  });
  app.get("/api/artists/:id/songs", async (req, res) => {
    const id = req.params.id;
    const page = parseInt(req.query.page || "1", 10);
    try {
      const meloUrl = `https://meloapi.vercel.app/api/artists/${id}/songs?page=${page}`;
      const meloRes = await fetch(meloUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (meloRes.ok) {
        const json = await meloRes.json();
        if (json && json.success && json.data) {
          return res.json(json.data);
        }
      }
    } catch (meloErr) {
      console.warn("MeloAPI artist songs fetch failed, falling back to SDK:", meloErr);
    }
    try {
      const songs = await artistService.getArtistSongs({
        artistId: id,
        page,
        sortBy: "popularity",
        sortOrder: "desc"
      });
      res.json(songs || []);
    } catch (error) {
      console.error("Get Artist Songs API Error:", error);
      res.status(500).json({ error: error.message || "Retrieving artist songs failed" });
    }
  });
  app.get("/api/artists/:id/albums", async (req, res) => {
    const id = req.params.id;
    const page = parseInt(req.query.page || "1", 10);
    try {
      const meloUrl = `https://meloapi.vercel.app/api/artists/${id}/albums?page=${page}`;
      const meloRes = await fetch(meloUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (meloRes.ok) {
        const json = await meloRes.json();
        if (json && json.success && json.data) {
          return res.json(json.data);
        }
      }
    } catch (meloErr) {
      console.warn("MeloAPI artist albums fetch failed, falling back to SDK:", meloErr);
    }
    try {
      const albums = await artistService.getArtistAlbums({
        artistId: id,
        page,
        sortBy: "popularity",
        sortOrder: "desc"
      });
      res.json(albums || []);
    } catch (error) {
      console.error("Get Artist Albums API Error:", error);
      res.status(500).json({ error: error.message || "Retrieving artist albums failed" });
    }
  });
  app.get("/api/stream", async (req, res) => {
    const streamUrl = req.query.url;
    if (!streamUrl) {
      return res.status(400).json({ error: "url parameter is required" });
    }
    try {
      const decodedUrl = decodeURIComponent(streamUrl);
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.jiosaavn.com/"
      };
      if (req.headers.range) {
        headers["range"] = req.headers.range;
      }
      const audioRes = await fetch(decodedUrl, {
        headers,
        redirect: "follow"
      });
      if (!audioRes.ok && audioRes.status !== 206) {
        return res.status(audioRes.status).send("Failed to fetch stream");
      }
      res.statusCode = audioRes.status;
      const copyHeaders = [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges"
      ];
      for (const h of copyHeaders) {
        const val = audioRes.headers.get(h);
        if (val) {
          res.setHeader(h, val);
        }
      }
      if (audioRes.body) {
        const reader = audioRes.body.getReader();
        const pump = async () => {
          try {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              return;
            }
            res.write(Buffer.from(value));
            await pump();
          } catch (pumpErr) {
            console.error("Pump error:", pumpErr);
            res.end();
          }
        };
        await pump();
      } else {
        res.status(500).send("No audio body available");
      }
    } catch (err) {
      console.error("Audio stream proxy error:", err);
      if (!res.headersSent) {
        res.status(500).send("Error streaming media: " + err.message);
      }
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Node applet fullstack server listening on http://127.0.0.1:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
