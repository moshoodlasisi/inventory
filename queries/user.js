export const userQueries = {
  saveUser: `
    INSERT INTO 
      test_user (name) 
    VALUES
      ($1)
  `,

  fetchAllUsers: `
    SELECT * FROM test_user;
  `
}
