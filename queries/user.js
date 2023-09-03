export const userQueries = {
  saveUser: `
    INSERT INTO 
      users (username, password) 
    VALUES
      ($1, $2)
  `,

  fetchAllUsers: `
    SELECT * FROM users WHERE username = $1;
  `
}
