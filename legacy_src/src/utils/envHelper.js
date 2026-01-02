const fs = require('fs').promises;
const path = require('path');

const updateEnvFileAsync = async (updates) => {
  // .env is at root (../../.env from src/utils)
  const envPath = path.resolve(__dirname, '../../.env');
  let envContent = await fs.readFile(envPath, 'utf-8');

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null) continue;

    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
    process.env[key] = value;
  }

  await fs.writeFile(envPath, envContent);
  console.log('.env file updated');
};

module.exports = { updateEnvFileAsync };
