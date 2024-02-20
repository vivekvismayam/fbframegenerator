var Jimp = require("jimp");

async function imageOverlay(imageMain,frameImg) { // Function name is same as of filename
     // Reading original image
     let frame = await Jimp.read(frameImg);
     //console.log(frame);
     let frameheight=Number(frame?.bitmap?.height);
     let frameWidth=Number(frame?.bitmap?.width);
     console.log('frameheight: '+frameheight)

    // Reading watermark Image
       let image = await Jimp.read(imageMain);
       console.log(image);
       let height=Number(image?.bitmap?.height);
       console.log('height: '+height)
       image = image.resize(frameWidth,frameheight); // Resizing watermark image
   
       frame.composite(image, 0, 0, {
          mode: Jimp.BLEND_DESTINATION_OVER,
          opacityDest: 1,
          opacitySource: 1
       })
       //await frame.writeAsync('generated.png');
       console.log("Image is processed successfully "+frame._originalMime);
       return frame;
    }
    //Exports---------------------------------
module.exports = imageOverlay;
