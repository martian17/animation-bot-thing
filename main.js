const Discord = require("discord.js");
let {Events,LoadWaiter,Pause,Pauser} = require("./async-util.js");
let got = import("got");


let getClient = function(Discord){
    let flags = Discord.Intents.FLAGS;
    const client = new Discord.Client({
        intents: [
            flags.GUILDS, flags.GUILD_MESSAGES
        ] /*["GUILDS", "GUILD_MESSAGES"]*/
    });

    /*
    let wrapper = Object.create(client);

    let evts = {};
    let targets = "ready,message".split(",");
    targets.map(t=>{
        evts[t] = [];
        client.on(t,function(a,b,c,d,e,f){
            evts[t].map(cb=>{
                console.log("cb called");
                cb(a,b,c,d,e,f)
            });
        });
    });
    client.on = function(evt,cb){
        evts[evt].push(cb)
    };*/
    return client;
};


const client = getClient(Discord);
require('dotenv').config();
client.login(process.env.TOKEN);


let dist = function([x1,y1],[x2,y2]){
    let dx = x2-x1;
    let dy = y2-y1;
    return Math.sqrt(dx*dx+dy*dy);
};

let getBall = function(r){
    let str = "";
    let w = 100;
    let h = 19;
    let hm = 2.4150994452712755;//height handicap

    let th = h*hm;//true height;
    let by = th/2;
    let bx = 100*r;
    let bc = [[bx-w,by],[bx,by],[bx+w,by]];

    for(let i = 0; i < h; i++){
        for(let j = 0; j < w; j++){
            let x = j;
            let y = i*hm;
            let inside = false;
            for(let i = 0; i < bc.length; i++){
                let [bx,by] = bc[i];
                inside |= dist([x,y],[bx,by]) < 12;
                //console.log(dist([x,y],[bx,by]));
            }
            str += inside?".":"#";
        }
        if(i !== h-1)str += "\n";
    }
    return `\`\`\`\n${str}\n\`\`\``;
};

console.log(getBall(0.1));




let Bot = require("./bot.js");

let main = async function(){
    let bot = (new Bot(client,"."));


    let initmsgs = [];
    bot.onReady(()=>{
        console.log(`Logged in as ${client.user.tag}!`);
        /*const guilds = bot.client.guilds.cache;
        initmsgs.push("guilds: "+JSON.stringify(guilds.map(g=>g.name)));
        //sending it to every channels
        guilds.map(guild=>{
            //GUILD_CATEGORY
            //GUILD_CATEGORY
            //GUILD_TEXT
            //GUILD_VOICE
            guild.channels.cache.filter(channel=>{
                channel.type === "GUILD_TEXT";
            }).map(channel=>{
                console.log(channel.type);
                channel.send(initmsgs.join("\n"));
            });
        });*/
    });
    got = (await got).got;

    let ball = bot.sub("ball").addFunc(async (msg,substr)=>{
        let args = substr.split(" ").map(s=>parseFloat(s.trim()));
        let sent = await msg.channel.send(".");

        let start = Date.now();
        for(let i = 0; i < 30; i++){
            await Pause(100);
            let dt = Date.now()-start;
            //sent = await sent.edit(getBall(i/30));
            sent = msg.channel.send(getBall((dt/5000)%1)+(i===29?"finished":""));
        }

        /*
        let start = Date.now();
        for(let i = 0; i < 30; i++){
            let dt = Date.now()-start;
            //sent = await sent.edit(getBall(i/30));
            sent = await sent.edit(getBall((dt/5000)%1)+(i===29?"finished":""));
        }*/

        /*let str = "this is a test message, I'm trying to adkfasd.:)";
        for(let i = 1; i < str.length+1; i++){
            await Pause(100);
            console.log(i);
            sent = await sent.edit(str.slice(0,i));
        }*/
    });

    bot.sub("run").addFunc(async (msg,substr)=>{
        let code = substr.trim();
        let lang = "js"
        if(code.slice(0,3) === "```" && code.slice(-3) === "```"){
            code = code.slice(3,-3);
            let lines = code.split("\n");
            if(lines.length > 1){
                if(lines[0].length !== 0)lang = lines[0].trim();
                lines = lines.slice(1);
            }
            code = lines.join("\n");
        }else if(code.slice(0,1) === "`" && code.slice(-1) === "`"){
            code = code.slice(1,-1);
        }
        //msg.reply("running the code\n"+`\`\`\`${lang}\n${code}\`\`\``);
        console.log("got the code");
        console.log(code);
        let result;
        try{
            result = await got.post("https://emkc.org/api/v1/piston/execute",{
                json: {
                    language:lang,
                    source:code
                }
            }).json();
        }catch(err){
            msg.reply("Error connecting to the server");
            console.log(err);
            return;
        }
        msg.reply(("```\n"+result.output.slice(0,1992)+"\n```"));
        /*if(result.ran){
            msg.reply("Execution Success\n```\n"+result.output+"\n```");
        }else{
            //msg.reply("Your code did not run\n"+JSON.stringify(result,null,4));
            msg.reply("Your code did not run\n```\n"+result.output+"\n```");
        }*/
        console.log(result);
    });
};

main();