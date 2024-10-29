const { 
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
        path: '/signup',
        handler: addNewUserHandler,
      },
      {
        method: 'POST',
        path: '/signin',
        handler: authenticationCheckHandler,
      },
      {
        method: 'POST',
        path: '/task',
        handler: addTaskHandler,
      },
      {
        method: 'POST',
        path: '/setting',
        handler: defaultSettingHandler,
      },
      {
        method: 'GET',
        path: '/tasks/{username}',
        handler: getTasksByUsernameHandler,
      },
      {
        method: 'GET',
        path: '/setting/{username}',
        handler: getSettingByUsernameHandler,
      },
      {
        method: 'PUT',
        path: '/task/{id}',
        handler: editTaskByIdHandler,
      },
      {
        method: 'PUT',
        path: '/activetask/{id}',
        handler: updateActiveStatusHandler,
      },
      {
        method: 'PUT',
        path: '/setting/{username}',
        handler: updateSettingByUsernameHandler,
      },
      {
        method: 'DELETE',
        path: '/task/{id}',
        handler: deleteTaskByIdHandler,
      },
     ];
      
     module.exports = routes;