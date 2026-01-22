-- Update the user role to 'admin' for the specified email
UPDATE users
SET role = 'admin'
WHERE email = 'victormg2021@gmail.com';

-- Verify the change (optional, just returns the updated row)
SELECT * FROM users WHERE email = 'victormg2021@gmail.com';
