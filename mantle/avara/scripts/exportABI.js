const fs = require('fs');
const path = require('path');

// Path to your compiled contract artifacts
const contractArtifact = require('../artifacts/contracts/avara.sol/Avara.json');

// Path to your frontend's abi directory
const frontendAbiPath = path.join(__dirname, '../../../src/abi/');

// Ensure the directory exists
if (!fs.existsSync(frontendAbiPath)) {
  fs.mkdirSync(frontendAbiPath, { recursive: true });
}

// Write the ABI to a file in the frontend
fs.writeFileSync(
  path.join(frontendAbiPath, 'Avara.json'),
  JSON.stringify(contractArtifact.abi, null, 2)
);

console.log('ABI exported to frontend successfully!');
