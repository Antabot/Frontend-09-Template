const http = require('http');

http.createServer((request, response) => {
    console.log("request received");
    let body = [];
    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk.toString());
    }).on('end', () => {
        body = body.join("");
        console.log('request body:', body);
        response.setHeader('Content-Type', 'text/html');
        response.setHeader('X-FOO', 'bar');
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end(
`<html maaa=a >
<head>
    <style>
body div img#myid.mycls2{
    width: 100px;
    background-color: #ff5000;
}
body div img{
    width: 30px;
    background-color: #ff1111;
}
    </style>
</head>
<body>
    <div>
        <img id="myid" class="mycls1 mycls2"/>
        <img />
    </div>
</body>
</html>
`);
    });
}).listen(8088);

console.log('server started');