const { client } = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const refreshTokenHandler = async (request, h) => {
    const { refreshToken } = request.payload; // Ambil Refresh Token dari request body

    if (!refreshToken) {
        const response = h.response({
            status: 'fail',
            message: 'Refresh token is required',
        });
        response.code(400);
        return response;
    }

    try {
        // Verifikasi Refresh Token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH);
        const username = decoded.username; // Ambil username dari decoded token

        // Periksa apakah refresh token ada di database
        const query = 'SELECT refresh_token FROM autentikasi_pomodoro WHERE username = $1';
        const values = [username]; // Gunakan username yang sudah didapatkan dari decoded token
        const result = await client.query(query, values);

        if (result.rows.length === 0 || result.rows[0].refresh_token !== refreshToken) {
            // Jika refresh token tidak ada di database atau tidak cocok
            return h.response({ status: 'fail', message: 'Invalid refresh token' }).code(401);
        }

        // Jika Refresh Token valid, buat Access Token baru
        const accessToken = jwt.sign(
            { 
                sub: decoded.username,  // Klaim sub diisi dengan username dari decoded Refresh Token
                username: decoded.username
            }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: '1h',  // Access Token expired dalam 1 jam
                audience: 'audience',
                issuer: 'issuer'
            }
        );

        // Kembalikan Access Token baru
        const response = h.response({
            status: 'success',
            message: 'Token refreshed successfully',
            data: {
                token: accessToken, // Kirimkan Access Token baru kepada client
            },
        });
        response.code(200);
        return response;

    } catch (error) {
        const response = h.response({
            status: 'fail',
            message: 'Invalid or expired refresh token',
        });
        response.code(401);
        return response;
    }
};

const addNewUserHandler = async (request, h) => {
    const { username, password } = request.payload;

    const checkQuery = 'SELECT * FROM autentikasi_pomodoro WHERE username = $1';
    const checkValues = [username];
     
    try {
        const checkResult = await client.query(checkQuery, checkValues);

        // Jika username sudah ada
        if (checkResult.rows.length > 0) {
            const response = h.response({
                status: 'fail',
                message: 'Username sudah terdaftar',
            });
            response.code(400);
            return response;
        }
        
        // Hash password menggunakan bcrypt sebelum menyimpannya ke database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Jika username belum ada, lakukan insert
        const insertQuery = 'INSERT INTO autentikasi_pomodoro(username, password) VALUES($1, $2)';
        const insertValues = [username, hashedPassword];
      
        await client.query(insertQuery, insertValues);
        const response = h.response({
            status: 'success',
            message: 'User baru berhasil ditambahkan',
            data: {
                user_name: username,
                // pass_word: password,
            },
        });
        response.code(201);
        return response;

    } catch (error) {
        console.error('Error inserting new user', error.stack);
        const response = h.response({
            status: 'fail',
            message: 'Gagal menambahkan user baru',
        });
        response.code(500);
        return response;
    }
};

const authenticationCheckHandler = async (request, h) => {
    const { username, password } = request.payload;
   
    const query = 'SELECT * FROM autentikasi_pomodoro WHERE username = $1';
    const values = [username];
     
    try {
        const result = await client.query(query, values);
        // Kondisi 1: Username tidak ditemukan
        if (result.rows.length === 0) {
            const response = h.response({
                status: 'fail',
                message: 'Username tidak ditemukan',
            });
            response.code(404);
            return response;
        }

        const user = result.rows[0];

        // Kondisi 2: Password tidak cocok
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            const response = h.response({
                status: 'fail',
                message: 'Wrong password',
            });
            response.code(401);
            return response;
        }

        // Jika username ditemukan dan password cocok
        // Buat Access Token
        const accessToken = jwt.sign(
            { 
                sub: user.username,  // Klaim sub diisi dengan username atau ID pengguna
                username: user.username 
            }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: '10s',  // Token akan kedaluwarsa dalam 1 jam
                audience: 'audience', // Menambahkan audience pada token
                issuer: 'issuer' // Menambahkan issuer pada token
            }
        );

        // Buat Refresh Token (lebih lama expired-nya)
        const refreshToken = jwt.sign(
            { 
                sub: user.username,
                username: user.username
            }, 
            process.env.JWT_REFRESH, 
            { 
                expiresIn: '7d',  // Refresh token expired dalam 7 hari
                audience: 'audience',
                issuer: 'issuer'
            }
        );

        // Simpan refresh token di database (biasanya lebih baik disimpan di tabel user atau tabel refresh_tokens)
        const updateQuery = 'UPDATE autentikasi_pomodoro SET refresh_token = $1 WHERE username = $2';
        const updateValues = [refreshToken, username];
        await client.query(updateQuery, updateValues); // Update refresh token

        const response = h.response({
            status: 'success',
            message: 'Authentication successful',
            data: {
                user_name: user.username,
                access_token: accessToken,  // Kirimkan Access Token ke client
                refresh_token: refreshToken // Kirimkan Refresh Token ke client
            },
        });
        response.code(200);
        return response;

    } catch (error) {
        console.error('Error during authentication', error.stack);
        const response = h.response({
            status: 'error',
            message: 'Terjadi kesalahan saat melakukan autentikasi',
        });
        response.code(500);
        return response;
    }
};

const addTaskHandler = async (request, h) => {
    const { username, task_name, target_cycle } = request.payload;
    // Ambil username dari token JWT yang sudah didekode
    const decodedUsername = request.auth.credentials.username;
    // Bandingkan username dalam body dengan username dalam token
    if (username !== decodedUsername) {
        return h.response({ message: 'Username tidak cocok dengan token' }).code(403);
    }

    if (!username || !task_name || target_cycle == undefined) {
        const response = h.response({
            status: 'fail',
            message: 'Missing required fields',
        });
        response.code(400);
        return response;
    }

    const default_actual_cycle = 0;
    const default_complete_status = false;
    const default_active_status = false;
    const default_timestamp = new Date();

    const actual_cycle = request.payload.actual_cycle || default_actual_cycle;
    const complete_status = request.payload.complete_status !== undefined ? request.payload.complete_status : default_complete_status;
    const active_status = request.payload.active_status !== undefined ? request.payload.active_status : default_active_status;
    const timestamp = request.payload.timestamp || default_timestamp;

    const query = 'INSERT INTO task_pomodoro(username, task_name, actual_cycle, target_cycle, complete_status, active_status, timestamp) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id';
    const values = [username, task_name, actual_cycle, target_cycle, complete_status, active_status, timestamp];
     
    try {
      const result = await client.query(query, values);

      const taskId = result.rows[0].id;

      const response = h.response({
          status: 'success',
          message: 'Task baru berhasil ditambahkan',
          data: {
            task_id: taskId,
            username: username,
            task_name: task_name,
            target_cycle: target_cycle,
            actual_cycle: actual_cycle,
            complete_status: complete_status,
            active_status: active_status,
            timestamp: timestamp,
          },
      });
      response.code(201);
      return response;

    } catch (error) {
        console.error('Error inserting new task', error.stack);
        const response = h.response({
            status: 'fail',
            message: 'Gagal menambahkan task baru',
        });
        response.code(500);
        return response;
    }
};

const defaultSettingHandler = async (request, h) => {
    const { username, pomodoro, short, long, alarm, backsound } = request.payload;
    
    const checkQuery = 'SELECT * FROM setting_pomodoro WHERE username = $1';
    const checkValues = [username];

    try {
        const result = await client.query(checkQuery, checkValues);

        // Jika username sudah terdaftar, kirim respons gagal
        if (result.rows.length > 0) {
            return h.response({
                status: 'fail',
                message: 'Setting untuk username ini sudah terdaftar',
            }).code(400); // Bad Request
        }

        // Jika username belum ada, lakukan insert
        const query = 'INSERT INTO setting_pomodoro(username, pomodoro, short, long, alarm, backsound) VALUES($1, $2, $3, $4, $5, $6)';
        const values = [username, pomodoro, short, long, alarm, backsound];
     
        await client.query(query, values);
        const response = h.response({
            status: 'success',
            message: 'Default setting berhasil',
            data: {
                user_name: username
            },
        });
        response.code(201);
        return response;

    } catch (error) {
        console.error('Error inserting new setting', error.stack);
        const response = h.response({
            status: 'fail',
            message: 'Default setting gagal',
        });
        response.code(500);
        return response;
    }
};

const getTasksByUsernameHandler = async (request, h) => {
    const { username } = request.params;

    const decodedUsername = request.auth.credentials.username;
    if (username !== decodedUsername) {
        return h.response({ message: 'Username tidak cocok dengan token' }).code(403);
    }
    const query = 'SELECT * FROM task_pomodoro WHERE username = $1';
    const values = [username];
       
    try {
        const { rows } = await client.query(query, values);

        if (rows.length > 0) {
            return {
                status: 'success',
                data: rows,
            };
        }

        const response = h.response({
            status: 'fail',
            message: 'Gagal mendapat tasks. Username tidak ditemukan',
        });
        response.code(404);
        return response;
        
    } catch (error) {
        console.error('Error retrieving tasks', error.stack);
        const response = h.response({
            status: 'error',
            message: 'Terjadi kesalahan saat mendapatkan tasks',
        });
        response.code(500);
        return response;
    }
};

const getSettingByUsernameHandler = async (request, h) => {
    const { username } = request.params;

    const decodedUsername = request.auth.credentials.username;
    if (username !== decodedUsername) {
        return h.response({ message: 'Username tidak cocok dengan token' }).code(403);
    }
    const query = 'SELECT * FROM setting_pomodoro WHERE username = $1';

    try {
        const { rows } = await client.query(query, [username]);

        if (rows.length > 0) {
            return {
                status: 'success',
                data: rows,
            };
        }

        const response = h.response({
            status: 'fail',
            message: 'Gagal menampilkan setting. Username tidak ditemukan',
        });
        response.code(404);
        return response;

    } catch (error) {
        console.error('Error retrieving settings', error.stack);
        const response = h.response({
            status: 'error',
            message: 'Terjadi kesalahan saat menampilkan setting',
        });
        response.code(500);
        return response;
    }
};

const editTaskByIdHandler = async (request, h) => {
    const { id } = request.params;
    const { username, task_name, actual_cycle, target_cycle, complete_status} = request.payload;
   
    const decodedUsername = request.auth.credentials.username;
    if (username !== decodedUsername) {
        return h.response({ message: 'Username tidak cocok dengan token' }).code(403);
    }

    const selectQuery = 'SELECT username FROM task_pomodoro WHERE id = $1';
    const selectvalues = [id];

    const selectResult = await client.query(selectQuery, selectvalues);

    if (selectResult.rowCount === 0) {
        const response = h.response({
            status: 'fail',
            message: 'Task tidak ditemukan',
        });
        response.code(404);
        return response;
    }

    if (selectResult.rows[0].username !== username) {
        return h.response({ message: 'Username tidak sesuai dengan ID Task' }).code(403);
    }

    const query = 'UPDATE task_pomodoro SET username = $1, task_name = $2, actual_cycle = $3, target_cycle = $4, complete_status = $5 WHERE id = $6';
    const values = [username, task_name, actual_cycle, target_cycle, complete_status, id];
     
    try {
        const result = await client.query(query, values);
        
        if (result.rowCount > 0) {
            const response = h.response({
                status: 'success',
                message: 'Task berhasil diperbarui',
            });
            response.code(200);
            return response;
        }
        
        const response = h.response({
            status: 'fail',
            message: 'Gagal memperbarui task. Id tidak ditemukan',
        });
        response.code(404);
        return response;

    } catch (error) {
        console.error('Error updating task', error.stack);
        const response = h.response({
            status: 'error',
            message: 'Terjadi kesalahan saat memperbarui task',
        });
        response.code(500);
        return response;
    }    
};

const updateActiveStatusHandler = async (request, h) => {
    const { id } = request.params;
    const { username } = request.payload;

    const decodedUsername = request.auth.credentials.username;
    if (username !== decodedUsername) {
        return h.response({ message: 'Username tidak cocok dengan token' }).code(403);
    }
    //semua task milik username ini menjadi tidak aktif
    const deactivateQuery = 'UPDATE task_pomodoro SET active_status = false WHERE username = $1';
    const deactivateValues = [username];
     
    try {
        await client.query(deactivateQuery, deactivateValues);
        //set task yang ingin diaktifkan menjadi aktif
        const activateQuery = 'UPDATE task_pomodoro SET active_status = true WHERE id = $1';
        const activateValues = [id];

        const result = await client.query(activateQuery, activateValues);

        if (result.rowCount > 0) {
            return {
                status: 'success',
                message: 'Task berhasil diaktifkan, dan task lain dinonaktifkan.',
            };
        }

        const response = h.response({
            status: 'fail',
            message: 'Gagal memperbarui active status. Id tidak ditemukan',
        });
        response.code(404);
        return response;

    } catch (error) {
        console.error('Error updating active status', error.stack);
        const response = h.response({
            status: 'fail',
            message: 'Terjadi kesalahan saat memperbarui active status',
        });
        response.code(500);
        return response;
    }    
};

const updateSettingByUsernameHandler = async (request, h) => {
    const { username } = request.params;

    const decodedUsername = request.auth.credentials.username;
    if (username !== decodedUsername) {
        return h.response({ message: 'Username tidak cocok dengan token' }).code(403);
    }
    const { pomodoro, short, long, alarm, backsound } = request.payload;
   
    const query = 'UPDATE setting_pomodoro SET pomodoro = $1, short = $2, long = $3, alarm = $4, backsound = $5 WHERE username = $6';
    const values = [pomodoro, short, long, alarm, backsound, username];
     
    try {
        const result = await client.query(query, values);
        
        if (result.rowCount > 0) {
            const response = h.response({
                status: 'success',
                message: 'Setting berhasil diperbarui',
            });
            response.code(200);
            return response;
        }
        
        const response = h.response({
            status: 'fail',
            message: 'Gagal memperbarui setting. Username tidak ditemukan',
        });
        response.code(404);
        return response;

    } catch (error) {
        console.error('Error updating setting', error.stack);
        const response = h.response({
            status: 'error',
            message: 'Terjadi kesalahan saat memperbarui setting',
        });
        response.code(500);
        return response;
    }    
};

const deleteTaskByIdHandler = async (request, h) => {
    const { id } = request.params;

    // Query untuk mendapatkan username berdasarkan id task
    const selectQuery = 'SELECT username FROM task_pomodoro WHERE id = $1';
    const values = [id];

    const selectResult = await client.query(selectQuery, values);

    if (selectResult.rowCount === 0) {
        const response = h.response({
            status: 'fail',
            message: 'Task tidak ditemukan',
        });
        response.code(404);
        return response;
    }

    const decodedUsername = request.auth.credentials.username;
    if (selectResult.rows[0].username !== decodedUsername) {
        return h.response({ message: 'Username tidak cocok dengan token' }).code(403);
    }

    try {
        const deleteQuery = 'DELETE FROM task_pomodoro WHERE id = $1';
        const deleteResult = await client.query(deleteQuery, values);

        if (deleteResult.rowCount > 0) {
            const response = h.response({
                status: 'success',
                message: 'Task berhasil dihapus',
            });
            response.code(200);
            return response;
        }

        const response = h.response({
            status: 'fail',
            message: 'Task gagal dihapus. Id tidak ditemukan',
        });
        response.code(404);
        return response;

    } catch (error) {
        console.error('Error deleting task', error.stack);
        const response = h.response({
            status: 'error',
            message: 'Terjadi kesalahan saat menghapus task',
        });
        response.code(500);
        return response;
    }
};

module.exports = {
    refreshTokenHandler,
    addNewUserHandler, //sign up (table autentikasi)
    authenticationCheckHandler, //sign in, POST (table autentikasi)
    addTaskHandler, //tambah task baru (table task)
    defaultSettingHandler, //POST, setiap sign up, frontend masukin default settingnya

    getTasksByUsernameHandler, //utk munculin task per username (table task) 
    getSettingByUsernameHandler, //utk munculin setting terakhir (table setting)

    editTaskByIdHandler, //edit task (table autentikasi)
    updateActiveStatusHandler, // update task yg aktif atau yg jd focus
    updateSettingByUsernameHandler, //utk update setting (table setting)

    deleteTaskByIdHandler //utk hapus task berdasarkan id nya (table task)
};