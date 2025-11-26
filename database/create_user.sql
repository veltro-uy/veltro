-- SQL script to create a new MySQL user for the Veltro application
-- Execute this script as a MySQL administrator (root user)
-- Create the new user (replace 'your_secure_password_here' with your actual password)
CREATE USER IF NOT EXISTS 'veltro_app' @'localhost' IDENTIFIED BY 'your_secure_password_here';
-- Grant all privileges on the veltro database
GRANT ALL PRIVILEGES ON veltro.* TO 'veltro_app' @'localhost';
-- Apply the changes
FLUSH PRIVILEGES;
-- Verify the user was created
SELECT User,
    Host
FROM mysql.user
WHERE User = 'veltro_app';