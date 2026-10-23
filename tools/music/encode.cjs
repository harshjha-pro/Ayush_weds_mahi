// WAV (mono 16-bit) -> MP3 with lamejs.
const fs = require("fs");
const vm = require("vm");
const ctx = {};
vm.runInNewContext(fs.readFileSync(__dirname + "/lame/package/lame.all.js", "utf8") + ";this.L = lamejs;", ctx);
const lamejs = ctx.L;
const [, , input, output, kbps = "96"] = process.argv;
const buf = fs.readFileSync(input);
const sr = buf.readUInt32LE(24);
let off = 12;
while (buf.toString("ascii", off, off + 4) !== "data") off += 8 + buf.readUInt32LE(off + 4);
const samples = new Int16Array(buf.buffer, buf.byteOffset + off + 8, buf.readUInt32LE(off + 4) / 2);
const enc = new lamejs.Mp3Encoder(1, sr, Number(kbps));
const parts = [];
for (let i = 0; i < samples.length; i += 1152) {
  const b = enc.encodeBuffer(samples.subarray(i, i + 1152));
  if (b.length) parts.push(Buffer.from(b));
}
parts.push(Buffer.from(enc.flush()));
fs.writeFileSync(output, Buffer.concat(parts));
console.log(output, (Buffer.concat(parts).length / 1024).toFixed(0) + " KB");
