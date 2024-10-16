const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const eventHeaders = {
  "Content-Type": "text/event-stream",
  Connection: "keep-alive",
  "Cache-Control": "no-cache",
};

const PORT = 3000;

let clients = [];
const messages = [];

app.get("/status", (_, response) => response.json({ clients: clients.length }));

app.get("/events", (request, response) => {
  response.writeHead(200, eventHeaders);
  response.write(`data: ${JSON.stringify(messages)}\n\n`);

  const clientId = uuidv4();

  clients.push({
    id: clientId,
    response,
  });

  request.on("close", () => {
    console.log(`Connection closed [${clientId}]`);
    clients = clients.filter((client) => client.id !== clientId);
  });
});

const broadcast = (message) => {
  clients.forEach((client) =>
    client.response.write(`data: ${JSON.stringify(message)}\n\n`)
  );
};

app.post("/message", async ({ body }, respsonse) => {
  messages.push(body);
  respsonse.json(body);
  return broadcast(body);
});

app.listen(PORT, () => {
  console.log(`SSE message server listening at http://localhost:${PORT}`);
});
