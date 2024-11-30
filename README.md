# API Documentation

## 1. JWT Token

### Getting new access token
- **Method**: POST
- **Path**: /refresh-token
- **Request Body**: 
  *REQUIRED*:  
  - `refreshToken`: string
- **Response**:
  - **201**: Berhasil mendapat token baru
    ```
    {
        "status": "success",
        "message": "Token refreshed successfully",
        "data": {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXNy"
        }
    }
    ```
  - **401**: Invalid refresh token
    ```
    {
        "status": "fail",
        "message": "Invalid or expired refresh token"
    }
    ```

---

## 2. User Management

### Sign Up
- **Method**: POST
- **Path**: /signup
- **Request Body**:
  - `username`: string
  - `password`: string
- **Response**:
  - **201**: User baru berhasil ditambahkan
    ```
    {
        "status": "success",
        "message": "User baru berhasil ditambahkan",
        "data": {
            "user_name": "selna"
        }
    }
    ```
  - **400**: Username sudah terdaftar
    ```
    {
        "status": "fail",
        "message": "Username sudah terdaftar"
    }
    ```

### Sign In
- **Method**: POST
- **Path**: /signin
- **Request Body**:
  - `username`: string
  - `password`: string
- **Response**:
  - **200**: Authentication successful
    ```
    {
        "status": "success",
        "message": "Authentication successful",
        "data": {
            "user_name": "selna",
            "access_token": "yZXNodG9rZW4yIiwidXNlcm5hbWUiOiJ0ZXNyZWZyZXNodG9rZW4yIi",
            "refresh_token": "JleHAiOjE3MzI5ODc2MjYsImF1ZCI6ImF1ZGllbmNlIiwiaXNzIjoi"
        }
    }
    ```
  - **404**: Username tidak ditemukan
    ```
    {
        "status": "fail",
        "message": "Username tidak ditemukan"
    }
    ```
  - **401**: Password salah
    ```
    {
        "status": "fail",
        "message": "Wrong password"
    }
    ```

---

## 3. Task Management

### Add Task
- **Method**: POST
- **Path**: /task
- **Header**:  
  `Authorization`: `Bearer <TOKEN>`
- **Request Body**:  
  *REQUIRED*:  
  - `username`: string
  - `task_name`: string
  - `target_cycle`: integer  

  *OPTIONAL*:  
  - `actual_cycle` : integer
  - `complete_status` : boolean
  - `active_status` : boolean
  - `timestamp` : timestamp ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Response**:
  - **201**: Task baru berhasil ditambahkan
    ```
    {
        "status": "success",
        "message": "Task baru berhasil ditambahkan",
        "data": {
            "task_id": 45,
            "username": "aaaa",
            "task_name": "kerja abcde",
            "target_cycle": 3,
            "actual_cycle": 0,
            "complete_status": false,
            active_status: false,
            "timestamp": "2024-11-23T07:42:58.348Z"
        }
    }
    ```
  - **400**: Username / Task Name / Target Cycle belum diisi
    ```
    {
        "status": "fail",
        "message": "Missing required fields"
    }
    ```

### Get Tasks by Username
- **Method**: GET
- **Path**: /tasks/{username}
- **Header**:  
  `Authorization`: `Bearer <TOKEN>`
- **Response**:
  - **200**: Berhasil mendapatkan tasks
    ```
    {
        "status": "success",
        "data": [
            {
                "id": 18,
                "username": "selna",
                "task_name": "kerja abcde",
                "actual_cycle": "0",
                "target_cycle": "4",
                "complete_status": false,
                "active_status": false,
                "timestamp": "2024-11-22T07:55:33.696Z"
            }
        ]
    }
    ```
  - **404**: Username tidak ditemukan
    ```
    {
        "status": "fail",
        "message": "Gagal mendapat tasks. Username tidak ditemukan"
    }
    ```

### Edit Task by ID
- **Method**: PUT
- **Path**: /task/{id}
- **Header**:  
  `Authorization`: `Bearer <TOKEN>`
- **Request Body**:
  - `username`: string
  - `task_name`: string
  - `actual_cycle`: integer
  - `target_cycle`: integer
  - `complete_status`: boolean
- **Response**:
  - **200**: Task berhasil diperbarui
    ```
    {
        "status": "success",
        "message": "Task berhasil diperbarui"
    }
    ```
  - **403**: Username tidak sesuai dengan ID Task
    ```
    {
        "status": "fail",
        "message": "Username tidak sesuai dengan ID Task"
    }
    ```
  - **404**: Id tidak ditemukan
    ```
    {
        "status": "fail",
        "message": "Gagal memperbarui task. Id tidak ditemukan"
    }
    ```

### Update Active Status (by ID Task)
- **Method**: PUT
- **Path**: /activetask/{id}
- **Header**:  
  `Authorization`: `Bearer <TOKEN>`
- **Request Body**:
  - `username`: string
- **Response**:
  - **200**: Task berhasil diaktifkan
    ```
    {
        "status": "success",
        "message": "Task berhasil diaktifkan, dan task lain dinonaktifkan."
    }
    ```
  - **404**: Id tidak ditemukan
    ```
    {
        "status": "fail",
        "message": "Gagal memperbarui active status. Id tidak ditemukan"
    }
    ```

### Delete Task by ID
- **Method**: DELETE
- **Path**: /task/{id}
- **Header**:  
  `Authorization`: `Bearer <TOKEN>`
- **Response**:
  - **200**: Task berhasil dihapus
    ```
    {
        "status": "success",
        "message": "Task berhasil dihapus"
    }
    ```
  - **404**: Id tidak ditemukan
    ```
    {
        "status": "fail",
        "message": "Task gagal dihapus. Id tidak ditemukan"
    }
    ```

---

## 4. Settings Management

### Default Settings
- **Method**: POST
- **Path**: /setting
- **Request Body**:
  - `username`: string
  - `pomodoro`: string
  - `short`: string
  - `long`: string
  - `alarm`: string
  - `backsound`: string
- **Response**:
  - **201**: Default setting berhasil
    ```
    {
        "status": "success",
        "message": "Default setting berhasil",
        "data": {
            "user_name": "selna"
        }
    }
    ```
  - **500**: Default setting gagal
    ```
    {
        "status": "fail",
        "message": "Default setting gagal"
    }
    ```

### Get Setting by Username
- **Method**: GET
- **Path**: /setting/{username}
- **Header**:  
  `Authorization`: `Bearer <TOKEN>`
- **Response**:
  - **200**: Berhasil mendapatkan setting
    ```
    {
        "status": "success",
        "data": [
            {
                "username": "selna",
                "pomodoro": "25",
                "short": "4",
                "long": "10",
                "alarm": "string",
                "backsound": "string"
            }
        ]
    }
    ```
  - **404**: Username tidak ditemukan
    ```
    {
        "status": "fail",
        "message": "Gagal menampilkan setting. Username tidak ditemukan"
    }
    ```

### Update Setting by Username
- **Method**: PUT
- **Path**: /setting/{username}
- **Header**:  
  `Authorization`: `Bearer <TOKEN>`
- **Request Body**:
  - `pomodoro`: string
  - `short`: string
  - `long`: string
  - `alarm`: string
  - `backsound`: string
- **Response**:
  - **200**: Setting berhasil diperbarui
    ```
    {
        "status": "success",
        "message": "Setting berhasil diperbarui"
    }
    ```
  - **404**: Username tidak ditemukan
    ```
    {
        "status": "fail",
        "message": "Gagal memperbarui setting. Username tidak ditemukan"
    }
    ```

---

## Catatan
- Untuk update task, ada 2 macam:
  1. **Edit task by ID**: untuk update `task_name`, `target_cycle`, `actual_cycle`, `complete_status`. Untuk di-fetch setiap:
     - User update lalu klik save
     - Perubahan actual cycle setiap 1 siklus timer selesai

  2. **Update active status**: untuk memastikan hanya 1 task aktif per username, update active status akan di-fetch setiap user klik atau fokus ke salah satu task.
  3. **Default Setting**: setting awal yang akan masuk ke akun baru. Front end tentukan isi data default, lalu kirim data setting default ini setiap ada yg sign-up
