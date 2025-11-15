import app from "./app";
import env from "./config/env";

const server = app.listen(env.port, () => {
  console.log(`API pronta em http://localhost:${env.port}`);
});

const gracefulShutdown = () => {
  server.close(() => {
    console.log("Servidor finalizado com segurança.");
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

