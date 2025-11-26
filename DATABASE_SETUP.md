# Database Setup Instructions

## Problem

The application is trying to connect with user `veltro_admin` but the password is incorrect/unknown.

## Solution: Create a New MySQL User

### Step 1: Access MySQL

Choose one of the following methods based on your setup:

#### Option A: Using Laravel Sail (Docker)

If you're using Laravel Sail, access MySQL through the Docker container:

```bash
# Access MySQL container
./vendor/bin/sail mysql

# Or if using docker-compose directly
docker-compose exec mysql mysql -u root -p
```

The root password should be the same as your `DB_PASSWORD` in the `.env` file.

#### Option B: Local MySQL Installation

If MySQL is installed locally on your machine:

```bash
# Access MySQL with root user
mysql -u root -p

# Or if you have another admin user
mysql -u your_admin_user -p
```

#### Option C: MySQL Workbench or phpMyAdmin

- **MySQL Workbench**: Connect using your existing credentials
- **phpMyAdmin**: Access through your web browser if installed

### Step 2: Execute SQL Commands

Once you're connected to MySQL, run the following commands:

```sql
-- Create the new user (replace 'your_secure_password_here' with your actual secure password)
CREATE USER IF NOT EXISTS 'veltro_app'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant all privileges on the veltro_db database
GRANT ALL PRIVILEGES ON veltro_db.* TO 'veltro_app'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;
```

**Important**: Replace `'your_secure_password_here'` with a strong password of your choice.

Alternatively, you can execute the SQL script file:

```bash
# If using Sail
./vendor/bin/sail mysql < database/create_user.sql

# If using local MySQL
mysql -u root -p < database/create_user.sql
```

**Note**: You'll need to edit `database/create_user.sql` first to replace the placeholder password.

### Step 3: Update .env File

After creating the user, update your `.env` file with the new credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=veltro_db
DB_USERNAME=veltro_app
DB_PASSWORD=your_secure_password_here
```

### Step 4: Test the Connection

Test the database connection using Laravel:

```bash
php artisan db:show
```

Or test with a simple query:

```bash
php artisan tinker
# Then in tinker:
DB::connection()->getPdo();
```

## Troubleshooting

### If you can't access MySQL as root:

1. **Try resetting MySQL root password** (if you have system admin access):
    - Stop MySQL service
    - Start MySQL in safe mode
    - Reset root password
    - Restart MySQL service

2. **Check if there's another admin user**:

    ```sql
    SELECT User, Host FROM mysql.user WHERE Super_priv = 'Y';
    ```

3. **If using Laravel Sail**, the root password is set from your `.env` file's `DB_PASSWORD` variable.

### If the database doesn't exist:

Create it first:

```sql
CREATE DATABASE IF NOT EXISTS veltro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Alternative: Reset Existing User Password

If you prefer to keep using `veltro_admin`, you can reset its password:

```sql
ALTER USER 'veltro_admin'@'localhost' IDENTIFIED BY 'new_password_here';
FLUSH PRIVILEGES;
```

Then update `.env` with the new password.



