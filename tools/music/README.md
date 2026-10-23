# Background music

`assets/audio/raag-bhupali.mp3` is an original piece made for this site: a
tanpura drone with a santoor-style melody in Raag Bhupali, built with additive
synthesis (no samples), so it carries no third-party rights.

To regenerate it (needs Python with numpy, and Node):

```bash
python3 compose.py raag-bhupali.wav
npm pack lamejs@1.2.1 && mkdir -p lame && tar -xzf lamejs-1.2.1.tgz -C lame
node encode.cjs raag-bhupali.wav ../../assets/audio/raag-bhupali.mp3 96
```

lamejs (LGPL-3.0) is only used here to encode the file; it is not part of the website.
