//util functions
const Events = function(){
    let that = this;
    const eventTable = {};
    this.eventTable = eventTable;
    this.on = function(type, cb){
        if(!(type in eventTable)){
            eventTable[type] = [];
        }
        eventTable[type].push(cb);
        return {
            fire:function(){
                cb.apply(arguments);
            },
            remove:function(){
                let l = eventTable[type];
                l.splice(l.indexOf(cb),1);//garbage collection
                if(l.length === 0){
                    delete eventTable[type];
                    return true;//all listeners removed
                }else{
                    return false;
                }
            }
        }
    };
    this.emit = function(type){
        const elist = eventTable[type] || [];
        for(let i = 0; i < elist.length; i++){
            elist[i].apply(this,[...arguments].slice(1));
        }
    };
    this.wait = function(type){
        return new Promise((res,rej)=>{
            let ev = that.on(type,(val)=>{
                res(val);
                ev.remove();
            });
        });
    };
};


//async utility
let LoadWaiter = function(){
    let queue = [];
    let waiting = true;
    this.ready = function(){
        return new Promise((res,rej)=>{
            if(waiting){
                queue.push(res);
            }else{
                res();
            }
        });
    };
    this.pause = function(){
        waiting = true;
    };
    this.resolve = function(){
        waiting = false;
        queue.map(cb=>cb());//resolve all
        queue = [];
    };
};

let Pause = function(t){
    return new Promise((res,rej)=>{
        setTimeout(res,t);
    });
};


//kinda sketch but works
class Pauser{
    pausing = false;
    callstack = [];
    waitcb;
    constructor(){
        //does nothing
    }
    wait(){
        let args = [... arguments];
        if(!this.pausing){
            return Promise.resolve(args);
        }
        let that = this;
        return new Promise((res,rej)=>{
            that.callstack.push({res,args});
            if(that.waitcb){
                that.waitcb();//call the resolver only once
                that.waitcb = null;
            }
        });
    }
    async pause(){
        this.pausing = true;
        let that = this;
        await new Promise((res,rej)=>{
            that.waitcb = res;
        });
        return this.callstack[0].args;
    }
    resume(){
        let args = [...arguments];
        this.pausing = false;
        this.callstack.map(({res})=>res(args));
        this.callstack = [];
    }
};

module.exports = {Events,LoadWaiter,Pause,Pauser};