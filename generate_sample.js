const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

console.log("Generating sample video...");

ffmpeg()
    .input('color=c=blue:s=1280x720')
    .inputFormat('lavfi')
    .output('sample.mp4')
    .duration(3)
    .videoCodec('libx264')
    .on('end', () => console.log('Created sample.mp4'))
    .on('error', (e) => console.error(e))
    .run();
