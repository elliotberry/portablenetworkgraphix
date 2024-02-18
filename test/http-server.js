import serveStatic from "serve-static";
import http from "http";
import connect from "connect";

let app = connect();
let server = http.createServer(app);

app.use(serveStatic("test"));

server.listen(8000);

export default () => {
  server.close();
};

console.log("Tests available at http://localhost:8000/");
