require('dotenv').config();
const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const { connectDB, disconnectDB } = require('./database');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await connectDB(); // Koneksi ke database

  server.route(routes);
 
  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  disconnectDB(); // Tutup koneksi saat error
  process.exit(1);
});
 
init();