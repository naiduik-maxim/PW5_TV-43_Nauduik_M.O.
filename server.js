const { request } = require("express");

const WebSocket = require('ws');
const wss = new WebSocket.Server({port: 8000});

console.log("WebSocket server started on ws://localhost:8000");

let peakW = 0;

function generateFactoryData(){
    const w1 = 10 * Math.random() * 3;
    const w2 = 8 * Math.random() * 2;
    const w3 = 5 * Math.random() * 4;

    const totalW = w1 + w2 + w3;

    if (totalW > peakW){
        peakW = totalW;
    }

    const tariff = 7.32;
    const cost = totalW * 1000 * tariff;

    return {
        timestamp: Date.now(),
        totalPower: totalW,
        workshops: {
            'Ливарний': w1,
            'Механоскладальний': w2,
            'Фарбувальний': w3
        },
        peakLoad: peakW,
        demandCoefficient: 0.75 + (Math.random() * 0.1),
        currentCost: cost,
        DailyCost: cost * 24
    };
};

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`Client connected: ${ip}`);

    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(generateFactoryData()));
        }
    }, 5000);

    ws.on('close', () => {
        console.log(`Client disconnected:: ${ip}`);
        clearInterval(interval);
    });
});