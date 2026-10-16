import { JsonRpcProvider } from "near-api-js";

const RPC_URL = "https://rpc.testnet.near.org";
const provider = new JsonRpcProvider({ url: RPC_URL });

const fmt = (yocto) => (Number(BigInt(yocto) / 10n ** 18n) / 1e6).toFixed(6); // NEAR

for (const id of [
    "066ca101c2e33c800904935c180caa87bec1c86d89c4107d8401620e8968de3c",
    "f3d5dbb3398e1049620bffeaa88de1ede3b7cc0aae4b6966aa409cd6ae21f67f"
]) {
    const a = await provider.query({
        request_type: "view_account",
        finality: "final",
        account_id: id
    });
    console.log(id.slice(0, 8), fmt(a.amount), "NEAR");
}
