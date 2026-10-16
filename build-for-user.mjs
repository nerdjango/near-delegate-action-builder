import {
    actions,
    PublicKey,
    DelegateAction,
    JsonRpcProvider,
    encodeDelegateAction
} from "near-api-js";

const RPC_URL = "https://rpc.testnet.near.org";
const ACCOUNT_ID =
    "066ca101c2e33c800904935c180caa87bec1c86d89c4107d8401620e8968de3c";

async function main() {
    const provider = new JsonRpcProvider({ url: RPC_URL });

    const bytes = Buffer.from(ACCOUNT_ID, "hex");
    const publicKey = new PublicKey({ keyType: 0, data: bytes });
    console.log("Public Key:", publicKey.toString());

    let nonce;
    let maxBlockHeight;

    try {
        // Attempt to fetch the access key normally
        const accessKey = await provider.viewAccessKey({
            finalityQuery: { finality: "final" },
            accountId: ACCOUNT_ID,
            publicKey
        });

        nonce = BigInt(accessKey.nonce) + BigInt(1);
        maxBlockHeight = BigInt(accessKey.block_height) + BigInt(1000);
    } catch (error) {
        // Intercept the missing access key error
        if (error.name === "AccessKeyDoesNotExistError") {
            console.log(
                "Access key doesn't exist. Falling back to default nonce and fetching block height..."
            );

            // 1. Set fallback nonce to 1
            nonce = BigInt(1);

            // 2. Fetch network status to extract the latest block height safely
            const status = await provider.sendJsonRpc("status", []);
            const currentBlockHeight = status.sync_info.latest_block_height;

            // 3. Compute your maxBlockHeight threshold
            maxBlockHeight = BigInt(currentBlockHeight) + BigInt(1000);
        } else {
            // Rethrow any other unexpected RPC errors
            throw error;
        }
    }

    console.log(`Using Nonce: ${nonce.toString()}`);
    console.log(`Using Max Block Height: ${maxBlockHeight.toString()}`);

    // The user's intended operation: transfer 0.001 NEAR.
    const delegateAction = new DelegateAction({
        senderId: ACCOUNT_ID,
        receiverId: "cakedad.testnet",
        actions: [actions.transfer(10n ** 21n)],
        nonce,
        maxBlockHeight,
        publicKey
    });

    // Encode to Borsh
    const delegateActionBytes = encodeDelegateAction(delegateAction);
    const delegateActionBase64 =
        Buffer.from(delegateActionBytes).toString("base64");

    console.log("Delegate action to be signed:", delegateActionBase64);
    console.log("Sender:", ACCOUNT_ID);
    console.log("Nonce:", nonce.toString());
    console.log("Max Block Height:", maxBlockHeight.toString());
}

main().catch((error) => {
    console.error("Builder failed:", error);
    process.exitCode = 1;
});
