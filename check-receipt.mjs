import { JsonRpcProvider } from "near-api-js";

const RPC_URL = "https://rpc.testnet.near.org";
const provider = new JsonRpcProvider({ url: RPC_URL });

const r = await provider.sendJsonRpc("EXPERIMENTAL_tx_status", [
    "3Y5PCbE6yyQDXtCBwadsbk1anULu84gxiLXhvQWzCnkK",
    "f3d5dbb3398e1049620bffeaa88de1ede3b7cc0aae4b6966aa409cd6ae21f67f"
]);
for (const x of r.receipts) {
    console.log(
        x.predecessor_id,
        "->",
        x.receiver_id,
        JSON.stringify(x.receipt.Action?.actions)
    );
}
