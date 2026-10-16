import { createTransaction, PublicKey, JsonRpcProvider } from "near-api-js";
import bs58 from "bs58";
import { deserialize } from "borsh";
import { SCHEMA, actionCreators } from "@near-js/transactions";

const RPC_URL = "https://rpc.testnet.near.org";
const RELAYER_ACCOUNT_ID =
    "f3d5dbb3398e1049620bffeaa88de1ede3b7cc0aae4b6966aa409cd6ae21f67f";

const signedDelegateAction =
    "QAAAADA2NmNhMTAxYzJlMzNjODAwOTA0OTM1YzE4MGNhYTg3YmVjMWM4NmQ4OWM0MTA3ZDg0MDE2MjBlODk2OGRlM2MPAAAAY2FrZWRhZC50ZXN0bmV0AQAAAAMAAACh7czOG8LTAAAAAAAARHSjFmv4AAAFF0gQAAAAAAAGbKEBwuM8gAkEk1wYDKqHvsHIbYnEEH2EAWIOiWjePACgpF21fI6kis3HUA6xEuSr4+ilIj3SePqivSjXUn6BKAM4Wh4oAVTZPoMCwNvuxh8JGKGC89fKFmD1REpBInID";

async function main() {
    const provider = new JsonRpcProvider({ url: RPC_URL });

    const bytes = Buffer.from(RELAYER_ACCOUNT_ID, "hex");
    const relayerPublicKey = new PublicKey({ keyType: 0, data: bytes });
    console.log("Relayer Public Key:", relayerPublicKey.toString());

    const decodedDelegate = deserialize(
        SCHEMA.SignedDelegate,
        Buffer.from(signedDelegateAction, "base64")
    );

    console.log("Decoded Delegate Action:", decodedDelegate);

    let nonce;
    let recentBlockHashBytes;

    try {
        // Attempt to fetch the access key normally
        const accessKey = await provider.viewAccessKey({
            finalityQuery: { finality: "final" },
            accountId: RELAYER_ACCOUNT_ID,
            publicKey: relayerPublicKey
        });

        nonce = BigInt(accessKey.nonce) + BigInt(1);
        const status = await provider.sendJsonRpc("status", []);
        recentBlockHashBytes = bs58.decode(status.sync_info.latest_block_hash);
    } catch (error) {
        // Intercept the missing access key error
        if (error.name === "AccessKeyDoesNotExistError") {
            console.log(
                "Access key doesn't exist. Falling back to default nonce and fetching block height..."
            );

            // 1. Set fallback nonce to 1
            nonce = BigInt(1);

            // 2. Fetch network status to extract the recent block hash safely
            const status = await provider.sendJsonRpc("status", []);
            recentBlockHashBytes = bs58.decode(
                status.sync_info.latest_block_hash
            );
        } else {
            // Rethrow any other unexpected RPC errors
            throw error;
        }
    }

    console.log(`Using Nonce: ${nonce.toString()}`);
    console.log(
        `Using Recent Block Hash: ${Buffer.from(recentBlockHashBytes).toString(
            "hex"
        )}`
    );

    const tx = createTransaction(
        RELAYER_ACCOUNT_ID,
        relayerPublicKey,
        decodedDelegate.delegateAction.senderId,
        nonce,
        [actionCreators.signedDelegate(decodedDelegate)],
        recentBlockHashBytes
    );
    const txBase64 = Buffer.from(tx.encode()).toString("base64");

    console.log(`Built Transaction (Base64): ${txBase64}`);
    console.log("Relayer:", RELAYER_ACCOUNT_ID);
}

main().catch((error) => {
    console.error("Builder failed:", error);
    process.exitCode = 1;
});
