require('dotenv').config();
const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const { connectDB, disconnectDB } = require('./database');
const Jwt = require('@hapi/jwt'); // Mengimpor modul JWT dari Hapi

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

  // Daftarkan plugin JWT
  await server.register(Jwt);

  // Definisikan fungsi validasi JWT
  server.auth.strategy('jwt', 'jwt', {
    keys: process.env.JWT_SECRET, // Gunakan kunci rahasia dari variabel environment
    verify: {
      // Here you can add specific verification parameters like `algorithms`, `aud`, `iss`
      aud: 'audience',
      iss: 'issuer', // Expected issuer claim
      sub: false       // Tidak memvalidasi klaim 'sub' karena kamu hanya ingin membandingkannya
    },
    
    validate: async (decoded, request, h) => {
      // Validasi token, misalnya sub harus sesuai dengan username dalam payload
      if (decoded.sub === decoded.username) {
        return { isValid: true };  // Token valid jika sub sesuai dengan username
      }
      return { isValid: false };  // Token tidak valid jika sub tidak sesuai dengan username
    }
    
  });

  // Set strategi default untuk autentikasi JWT
  server.auth.default('jwt');

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