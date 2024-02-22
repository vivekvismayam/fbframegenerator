var Jimp = require("jimp");

async function imageOverlay(imageMain, frameImg) { // Function name is same as of filename
   let fbStdSize=Number(process.env.TELEGRAM_OUTPUTSIZE);
   // Reading original image
   let frame = await Jimp.read(frameImg);
   // Reading watermark Image
   let image = await Jimp.read(imageMain);
      image =  image.resize(fbStdSize, fbStdSize); // Resizing watermark image   
      frame =  frame.resize(fbStdSize, fbStdSize); // Resizing frame image       
   frame.composite(image, 0, 0, {
      mode: Jimp.BLEND_DESTINATION_OVER,
      opacityDest: 1,
      opacitySource: 1
   })
   //await frame.writeAsync('generated.png');
   //console.log("Image is processed successfully "+frame._originalMime);
   return frame;
}
//Exports---------------------------------
module.exports = imageOverlay;
