const { client } = require('./database');
const bcrypt = require('bcrypt');

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
        const response = h.response({
            status: 'success',
            message: 'Authentication successful',
            data: {
                user_name: username,
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
    const actual_cycle = 0;
    const complete_status = false;
    const active_status = false;
    const timestamp = new Date();

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
            user_name: username,
            task_baru: task_name,
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
    // const pomodoro = '25';
    // const short = '5';
    // const long = '15';
    // const alarm = 'alarm.mp3';
    // const backsound = 'backsound.mp3';

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

    const query = 'DELETE FROM task_pomodoro WHERE id = $1';
    const values = [id];

    try {
        const result = await client.query(query, values);

        if (result.rowCount > 0) {
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