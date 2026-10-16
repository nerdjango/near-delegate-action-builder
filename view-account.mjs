import { JsonRpcProvider } from "near-api-js";

const RPC_URL = "https://rpc.testnet.near.org";
const provider = new JsonRpcProvider({ url: RPC_URL });

const fmt = (yocto) => (Number(BigInt(yocto) / 10n ** 18n) / 1e6).toFixed(6); // NEAR

for (const h of [273154490, 273154520]) {
    const a = await provider.query({
        request_type: "view_account",
        block_id: h,
        account_id:
            "f3d5dbb3398e1049620bffeaa88de1ede3b7cc0aae4b6966aa409cd6ae21f67f"
    });
    console.log(h, fmt(a.amount));
}
