import express from 'express';
import path from "path"
import expressWebSocket from "express-ws";
import ffmpeg from "fluent-ffmpeg";
import webSocketStream from "websocket-stream";
import os from "os"

function getLocalIP() {
    const ifaces = os.networkInterfaces();
    let locatIp = '';
    for (let dev in ifaces) {
        if (dev === 'WLAN' || dev === '本地连接' || dev === '以太网') {
            for (let j = 0; j < ifaces[dev].length; j++) {
                if (ifaces[dev][j].family === 'IPv4') {
                    locatIp = ifaces[dev][j].address;
                    break;
                }
            }
        }
    }
    return locatIp;
}

function localServer() {
    let port = 8888;
    let app = express();
    const dirname = path.resolve() + "\\..\\html";

    app.use(express.static(dirname));

    expressWebSocket(app, null, {
        perMessageDeflate: true
    });

    app.ws("/rtsp/", rtspRequestHandle)
    app.listen(port);

    let localIp = getLocalIP();
    console.log("express listened " + `http://${localIp}:${port}`)
}

function rtspRequestHandle(ws, req) {
    console.log("rtsp request handle");
    const stream = webSocketStream(ws, {
        binary: true,
        browserBufferTimeout: 1000000
    }, {
        browserBufferTimeout: 1000000
    });

    let url = req.query.url;
    console.log("rtsp url:", url);
    console.log("rtsp params:", req.params);

    try {
        ffmpeg(url)
            .addInputOption("-rtsp_transport", "tcp", "-buffer_size", "102400")  // 这里可以添加一些 RTSP 优化的参数
            .on("start", function () {
                console.log(url, "Stream started.");
            })
            .on("codecData", function () {
                console.log(url, "Stream codecData.")
                // 摄像机在线处理
            })
            .on("error", function (err) {
                console.log(url, "An error occured: ", err.message);
            })
            .on("end", function () {
                console.log(url, "Stream end!");
                // 摄像机断线的处理
            })
            .outputFormat("flv").videoCodec("copy").noAudio().pipe(stream);
    } catch (error) {
        console.log(error);
    }
}

localServer();