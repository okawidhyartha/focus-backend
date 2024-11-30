const { 
    refreshTokenHandler,
    addNewUserHandler, //sign up (table autentikasi)
    authenticationCheckHandler, //sign in, POST (table autentikasi)
    addTaskHandler, //tambah task baru (table task)
    defaultSettingHandler, //POST, setiap sign up, frontend masukin default settingnya

    getTasksByUsernameHandler, //munculin task per username (table task) 
    getSettingByUsernameHandler, //munculin setting terakhir (table setting)

    editTaskByIdHandler, //edit task (table autentikasi)
    updateActiveStatusHandler, // update task yg aktif atau yg jd focus
    updateSettingByUsernameHandler, //update setting (table setting)
    
    deleteTaskByIdHandler //hapus task berdasarkan id nya (table task)
  } = require('./handler'); //pakai{} karna dia fungsi
  
const routes = [
  {
    method: 'POST',
    path: '/refresh-token',
    handler: refreshTokenHandler,
    options: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/signup',
    handler: addNewUserHandler,
    options: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/signin',
    handler: authenticationCheckHandler,
    options: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/task',
    handler: addTaskHandler,
    options: {
      auth: 'jwt', 
    },
  },
  {
    method: 'POST',
    path: '/setting',
    handler: defaultSettingHandler,
    options: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/tasks/{username}',
    handler: getTasksByUsernameHandler,
    options: {
      auth: 'jwt', 
    },
  },
  {
    method: 'GET',
    path: '/setting/{username}',
    handler: getSettingByUsernameHandler,
    options: {
      auth: 'jwt', 
    },
  },
  {
    method: 'PUT',
    path: '/task/{id}',
    handler: editTaskByIdHandler,
    options: {
      auth: 'jwt', 
    },
  },
  {
    method: 'PUT',
    path: '/activetask/{id}',
    handler: updateActiveStatusHandler,
    options: {
      auth: 'jwt', 
    },
  },
  {
    method: 'PUT',
    path: '/setting/{username}',
    handler: updateSettingByUsernameHandler,
    options: {
      auth: 'jwt', 
    },
  },
  {
    method: 'DELETE',
    path: '/task/{id}',
    handler: deleteTaskByIdHandler,
    options: {
      auth: 'jwt', 
    },
  },
];

module.exports = routes;