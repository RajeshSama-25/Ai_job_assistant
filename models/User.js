import { query } from "../config/db.js";

export const createUser = async (full_name, email, password) => {
  const result = await query(
    `
    INSERT INTO users (full_name, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, full_name, email
    `,
    [full_name, email, password]
  );

  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  return result.rows[0];
};

export const findUserById = async (id) => {
  const result = await query(
    `
    SELECT id, full_name, email, role
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

export const updateUser = async (id, full_name, email) => {
  const result = await query(
    `
    UPDATE users
    SET
      full_name = $1,
      email = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING id, full_name, email
    `,
    [full_name, email, id]
  );

  return result.rows[0];
};