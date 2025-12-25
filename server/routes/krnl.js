import express from 'express';
import { ethers } from 'ethers';

const router = express.Router();

router.post('/mint-proof', async (req, res) => {
  try {
    const { to, eventId } = req.body;

    if (!to || typeof to !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing required field: to' });
    }

    if (eventId === undefined || eventId === null) {
      return res.status(400).json({ success: false, error: 'Missing required field: eventId' });
    }

    const privateKey = process.env.KRNL_PRIVATE_KEY;
    if (!privateKey) {
      return res.status(500).json({ success: false, error: 'KRNL_PRIVATE_KEY not configured on server' });
    }

    const wallet = new ethers.Wallet(privateKey);
    const signerAddress = await wallet.getAddress();
    const expectedSigner = process.env.KRNL_SIGNER_ADDRESS;
    const signerMismatch =
      !!expectedSigner && signerAddress.toLowerCase() !== expectedSigner.toLowerCase();

    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1_000_000_000);

    // Must match contracts/avara.sol:
    // keccak256(abi.encodePacked(action, ticketId, eventId, account, timestamp, nonce))
    const action = 'MINT';
    const ticketId = 0;

    const packedHash = ethers.solidityPackedKeccak256(
      ['string', 'uint256', 'uint256', 'address', 'uint256', 'uint256'],
      [action, ticketId, BigInt(eventId), to, BigInt(timestamp), BigInt(nonce)]
    );

    // Solidity uses ECDSA.toEthSignedMessageHash(bytes32)
    // ethers.hashMessage(bytes) reproduces "\x19Ethereum Signed Message:\n32" prefix.
    const signature = await wallet.signMessage(ethers.getBytes(packedHash));

    return res.json({
      success: true,
      data: {
        timestamp,
        nonce,
        signature,
        signerAddress,
        signerMismatch,
      },
    });
  } catch (error) {
    console.error('Error creating KRNL mint proof:', error);
    return res.status(500).json({ success: false, error: 'Failed to create mint proof', details: error.message });
  }
});

export default router;
