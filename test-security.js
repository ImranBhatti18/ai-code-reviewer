const apiKey = "sk-12345-hardcoded-secret-key";

function getUser(db, userId) {
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  return db.execute(query);
}
function runCommand(userInput) {
  return eval(userInput);
}
