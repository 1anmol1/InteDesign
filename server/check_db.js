const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Project = require('./models/Project');
const VisionBoard = require('./models/VisionBoard');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const projects = await Project.find();
  let base64ProjectCount = 0;
  for (const p of projects) {
    if (p.images.some(img => img.startsWith('data:image'))) {
      base64ProjectCount++;
    }
  }

  const boards = await VisionBoard.find();
  let base64BoardCount = 0;
  for (const b of boards) {
    if (b.images.some(img => img.url?.startsWith('data:image') || img.thumb?.startsWith('data:image'))) {
      base64BoardCount++;
    }
  }

  console.log(`Projects with base64: ${base64ProjectCount}`);
  console.log(`Boards with base64: ${base64BoardCount}`);
  process.exit(0);
});
