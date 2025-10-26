import axios from "axios";
import env from "#config/env/env.js";

interface WarehouseTariffsBox {
    boxDeliveryBase: string
    boxDeliveryCoefExpr: string
    boxDeliveryLiter: string
    boxDeliveryMarketplaceBase: string
    boxDeliveryMarketplaceCoefExpr: string
    boxDeliveryMarketplaceLiter: string
    boxStorageBase: string
    boxStorageCoefExpr: string
    boxStorageLiter: string
    geoName: string
    warehouseName: string
}

export default class WBService {
    private instance = axios.create({
        baseURL: "https://common-api.wildberries.ru/api",
        headers: {
            "Authorization": `Bearer ${env.WB_TOKEN}`,
        }
    })
    constructor() {}

    async getTariffsBox(date: string): Promise<WarehouseTariffsBox[]> {
        if (!date) throw new Error('Empty date');
        console.log(date);
        if (!(/^\d{4}-\d{2}-\d{2}$/.test(date))) throw new Error('Invalid date format');

        const result = await this.instance.get('/v1/tariffs/box?date=' + date);

        if (result.status !== 200) throw new Error('some problem ' + result.statusText);

        return result.data.response.data.warehouseList;
    }
}