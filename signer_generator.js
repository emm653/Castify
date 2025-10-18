// signer_generator.js (Final Working Script)

// --- 1. IMPORTS ---
// We use ES Modules here since your project is set to "type": "module"
import * as ed from '@noble/ed25519';
import { mnemonicToAccount } from 'viem/accounts';
import { signTypedData } from 'viem';
import axios from 'axios';
import 'dotenv/config'; // Loads .env.local

// --- 2. CONFIGURATION ---
// Your FID MUST be set in .env.local: FARCASTER_APP_FID=12345
// Your DUMMY SEED PHRASE MUST be set in .env.local: FARCASTER_APP_MNEMONIC="..."
const APP_FID = process.env.FARCASTER_APP_FID;
const APP_MNEMONIC = process.env.FARCASTER_APP_MNEMONIC;
const FARCASTER_CLIENT_API = 'https://api.farcaster.xyz';

if (!APP_FID || !APP_MNEMONIC) {
    console.error("❌ CRITICAL ERROR: Please set FARCASTER_APP_FID and FARCASTER_APP_MNEMONIC in your .env.local file.");
    process.exit(1);
}

// --- EIP-712 TYPES (From Farcaster Docs) ---
const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
    name: 'Farcaster SignedKeyRequestValidator',
    version: '1',
    chainId: 10,
    verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553',
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
    { name: 'requestFid', type: 'uint256' },
    { name: 'key', type: 'bytes' },
    { name: 'deadline', type: 'uint256' },
] as const;


async function generateSignerApproval() {
    try {
        console.log("\n🔑 --- Generating Signer Approval URL... --- 🔑");

        // 1. Generate a brand new, unique Ed25519 key pair for this session
        const privateKeyBytes = ed.utils.randomPrivateKey();
        const publicKeyBytes = ed.utils.getPublicKey(privateKeyBytes);
        const key = '0x' + Buffer.from(publicKeyBytes).toString('hex');
        
        // 🚨 CRITICAL: Save this Private Key! Your app needs this to sign casts later.
        console.log(`\n🔑 New Private Key Generated (SAVE THIS!): ${Buffer.from(privateKeyBytes).toString('hex')}`);


        // 2. Generate the EIP-712 Signature using the Custody Address (Mnemonic)
        const account = mnemonicToAccount(APP_MNEMONIC);
        const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours validity

        const signature = await signTypedData({
            account,
            domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
            types: { SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE },
            primaryType: 'SignedKeyRequest',
            message: {
                requestFid: BigInt(APP_FID),
                key,
                deadline: BigInt(deadline),
            },
        });


        // 3. Submit the Signed Request to the Farcaster API to get the Deeplink Token
        const response = await axios.post(`${FARCASTER_CLIENT_API}/v2/signed-key-requests`, {
            key,
            requestFid: Number(APP_FID), // Farcaster API needs a number here
            signature,
            deadline,
        });

        const { deeplinkUrl } = response.data.result.signedKeyRequest;
        
        // --- FINAL OUTPUT ---
        console.log("\n✅ Signer Key Generated. FINAL ACTION:");
        console.log("------------------------------------------");
        console.log(`\nAPPROVAL DEEPLINK URL: ${deeplinkUrl}`);
        console.log("\nCopy this link and tap it on your Android phone to approve the signer in the Farcaster app.");
        console.log("------------------------------------------");
        
    } catch (e) {
        console.error("\n❌ FATAL ERROR IN SIGNER GENERATION.");
        console.error("Please ensure your FID and MNEMONIC are correct in .env.local.");
        console.error(e);
    }
}

generateSignerApproval();