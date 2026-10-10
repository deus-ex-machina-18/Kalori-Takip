import sharp from 'sharp';
// Encoding only: preserve the generated source, publish a bounded 1024px albedo.
await sharp('assets/cat/white-fur-source.png').resize(1024,1024).jpeg({quality:92,chromaSubsampling:'4:4:4'}).toFile('public/models/white-fur-v1.jpg');
