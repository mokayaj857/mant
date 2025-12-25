import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const rootDir = join(__dirname, '../..');
const frontendAbiPath = join(rootDir, 'src/contracts');
const contractArtifacts = {
  AvaraCore: join(__dirname, '../artifacts/contracts/avara.sol/AvaraCore.json'),
  POAPNFT: join(__dirname, '../artifacts/contracts/poap.sol/POAPNFT.json'),
  TicketNFT: join(__dirname, '../artifacts/contracts/ticket.sol/TicketNFT.json'),
};

// Ensure the directory exists
try {
  await mkdir(frontendAbiPath, { recursive: true });

  // Copy each ABI
  await Promise.all(
    Object.entries(contractArtifacts).map(async ([name, sourcePath]) => {
      try {
        const fileContent = await readFile(sourcePath, 'utf8');
        const artifact = JSON.parse(fileContent);
        
        await writeFile(
          join(frontendAbiPath, `${name}.json`),
          JSON.stringify({
            abi: artifact.abi,
            bytecode: artifact.bytecode,
            deployedBytecode: artifact.deployedBytecode,
          }, null, 2)
        );
        console.log(`✅ Copied ${name} ABI to frontend`);
      } catch (error) {
        console.error(`❌ Failed to copy ${name} ABI:`, error.message);
      }
    })
  );

  console.log('🎉 ABI export complete!');
} catch (error) {
  console.error('❌ Error during ABI export:', error.message);
  process.exit(1);
}
