import { esc, has, icon } from "../utils.js";

// Only appears when a music file is set in config.js. It never starts on its
// own: only this button, or the guest's tap on the opening intro while its
// sound switch is on, starts playback.
export function hasMusic(config) {
  return has(config.music?.src);
}

export function MusicControl(config) {
  if (!hasMusic(config)) return;

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
    }</span><span class="music-label" aria-hidden="true">Music</span><span class="music-bars" aria-hidden="true"><i></i><i></i><i></i></span>`;
  btn.innerHTML = label(false);
  document.body.append(btn);

  const set = (playing) => {
    btn.setAttribute("aria-pressed", String(playing));
    btn.classList.toggle("is-playing", playing);
    btn.innerHTML = label(playing);
  };

  const play = async () => {
    try {
      await audio.play();
      set(true);
      // A film playing with sound goes quiet (memories.js).
      document.dispatchEvent(new Event("invitation:music-playing"));
    } catch {
      set(false);
    }
  };

  btn.addEventListener("click", () => {
    if (audio.paused) play();
    else {
      audio.pause();
      set(false);
    }
  });
  // Sent by the intro from inside the guest's tap, so browsers allow playback.
  document.addEventListener("invitation:play-music", () => audio.paused && play());
  audio.addEventListener("pause", () => set(false));
  // ...and the music pauses when a guest turns a film's sound on.
  document.addEventListener("invitation:pause-music", () => audio.pause());
  // If the file is missing, remove the control instead of leaving a dead button.
  audio.addEventListener("error", () => btn.remove());
}
