import { esc, has, icon } from "../utils.js";

// Only appears when a music file is set in config.js. Never autoplays.
export function MusicControl(config) {
  if (!has(config.music?.src)) return;

  const audio = new Audio();
  audio.preload = "none"; // nothing downloads until the guest presses play
  audio.loop = true;
  audio.src = config.music.src;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "music-btn";
  btn.setAttribute("aria-pressed", "false");
  const label = (playing) =>
    `${icon(playing ? "i-pause" : "i-music")}<span class="visually-hidden">${playing ? "Pause" : "Play"} music${
      has(config.music.title) ? `: ${esc(config.music.title)}` : ""
    }</span><span class="music-bars" aria-hidden="true"><i></i><i></i><i></i></span>`;
  btn.innerHTML = label(false);
  document.body.append(btn);

  const set = (playing) => {
    btn.setAttribute("aria-pressed", String(playing));
    btn.classList.toggle("is-playing", playing);
    btn.innerHTML = label(playing);
  };

  btn.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
        set(true);
      } catch {
        set(false);
      }
    } else {
      audio.pause();
      set(false);
    }
  });
  audio.addEventListener("pause", () => set(false));
  // If the file is missing, remove the control instead of leaving a dead button.
  audio.addEventListener("error", () => btn.remove());
}
