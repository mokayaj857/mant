import express from 'express';

const router = express.Router();

router.get('/config', (req, res) => {
  const chainId = Number(process.env.CHAIN_ID || 11155111);

  const config = {
    chainId,
    avaraCore: process.env.AVARA_CORE_ADDRESS || null,
    ticketNFT: process.env.TICKET_NFT_ADDRESS || null,
    poapNFT: process.env.POAP_NFT_ADDRESS || null,
    krnlSigner: process.env.KRNL_SIGNER_ADDRESS || null,
    ticketDeployBlock: process.env.TICKET_DEPLOY_BLOCK ? Number(process.env.TICKET_DEPLOY_BLOCK) : null,
  };

  return res.json({ success: true, data: config });
});

export default router;
