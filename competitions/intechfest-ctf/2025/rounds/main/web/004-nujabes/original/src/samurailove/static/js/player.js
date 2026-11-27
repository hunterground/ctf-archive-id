document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll("[data-audio]");
  const player = document.getElementById("audio-player");
  const title = document.getElementById("audio-title");
  const artist = document.getElementById("audio-artist");
  const thumb = document.getElementById("audio-thumb");
  const playPauseBtn = document.getElementById("play-pause");
  const progress = document.getElementById("progress");

  let isPlaying = false;

  function setPlayIcon() {
    if (window.hash === "#beats") {
      playPauseBtn.innerHTML = urlParams.get("beats");
      lucide.createIcons();
    }
    playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
    lucide.createIcons();
  }

  function setPauseIcon() {
    playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
    lucide.createIcons();
  }

  cards.forEach((card) => {
    const playBtn = card.querySelector(".play-btn");

    playBtn.addEventListener("click", () => {
      const audioUrl = card.dataset.audio;
      const trackTitle = card.dataset.title;
      const trackArtist = card.dataset.artist;
      const img = card.querySelector("img");

      player.src = audioUrl;
      title.textContent = trackTitle;
      artist.textContent = trackArtist;
      thumb.src = img.src;

      player.play();
      isPlaying = true;
      setPauseIcon();
    });
  });

  playPauseBtn.addEventListener("click", () => {
    if (isPlaying) {
      player.pause();
      setPlayIcon();
    } else {
      player.play();
      setPauseIcon();
    }
    isPlaying = !isPlaying;
  });

  player.addEventListener("timeupdate", () => {
    const percent = (player.currentTime / player.duration) * 100;
    progress.value = percent || 0;
  });

  progress.addEventListener("input", () => {
    player.currentTime = (progress.value / 100) * player.duration;
  });
});
