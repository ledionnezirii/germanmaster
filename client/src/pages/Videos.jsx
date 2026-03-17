"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Play,
  Volume2,
} from "lucide-react";
import logo from "../../public/logo.png";
import api, { videoService } from "../services/api";

const levelColors = {

};

const LEVELS = [];

function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 rounded-3xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-12 h-12 rounded">
            <img src={logo} className="border rounded-4xl" />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              gjuhagjermane
            </span>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
            {"Video Mësime"}
          </span>
        </nav>
      </div>
    </header>
  );
}

function VideoCard({ video, done, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      <div className="relative aspect-video">
        <img
          src={`https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5 shadow-lg">
            <Play className="h-5 w-5 text-gray-900 fill-gray-900" />
          </div>
        </div>
        {done && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow">
            <CheckCircle className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${levelColors[video.level] || "bg-gray-100 text-gray-600"}`}
          >
            {video.level}
          </span>
          <span className="text-[10px] text-gray-400">
            {video.subtitles?.length || 0} titra
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}

function PlayerView({ video, onBack, activeSub, done, marking, onMarkFinished }) {
  return (
    <div className="min-h-screen bg-gray-50">
   
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="inline-flex items-center bg-gray-300 p-1 rounded-4xl gap-1.5 text-gray-700 hover:text-gray-900 cursor-pointer mb-5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {"Kthehu te mësimet"}
        </button>

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
           
            <h1 className="text-xl font-bold text-gray-900 mt-2 text-balance">
              {video.title}
            </h1>
            {video.description && (
              <p className="text-gray-500 text-sm mt-1">{video.description}</p>
            )}
          </div>
          <button
            onClick={onMarkFinished}
            disabled={done || marking}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              done
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 cursor-default"
                : "bg-gray-900 hover:bg-gray-800 text-white"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {done ? "E përfunduar" : marking ? "Duke ruajtur..." : "Shëno si të përfunduar"}
          </button>
        </div>

        <div className="rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video w-full">
          <div id="yt-player" className="w-full h-full" />
        </div>

        <div className="mt-4 min-h-[72px] bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center text-center">
          {activeSub ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <Volume2 className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-lg font-semibold text-gray-900">{activeSub.german}</p>
              </div>
              <p className="text-sm text-blue-600">{activeSub.albanian}</p>
            </>
          ) : (
            <div className="flex items-center gap-2 text-gray-300">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs">{"Titrat shfaqen këtu gjatë luajtjes së videos"}</span>
            </div>
          )}
        </div>

        {video.subtitles?.length > 0 && (
          <div className="mt-5 bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">{"Të gjitha titrat"}</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {video.subtitles.map((s, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border transition-colors text-sm ${
                    activeSub === s ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <span className="text-[10px] text-gray-400 font-mono">
                    {s.start}s - {s.end}s
                  </span>
                  <p className="text-gray-900 font-medium text-sm">{s.german}</p>
                  <p className="text-blue-600 text-xs">{s.albanian}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSub, setActiveSub] = useState(null);
  const [marking, setMarking] = useState(false);
  const [finishedVideos, setFinishedVideos] = useState([]);
  const [activeLevel, setActiveLevel] = useState("All");

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    videoService.getFinishedVideos().then((response) => {
      const ids = (response.data || []).map((id) => String(id));
      setFinishedVideos(ids);
    });
  }, []);

  useEffect(() => {
    api.get("/videos")
      .then((response) => {
        setVideos(response.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedVideo) return;
    clearInterval(intervalRef.current);
    setCurrentTime(0);
    setActiveSub(null);

    const initPlayer = () => {
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = new window.YT.Player("yt-player", {
        videoId: selectedVideo.youtubeVideoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            intervalRef.current = setInterval(() => {
              if (playerRef.current?.getCurrentTime) {
                setCurrentTime(playerRef.current.getCurrentTime());
              }
            }, 300);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => clearInterval(intervalRef.current);
  }, [selectedVideo]);

  useEffect(() => {
    if (!selectedVideo?.subtitles) return;
    const match = selectedVideo.subtitles.find(
      (s) => currentTime >= s.start && currentTime <= s.end
    );
    setActiveSub(match || null);
  }, [currentTime, selectedVideo]);

  const isFinished = (id) => finishedVideos.includes(String(id));

  const markFinished = async () => {
    if (!selectedVideo) return;
    setMarking(true);
    await videoService.markVideoFinished(selectedVideo._id);
    const id = String(selectedVideo._id);
    setFinishedVideos((prev) => prev.includes(id) ? prev : [...prev, id]);
    setMarking(false);
  };

  const filteredVideos = activeLevel === "All"
    ? videos
    : videos.filter((v) => v.level === activeLevel);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <PlayerView
        video={selectedVideo}
        onBack={() => {
          setSelectedVideo(null);
          clearInterval(intervalRef.current);
        }}
        currentTime={currentTime}
        activeSub={activeSub}
        done={isFinished(selectedVideo._id)}
        marking={marking}
        onMarkFinished={markFinished}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* Level filter buttons */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveLevel("All")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeLevel === "All"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            Video te ndryshme
          </button>
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeLevel === lvl
                  ? `${levelColors[lvl]} font-bold`
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-12">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              done={isFinished(video._id)}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </div>
        {filteredVideos.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{"Asnjë video nuk u gjet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}