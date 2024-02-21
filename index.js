const TelegramBot = require('node-telegram-bot-api');
const imageOverlay = require('./imagine.js')
require('dotenv').config()

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_TOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
// Matches "/addframe [whatever]"
bot.onText(/\/start/, (msg, match) => {
    const chatId = msg.chat.id;
    start(chatId);
    bot.sendMessage(process.env.TELEGRAM_CHANNEL,'Started chat : '+msg?.chat?.username)
});
bot.onText(/\/restart/, (msg, match) => {
    const chatId = msg.chat.id;
    start(chatId);
});
bot.onText(/\/help/, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
`Hello ${msg?.from?.first_name||'user'}, 
you can upload or add frame to your picture using this bot.

🌀To Add A Frame To Your Image:
    1. Start by clicking here \/start or clicking Menu->Start
    2. Click on Add Frame To My Image🖼,
    3. Enter a valid Frame Id (you can use frame id someone shared with you or you can create it by uploading a new frame
    4. Upload your image. For better results upload an image without a big difference in length and width
    5. Download the image and use it as Profile pic or DP
    
    ❗️When following above steps do not remove any reply to which is automatically appearing.

🌀To Create A New Frame    
    1. Start by clicking here \/start or clicking Menu->Start
    2. Click on pload a New Frame📲,
    3. Upload your frame (Strictly in PNG format).
    4. Bot will validate the image and process the Id.
        You can share this id with others if they want to use the same frame from this bot
    ⚠️Upload the frame as FILE ONLY. Keep the file size to <10MB (reccomended) ⚠️
    ❗️When following above steps do not remove any reply to which is automatically appearing.

    ✳️Use \/restart at any time to start over✳️
        `);
});
function start(chatId){
    bot.sendMessage(chatId, 'What would you like to do', {
        reply_markup: {
            //force_reply: true
            inline_keyboard
        }
    });
}
// Listen for any kind of message. There are different kinds of
// messages.
/*
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    console.log(msg);
    bot.sendMessage(process.env.TELEGRAM_CHANNEL, 'Channel message');
    //console.log('received ');

});
*/
async function sendImage(framelink,image,id,username) {
    try{
        printMemoryData(id,username);
        let img=await imageOverlay(image,framelink);
        let processedImage=await img.getBufferAsync(img._originalMime);
        await bot.sendMessage(id, 'Processing completed ⌛️⌛️⌛️ \nWe are uploading your image in this chat ⤴️💬⏱');
        let pic=await bot.sendDocument(id,processedImage, {caption: "Here we go !🚀🚀🚀 \nThis is the generated image✨💫✨" });
        bot.sendDocument(process.env.TELEGRAM_CHANNEL,pic?.document?.file_id, { caption:username+' from chat '+id });
        printMemoryData(id,username);
    }catch(e){
        bot.sendMessage(process.env.TELEGRAM_CHANNEL, 'ERROR!!!\nChat: '+id+'\nUser :'+username+'\n'+JSON.stringify(e));
        bot.sendMessage(id, 'Error occured: '+e.message);
        if(e.message.includes('is too big')){
            bot.sendMessage(id, 'Generated filesize is more than expected. Please try with a little smaller image');
        }
        printMemoryData(id,username);
    }
}
let inline_keyboard = [
    [
        {
            text: 'Upload a New Frame📲',
            callback_data: 'uploadframe'
        }

    ],
    [
        {
            text: 'Add Frame To My Image🖼',
            callback_data: 'addframe'
        }
    ]
];
bot.on('callback_query', async query => {
    const { message: { chat, message_id, text } = {} } = query
    //console.log('Selected ' + query.data);
    //console.log('message ' + JSON.stringify(query));
    let newmsg;
    switch (query.data) {
        case 'uploadframe':
            newmsg=await bot.sendMessage(chat.id, 'As Reply to this message, Upload the frame as file to get the Id.⬆️ /\n Next message will be automatically set as reply for this message.please do not remove it❗️❗️❗️ /n⚠️Upload the frame as FILE ONLY. Keep the file size to <10MB (reccomended) ⚠️/\n⚠️Remember, if you delete the uploaded frame, the frame may not be available for others after some time/days⚠️', {
                reply_markup: {
                    force_reply: true
                }
            });
            bot.onReplyToMessage(chat.id,newmsg.message_id,async (rep)=>{
                bot.sendMessage(chat.id, 'Picture uploaded successfully✅. Validating the image 🔍⏳🔍⏳🔍⏳');
                if(rep?.document?.mime_type=='image/png'){
                    bot.sendMessage(chat.id, 'Validated image successfully! ✅ \nPlease share below FRAME ID to use this frame: \n'+rep?.document?.file_id);
                    bot.sendDocument(process.env.TELEGRAM_CHANNEL,rep?.document?.file_id, { caption:rep?.chat?.username+' from chat '+rep?.chat?.id+'\nFileId: '+rep?.document?.file_id});
                }else{
                    bot.sendMessage(chat.id, 'Please upload a PNG Vector image as frame ❌ \n Please \/restart');
                }
            })
            break;
        case 'addframe':
            newmsg=await bot.sendMessage(chat.id, 'Send the frame Id you want to use ⏳⏳⏳', {
                reply_markup: {
                    force_reply: true
                }
            });
            bot.onReplyToMessage(chat.id,newmsg.message_id,async (rep)=>{
                //console.log('Message text '+ JSON.stringify(rep));
                bot.sendMessage(chat.id, 'Validating Frame Id: '+rep?.text+'🔍⏳🔍⏳🔍⏳');
                //validate frame here and reply
                let framelink=await validateFileId(rep?.text);
                if(framelink){
                    bot.sendMessage(chat.id, 'Frame Id available ✅✅✅');
                    let newmsg2=await bot.sendMessage(chat.id, 'Please upload your photo 🖼. \n ⚠️For better results upload a square picture 🟨', {
                        reply_markup: {
                            force_reply: true
                        }
                    });
                    bot.onReplyToMessage(chat.id,newmsg2.message_id,async (rep)=>{
                        let imageId=(rep?.document?.file_id)||((rep?.photo?.length>0)?(rep?.photo[0].file_id):false);
                        if(imageId ){
                            bot.sendMessage(chat.id, 'Processing. This may take few minutes based on the image size uploaded⏳⏳⏳');
                           const image= await bot.getFileLink(imageId);
                           sendImage(framelink,image,chat.id,rep?.chat?.username);
                           if(rep?.photo?.length>0){
                                bot.sendPhoto(process.env.TELEGRAM_CHANNEL,imageId, { caption:rep?.chat?.username+' from chat '+rep?.chat?.id});
                            }else if(rep?.document?.file_id){
                                bot.sendDocument(process.env.TELEGRAM_CHANNEL,imageId, { caption:rep?.chat?.username+' from chat '+rep?.chat?.id});
                            }

                        }else{
                            bot.sendMessage(chat.id, 'Please upload an image as reply to previous message or \/restart again');
                        }                       
                    })
                }else{
                    bot.sendMessage(chat.id, 'Invalid frame id or not available');
                }
                
            })
            break;
        default:
            bot.sendMessage(chat.id, 'WE DONT SERVE IT HERE ❌❌❌');
    }
});

async function validateFileId(fileId){
    let image;
    try{
        image= await bot.getFileLink(fileId);
        return image;
    }catch(e){
        //console.error(e);
        return null;
    }
}
function formatMemoryUsage(data){return `${Math.round(data / 1024 / 1024 * 100) / 100} MB`};
function printMemoryData(id,username){
    let memoryData = process.memoryUsage();

    let memoryUsage = {
        rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
        heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
        heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
        external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
      };
      //console.log(memoryUsage);
      bot.sendMessage(process.env.TELEGRAM_CHANNEL, 'Chat: '+id+'\nUser :'+username+'\n'+JSON.stringify(memoryUsage));
}


